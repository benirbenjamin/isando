import express from 'express';
import prisma from '../database/prisma.js';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();

/**
 * List tasks (supports filtering by event, my tasks, status)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { eventId, status, myTasksOnly } = req.query;
    const where = {};

    if (eventId) where.eventId = eventId;
    if (status) where.status = status;

    if (myTasksOnly === 'true' || (!req.user.isAdmin && myTasksOnly !== 'false')) {
      where.OR = [
        { assignedUserId: req.user.id },
        { assignedRoleId: req.user.roleId },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedUser: { select: { id: true, fullName: true, email: true, profileImage: true } },
        createdBy: { select: { id: true, fullName: true } },
        event: { select: { id: true, name: true, venue: true, date: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ tasks });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Create task
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, assignedUserId, assignedRoleId, eventId, priority, dueTime } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        assignedUserId: assignedUserId || null,
        assignedRoleId: assignedRoleId || null,
        eventId: eventId || null,
        priority: priority || 'MEDIUM',
        dueTime: dueTime ? new Date(dueTime) : null,
        createdById: req.user.id,
        status: 'PENDING',
      },
      include: {
        assignedUser: { select: { id: true, fullName: true } },
        event: { select: { id: true, name: true } }
      }
    });

    if (assignedUserId) {
      await prisma.notification.create({
        data: {
          userId: assignedUserId,
          type: 'TASK',
          title: 'New Task Assigned',
          message: `Task: ${title}`,
          relatedEntityId: task.id,
          entityType: 'task',
        }
      });
    }

    return res.status(201).json(task);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Update Task status
 */
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid task status' });
    }

    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Check if user is assigned or admin
    if (!req.user.isAdmin && task.assignedUserId !== req.user.id && task.assignedRoleId !== req.user.roleId) {
      return res.status(403).json({ error: 'You are not authorized to update this task' });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      }
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
