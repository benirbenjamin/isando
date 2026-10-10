import express from 'express';
import prisma from '../database/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

async function checkAndSendUpcomingEventReminders() {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const upcomingEvents = await prisma.event.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      },
      include: {
        assignments: true,
      }
    });

    const now = Date.now();

    for (const evt of upcomingEvents) {
      if (!evt.startTime) continue;

      let hours = 0;
      let minutes = 0;
      const raw = evt.startTime.trim().toUpperCase();
      const isPM = raw.includes('PM');
      const isAM = raw.includes('AM');
      const cleanTime = raw.replace(/[^\d:]/g, '');
      const parts = cleanTime.split(':').map(Number);
      if (parts.length >= 2) {
        hours = parts[0];
        minutes = parts[1];
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
      } else {
        continue;
      }

      const evtTime = new Date(evt.date);
      evtTime.setHours(hours, minutes, 0, 0);

      const diffMinutes = (evtTime.getTime() - now) / 60000;

      // When event starts within 10 minutes (between -15 and +10 min)
      if (diffMinutes <= 10 && diffMinutes >= -15) {
        const recipientUserIds = new Set();
        if (evt.createdById) recipientUserIds.add(evt.createdById);
        if (evt.managerId) recipientUserIds.add(evt.managerId);
        if (Array.isArray(evt.assignments)) {
          evt.assignments.forEach(a => recipientUserIds.add(a.userId));
        }

        const superAdmins = await prisma.user.findMany({
          where: {
            OR: [
              { email: { in: ['romantictsolutions@gmail.com', 'benirabok@gmail.com'] } },
              { role: { name: 'Super Administrator' } }
            ]
          },
          select: { id: true }
        }).catch(() => []);
        superAdmins.forEach(sa => recipientUserIds.add(sa.id));

        for (const uid of recipientUserIds) {
          const existingNotif = await prisma.notification.findFirst({
            where: {
              userId: uid,
              relatedEntityId: evt.id,
              type: 'EVENT_REMINDER'
            }
          });

          if (!existingNotif) {
            await prisma.notification.create({
              data: {
                userId: uid,
                type: 'EVENT_REMINDER',
                title: `⏰ Event Starting in 10 Min: ${evt.name}`,
                message: `${evt.name} at ${evt.venue} starts soon at ${evt.startTime}. Please report to your assigned duties!`,
                relatedEntityId: evt.id,
                entityType: 'event',
                isRead: false
              }
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Upcoming event reminder notice:', err.message);
  }
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    // Automatically trigger upcoming event reminders 10 minutes before start time
    await checkAndSendUpcomingEventReminders();

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;
    return res.json({ unreadCount, notifications });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    return res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
