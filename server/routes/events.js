import express from 'express';
import prisma from '../database/prisma.js';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();

/**
 * Helper to compute event status dynamically based on current time
 * PLANNING -> LIVE (when now >= start and now <= end)
 * LIVE -> COMPLETED (when now > end)
 */
function computeDynamicEventStatus(event) {
  if (event.status === 'CANCELLED') return 'CANCELLED';
  if (!event.date) return event.status || 'PLANNING';

  try {
    const eventDate = new Date(event.date);
    const now = new Date();

    const parseTimeToMinutes = (tStr) => {
      if (!tStr) return null;
      const match = tStr.toString().trim().match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    const startMins = parseTimeToMinutes(event.startTime);
    const endMins = parseTimeToMinutes(event.endTime);

    const year = eventDate.getFullYear();
    const month = eventDate.getMonth();
    const day = eventDate.getDate();

    const startDateTime = new Date(year, month, day, startMins !== null ? Math.floor(startMins / 60) : 0, startMins !== null ? (startMins % 60) : 0, 0);
    const endDateTime = new Date(year, month, day, endMins !== null ? Math.floor(endMins / 60) : 23, endMins !== null ? (endMins % 60) : 59, 59);

    if (endDateTime < startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    if (now >= startDateTime && now <= endDateTime) {
      return 'LIVE';
    } else if (now > endDateTime) {
      return 'COMPLETED';
    } else {
      return 'PLANNING';
    }
  } catch (e) {
    return event.status || 'PLANNING';
  }
}

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

    // Auto-sync status transitions based on date/time
    const syncedEvents = await Promise.all(
      events.map(async (evt) => {
        const computedStatus = computeDynamicEventStatus(evt);
        if (computedStatus !== evt.status && evt.status !== 'CANCELLED') {
          await prisma.event.update({
            where: { id: evt.id },
            data: { status: computedStatus }
          }).catch(() => {});
          return { ...evt, status: computedStatus };
        }
        return evt;
      })
    );

    return res.json({ events: syncedEvents });
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

    // Auto-sync dynamic status if needed
    let currentStatus = event.status;
    const computedStatus = computeDynamicEventStatus(event);
    if (computedStatus !== event.status && event.status !== 'CANCELLED') {
      await prisma.event.update({
        where: { id: event.id },
        data: { status: computedStatus }
      }).catch(() => {});
      currentStatus = computedStatus;
    }

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
    let messages = [];
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

      if (eventConversation) {
        messages = await prisma.message.findMany({
          where: { conversationId: eventConversation.id },
          include: {
            sender: { select: { id: true, fullName: true, profileImage: true, role: { select: { name: true } } } }
          },
          orderBy: { createdAt: 'asc' },
          take: 100,
        });
      }
    } catch (cErr) {
      console.warn('Event chat setup notice:', cErr.message);
    }

    return res.json({
      event: {
        ...event,
        status: currentStatus,
        conversationId: eventConversation?.id || null,
        messages,
      },
      commandCenter: {
        conversationId: eventConversation?.id || null,
        messages,
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

    // Create dedicated event chat room immediately upon event creation
    try {
      const eventConv = await prisma.conversation.create({
        data: {
          title: `🎉 ${event.name} - Event Team Chat`,
          type: 'EVENT',
          relatedEntityId: event.id,
          members: {
            create: [
              { userId: req.user.id },
              ...(managerId && managerId !== req.user.id ? [{ userId: managerId }] : [])
            ]
          }
        }
      });

      // Post initial welcome message
      await prisma.message.create({
        data: {
          conversationId: eventConv.id,
          senderId: req.user.id,
          text: `🎉 Welcome to the official Event Command Team Chat for "${event.name}"!\n📅 Date: ${new Date(date).toLocaleDateString()}\n📍 Venue: ${venue}\n👥 Team coordination, duty reporting, and live updates begin here.`,
        }
      });
    } catch (chatRoomErr) {
      console.warn('Auto event room setup notice:', chatRoomErr.message);
    }

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

    // Auto-add assigned worker to event's team conversation
    try {
      const eventConv = await prisma.conversation.findFirst({
        where: { relatedEntityId: req.params.id, type: 'EVENT' }
      });
      if (eventConv) {
        await prisma.conversationMember.upsert({
          where: { conversationId_userId: { conversationId: eventConv.id, userId } },
          update: {},
          create: { conversationId: eventConv.id, userId },
        }).catch(() => {});

        await prisma.message.create({
          data: {
            conversationId: eventConv.id,
            senderId: req.user.id,
            text: `👋 ${assignment.user?.fullName || 'A team member'} has been assigned to this event as: ${roleName}. Welcome to the crew!`,
          }
        }).catch(() => {});
      }
    } catch (cErr) {
      console.warn('Assign worker chat link notice:', cErr.message);
    }

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
    const { action, userId: targetUserId } = req.body; // 'CHECK_IN' or 'CHECK_OUT'
    const eventId = req.params.id;

    // Allow manager/admin to check in another worker, or worker checking in themselves
    const canManage = req.user.isAdmin || (Array.isArray(req.user.permissions) && (req.user.permissions.includes('events.manage') || req.user.permissions.includes('*')));
    const userId = (targetUserId && canManage) ? targetUserId : req.user.id;

    const assignment = await prisma.eventAssignment.findUnique({
      where: { eventId_userId: { eventId, userId } },
      include: { user: true }
    });

    if (!assignment && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Worker is not assigned to this event' });
    }

    const now = new Date();
    let updated;

    if (action === 'CHECK_OUT') {
      updated = await prisma.eventAssignment.update({
        where: { eventId_userId: { eventId, userId } },
        data: {
          checkOutTime: now,
        },
        include: { user: true }
      });
    } else {
      updated = await prisma.eventAssignment.update({
        where: { eventId_userId: { eventId, userId } },
        data: {
          checkInTime: now,
          status: 'PRESENT',
        },
        include: { user: true }
      });
    }

    // Auto-record attendance event in team chat for transparency
    try {
      const eventConv = await prisma.conversation.findFirst({
        where: { relatedEntityId: eventId, type: 'EVENT' }
      });
      if (eventConv) {
        const workerName = updated.user?.fullName || 'Worker';
        const actionStr = action === 'CHECK_OUT' ? 'checked out' : `checked in on-site (${updated.roleName})`;
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        await prisma.message.create({
          data: {
            conversationId: eventConv.id,
            senderId: req.user.id,
            text: `📍 [ATTENDANCE] ${workerName} ${actionStr} at ${timeStr}.`,
          }
        }).catch(() => {});
      }
    } catch (cErr) {
      console.warn('Attendance chat post notice:', cErr.message);
    }

    return res.json({
      message: action === 'CHECK_OUT' ? 'Checked out successfully' : 'Checked in successfully',
      assignment: updated,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Delete Event
 */
router.delete('/:id', authenticateToken, hasPermission('events.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Delete tasks associated with event
    await prisma.task.deleteMany({ where: { eventId: id } }).catch(() => {});

    // Delete assignments associated with event
    await prisma.eventAssignment.deleteMany({ where: { eventId: id } }).catch(() => {});

    // Delete linked event conversation and its messages
    try {
      const convs = await prisma.conversation.findMany({
        where: { relatedEntityId: id, type: 'EVENT' }
      });
      for (const conv of convs) {
        const msgs = await prisma.message.findMany({ where: { conversationId: conv.id }, select: { id: true } });
        const msgIds = msgs.map(m => m.id);
        if (msgIds.length > 0) {
          await prisma.messageRead.deleteMany({ where: { messageId: { in: msgIds } } }).catch(() => {});
        }
        await prisma.message.deleteMany({ where: { conversationId: conv.id } }).catch(() => {});
        await prisma.conversationMember.deleteMany({ where: { conversationId: conv.id } }).catch(() => {});
        await prisma.conversation.delete({ where: { id: conv.id } }).catch(() => {});
      }
    } catch (cErr) {
      console.warn('Delete conversation notice:', cErr.message);
    }

    // Delete notifications related to this event
    await prisma.notification.deleteMany({
      where: { relatedEntityId: id, entityType: 'event' }
    }).catch(() => {});

    // Delete the event
    await prisma.event.delete({ where: { id } });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'EVENT_DELETED',
        entity: 'Event',
        entityId: id,
        metadata: JSON.stringify({ name: event.name, client: event.clientName }),
      }
    }).catch(() => {});

    return res.json({ message: 'Event deleted successfully', id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
