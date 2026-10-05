import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * List announcements targeting current user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { eventAssignments: true }
    });

    const userEventIds = user?.eventAssignments.map(ea => ea.eventId) || [];

    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { targetAudience: 'EVERYONE' },
          { targetAudience: 'DEPARTMENT', targetId: user?.departmentId },
          { targetAudience: 'ROLE', targetId: user?.roleId },
          { targetAudience: 'EVENT_TEAM', targetId: { in: userEventIds } },
          { targetAudience: 'USERS', targetId: user?.id },
        ]
      },
      include: {
        createdBy: { select: { id: true, fullName: true, profileImage: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ announcements });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Create announcement & start conversation thread
 */
router.post('/', authenticateToken, hasPermission('announcements.create'), async (req, res) => {
  try {
    const { title, message, targetAudience, targetId, priority, relatedEventId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Announcement title and message are required' });
    }

    // 1. Create linked Conversation Thread
    const conversation = await prisma.conversation.create({
      data: {
        title: `Announcement: ${title}`,
        type: 'ANNOUNCEMENT',
        relatedEntityId: relatedEventId || null,
        members: {
          create: [{ userId: req.user.id }]
        }
      }
    });

    // 2. Create Announcement
    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        targetAudience: targetAudience || 'EVERYONE',
        targetId: targetId || null,
        priority: priority || 'NORMAL',
        relatedEventId: relatedEventId || null,
        conversationId: conversation.id,
        createdById: req.user.id,
      },
      include: { createdBy: true }
    });

    // 3. Find Target Users for notifications
    let targetUsers = [];
    const audience = targetAudience || 'EVERYONE';

    if (audience === 'EVERYONE') {
      targetUsers = await prisma.user.findMany({ where: { status: 'ACTIVE' } });
    } else if (audience === 'DEPARTMENT' && targetId) {
      targetUsers = await prisma.user.findMany({ where: { departmentId: targetId, status: 'ACTIVE' } });
    } else if (audience === 'ROLE' && targetId) {
      targetUsers = await prisma.user.findMany({ where: { roleId: targetId, status: 'ACTIVE' } });
    } else if (audience === 'EVENT_TEAM' && targetId) {
      const assignments = await prisma.eventAssignment.findMany({ where: { eventId: targetId } });
      const userIds = assignments.map(a => a.userId);
      targetUsers = await prisma.user.findMany({ where: { id: { in: userIds }, status: 'ACTIVE' } });
    } else if (audience === 'USERS' && targetId) {
      targetUsers = await prisma.user.findMany({ where: { id: targetId, status: 'ACTIVE' } });
    }

    // Add target users to conversation members and create notifications
    for (const tu of targetUsers) {
      if (tu.id !== req.user.id) {
        await prisma.conversationMember.upsert({
          where: { conversationId_userId: { conversationId: conversation.id, userId: tu.id } },
          update: {},
          create: { conversationId: conversation.id, userId: tu.id }
        });

        await prisma.notification.create({
          data: {
            userId: tu.id,
            type: 'ANNOUNCEMENT',
            title: `Announcement: ${title}`,
            message: message.substring(0, 100),
            relatedEntityId: announcement.id,
            entityType: 'announcement',
          }
        });
      }
    }

    return res.status(201).json(announcement);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
