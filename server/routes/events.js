import express from 'express';
import prisma from '../database/prisma.js';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();

/**
 * List events
 */
router.get('/', authenticateToken, hasPermission('events.view'), async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    const where = {};
    if (status) where.status = status;

    // Filter events if user is not admin and is assigned to specific events
    if (!req.user.isAdmin) {
      where.OR = [
        { managerId: req.user.id },
        { assignments: { some: { userId: req.user.id } } },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        manager: { select: { id: true, fullName: true, phone: true, profileImage: true } },
        assignments: {
          include: { user: { select: { id: true, fullName: true, phone: true, profileImage: true } } }
        },
        tasks: true,
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit, 10),
    });

    return res.json({ events });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Get Event Command Center status & details
 */
router.get('/:id', authenticateToken, hasPermission('events.view'), async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        manager: { select: { id: true, fullName: true, phone: true, profileImage: true } },
        createdBy: { select: { id: true, fullName: true } },
        assignments: {
          include: {
            user: { select: { id: true, fullName: true, phone: true, email: true, profileImage: true } }
          }
        },
        tasks: {
          include: {
            assignedUser: { select: { id: true, fullName: true } }
          }
        }
      }
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Aggregate team status per role
    const teamRoleStats = {};
    let totalAssigned = event.assignments.length;
    let totalCheckedIn = 0;

    for (const assign of event.assignments) {
      const roleName = assign.roleName || 'Worker';
      if (!teamRoleStats[roleName]) {
        teamRoleStats[roleName] = { total: 0, active: 0, workers: [] };
      }
      teamRoleStats[roleName].total += 1;
      if (assign.status === 'PRESENT' || assign.checkInTime) {
        teamRoleStats[roleName].active += 1;
        totalCheckedIn += 1;
      }
      teamRoleStats[roleName].workers.push(assign);
    }

    // Task completion metrics
    const taskStats = {
      total: event.tasks.length,
      pending: event.tasks.filter(t => t.status === 'PENDING').length,
      inProgress: event.tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: event.tasks.filter(t => t.status === 'COMPLETED').length,
      blocked: event.tasks.filter(t => t.status === 'BLOCKED').length,
    };

    // Ensure linked team discussion conversation exists for event
    let eventConversation = null;
    try {
      eventConversation = await prisma.conversation.findFirst({
        where: { relatedEntityId: event.id, type: 'EVENT' }
      });
      if (!eventConversation) {
        eventConversation = await prisma.conversation.create({
          data: {
            title: `${event.name} - Event Team Chat`,
            type: 'EVENT',
            relatedEntityId: event.id,
            members: {
              create: [
                { userId: req.user.id },
                ...event.assignments.map(a => ({ userId: a.userId }))
              ]
            }
          }
        });
      }
    } catch (cErr) {
      console.warn('Event chat setup notice:', cErr.message);
    }

    return res.json({
      event: {
        ...event,
        conversationId: eventConversation?.id || null,
      },
      commandCenter: {
        conversationId: eventConversation?.id || null,
        teamRoleStats,
        attendance: {
          totalAssigned,
          totalCheckedIn,
          percentage: totalAssigned > 0 ? Math.round((totalCheckedIn / totalAssigned) * 100) : 0,
        },
        taskStats,
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Create Event
 */
router.post('/', authenticateToken, hasPermission('events.create'), async (req, res) => {
  try {
    const { name, clientName, clientPhone, eventType, venue, date, startTime, endTime, description, managerId } = req.body;

    if (!name || !clientName || !clientPhone || !venue || !date) {
      return res.status(400).json({ error: 'Event name, client details, venue, and date are required' });
    }

    const event = await prisma.event.create({
      data: {
        name,
        clientName,
        clientPhone,
        eventType: eventType || 'Wedding',
        venue,
        date: new Date(date),
        startTime: startTime || null,
        endTime: endTime || null,
        description: description || null,
        managerId: managerId || req.user.id,
        createdById: req.user.id,
        status: 'PLANNING',
      },
      include: { manager: true }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'EVENT_CREATED',
        entity: 'Event',
        entityId: event.id,
        metadata: JSON.stringify({ name: event.name, venue: event.venue }),
      }
    });

    return res.status(201).json(event);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Update Event Status or Info
 */
router.put('/:id', authenticateToken, hasPermission('events.manage'), async (req, res) => {
  try {
    const { name, clientName, clientPhone, eventType, venue, date, startTime, endTime, description, status, managerId } = req.body;

    const updated = await prisma.event.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(clientName && { clientName }),
        ...(clientPhone && { clientPhone }),
        ...(eventType && { eventType }),
        ...(venue && { venue }),
        ...(date && { date: new Date(date) }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(managerId && { managerId }),
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'EVENT_UPDATED',
        entity: 'Event',
        entityId: updated.id,
        metadata: JSON.stringify({ status: updated.status }),
      }
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Assign Worker to Event
 */
router.post('/:id/assign', authenticateToken, hasPermission('events.manage'), async (req, res) => {
  try {
    const { userId, roleName } = req.body;
    if (!userId || !roleName) {
      return res.status(400).json({ error: 'User ID and Role Name are required' });
    }

    const assignment = await prisma.eventAssignment.upsert({
      where: {
        eventId_userId: {
          eventId: req.params.id,
          userId,
        }
      },
      update: { roleName, status: 'ASSIGNED' },
      create: {
        eventId: req.params.id,
        userId,
        roleName,
        status: 'ASSIGNED',
      },
      include: { user: true }
    });

    // Create Notification for worker
    await prisma.notification.create({
      data: {
        userId,
        type: 'EVENT',
        title: 'Assigned to Event',
        message: `You have been assigned as ${roleName} for an upcoming event.`,
        relatedEntityId: req.params.id,
        entityType: 'event',
      }
    });

    return res.status(201).json(assignment);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Worker Event Check-In / Check-Out
 */
router.post('/:id/check-in', authenticateToken, async (req, res) => {
  try {
    const { action } = req.body; // 'CHECK_IN' or 'CHECK_OUT'
    const eventId = req.params.id;
    const userId = req.user.id;

    const assignment = await prisma.eventAssignment.findUnique({
      where: { eventId_userId: { eventId, userId } }
    });

    if (!assignment && !req.user.isAdmin) {
      return res.status(403).json({ error: 'You are not assigned to this event' });
    }

    const now = new Date();
    let updated;

    if (action === 'CHECK_OUT') {
      updated = await prisma.eventAssignment.update({
        where: { eventId_userId: { eventId, userId } },
        data: {
          checkOutTime: now,
        }
      });
    } else {
      updated = await prisma.eventAssignment.update({
        where: { eventId_userId: { eventId, userId } },
        data: {
          checkInTime: now,
          status: 'PRESENT',
        }
      });
    }

    return res.json({
      message: action === 'CHECK_OUT' ? 'Checked out successfully' : 'Checked in successfully',
      assignment: updated,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
