import express from 'express';
import prisma from '../database/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Public Contact Form Submission -> Sent to App Inbox
 */
router.post('/public-inbox', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    // Find Super Admin / Admin to receive the inquiry or create inquiry conversation
    const adminUser = await prisma.user.findFirst({
      where: { role: { name: 'Super Administrator' } }
    });

    let conversation = await prisma.conversation.findFirst({
      where: { title: 'Public Website Contact Inquiries' }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          title: 'Public Website Contact Inquiries',
          type: 'GROUP',
          members: adminUser ? { create: [{ userId: adminUser.id }] } : undefined,
        }
      });
    }

    const textContent = `📩 [WEBSITE CONTACT INQUIRY]\nFrom: ${name} (${email}, ${phone || 'No phone'})\nSubject: ${subject || 'General Inquiry'}\nMessage:\n${message}`;

    const msg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: adminUser ? adminUser.id : (await prisma.user.findFirst()).id,
        text: textContent,
      }
    });

    // Create Notification for Admins
    const admins = await prisma.user.findMany({
      where: {
        OR: [
          { role: { name: 'Super Administrator' } },
          { role: { name: 'Administrator' } }
        ]
      }
    });

    for (const adm of admins) {
      await prisma.notification.create({
        data: {
          userId: adm.id,
          type: 'MESSAGE',
          title: `New Contact Inquiry from ${name}`,
          message: textContent.substring(0, 120),
          relatedEntityId: conversation.id,
          entityType: 'conversation',
        }
      });
    }

    return res.status(201).json({ message: 'Your message has been sent successfully to Romantic T Solutions Ltd.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * List Conversations for logged-in user
 */
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const members = await prisma.conversationMember.findMany({
      where: { userId: req.user.id },
      include: {
        conversation: {
          include: {
            members: {
              include: { user: { select: { id: true, fullName: true, profileImage: true, role: { select: { name: true } } } } }
            },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: { sender: { select: { id: true, fullName: true } } }
            }
          }
        }
      },
      orderBy: { conversation: { updatedAt: 'desc' } }
    });

    const conversations = members.map(m => {
      const conv = m.conversation;
      const lastMessage = conv.messages[0] || null;
      const otherMembers = conv.members.filter(cm => cm.userId !== req.user.id);
      
      let title = conv.title;
      if (!title && conv.type === 'DIRECT') {
        title = otherMembers.map(om => om.user.fullName).join(', ') || 'Private Chat';
      }

      return {
        id: conv.id,
        title,
        type: conv.type,
        relatedEntityId: conv.relatedEntityId,
        updatedAt: conv.updatedAt,
        membersCount: conv.members.length,
        members: conv.members,
        lastMessage,
        lastReadAt: m.lastReadAt,
        hasUnread: lastMessage ? new Date(lastMessage.createdAt) > new Date(m.lastReadAt) : false,
      };
    });

    return res.json({ conversations });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Start or Get 1-to-1 Private Conversation
 */
router.post('/conversations/direct', authenticateToken, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'Target User ID required' });

    const existingMemberships = await prisma.conversationMember.findMany({
      where: { userId: { in: [req.user.id, targetUserId] } },
      include: { conversation: { include: { members: true } } }
    });

    const directConv = existingMemberships.find(m => 
      m.conversation.type === 'DIRECT' && 
      m.conversation.members.length === 2 &&
      m.conversation.members.some(cm => cm.userId === targetUserId)
    )?.conversation;

    if (directConv) {
      return res.json(directConv);
    }

    const newConv = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        members: {
          create: [
            { userId: req.user.id },
            { userId: targetUserId }
          ]
        }
      },
      include: { members: { include: { user: true } } }
    });

    return res.status(201).json(newConv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Start Group Conversation with multiple receivers
 */
router.post('/conversations/group', authenticateToken, async (req, res) => {
  try {
    const { title, userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Please select at least one receiver' });
    }

    const uniqueUserIds = Array.from(new Set([req.user.id, ...userIds.filter(Boolean)]));
    const groupTitle = title?.trim() || `Group Chat (${uniqueUserIds.length} members)`;

    const newConv = await prisma.conversation.create({
      data: {
        title: groupTitle,
        type: 'GROUP',
        members: {
          create: uniqueUserIds.map(uId => ({ userId: uId }))
        }
      },
      include: {
        members: {
          include: { user: { select: { id: true, fullName: true, profileImage: true, role: { select: { name: true } } } } }
        }
      }
    });

    // Initial greeting message
    await prisma.message.create({
      data: {
        conversationId: newConv.id,
        senderId: req.user.id,
        text: `💬 ${req.user.fullName || 'User'} started this conversation with ${newConv.members.map(m => m.user?.fullName).join(', ')}.`,
      }
    });

    return res.status(201).json(newConv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Add Member(s) / Receivers to an existing Conversation
 */
router.post('/conversations/:id/members', authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { userIds, userId } = req.body;
    const idsToAdd = Array.isArray(userIds) ? userIds : (userId ? [userId] : []);

    if (idsToAdd.length === 0) {
      return res.status(400).json({ error: 'No user IDs provided to add' });
    }

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true }
    });

    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const addedUsers = [];
    for (const uId of idsToAdd) {
      const alreadyMember = conv.members.some(m => m.userId === uId);
      if (!alreadyMember) {
        await prisma.conversationMember.create({
          data: { conversationId, userId: uId }
        }).catch(() => {});

        const u = await prisma.user.findUnique({ where: { id: uId }, select: { fullName: true } }).catch(() => null);
        if (u) addedUsers.push(u.fullName);
      }
    }

    if (addedUsers.length > 0) {
      // If was DIRECT, convert to GROUP
      if (conv.type === 'DIRECT') {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { type: 'GROUP' }
        }).catch(() => {});
      }

      await prisma.message.create({
        data: {
          conversationId,
          senderId: req.user.id,
          text: `➕ ${req.user.fullName || 'User'} added ${addedUsers.join(', ')} to the chat.`,
        }
      }).catch(() => {});
    }

    const updatedConv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: { user: { select: { id: true, fullName: true, profileImage: true, role: { select: { name: true } } } } }
        }
      }
    });

    return res.json(updatedConv);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Get Message History + Read/Seen Tracking details for a Conversation
 */
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const conversationId = req.params.id;

    const membership = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: req.user.id } }
    });

    if (!membership && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    const [conversation, messages] = await Promise.all([
      prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          members: {
            include: { user: { select: { id: true, fullName: true, profileImage: true, role: { select: { name: true } } } } }
          }
        }
      }),
      prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: { select: { id: true, fullName: true, profileImage: true } },
          reads: {
            include: { user: { select: { id: true, fullName: true } } }
          }
        },
        orderBy: { createdAt: 'asc' },
      })
    ]);

    await prisma.conversationMember.upsert({
      where: { conversationId_userId: { conversationId, userId: req.user.id } },
      update: { lastReadAt: new Date() },
      create: { conversationId, userId: req.user.id }
    });

    const formattedMessages = messages.map(msg => {
      const seenUsers = msg.reads.map(r => ({
        id: r.user.id,
        name: r.user.fullName,
        readAt: r.readAt,
      }));

      return {
        ...msg,
        attachments: JSON.parse(msg.attachments || '[]'),
        seenByCount: seenUsers.length,
        seenByTotal: conversation.members.length,
        seenSummary: `${seenUsers.length}/${conversation.members.length}`,
        seenUsers,
      };
    });

    return res.json({
      conversation,
      messages: formattedMessages,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Helper to execute message sending
 */
async function executeSendMessage(req, res, conversationId, text, attachments) {
  try {
    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }
    if (!text && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message content or attachment is required' });
    }

    // Verify conversation exists
    let conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    }).catch(() => null);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation thread not found' });
    }

    // Auto-ensure user membership in conversation
    await prisma.conversationMember.upsert({
      where: { conversationId_userId: { conversationId, userId: req.user.id } },
      update: { lastReadAt: new Date() },
      create: { conversationId, userId: req.user.id }
    }).catch(() => {});

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: req.user.id,
        text: text || '',
        attachments: JSON.stringify(Array.isArray(attachments) ? attachments : []),
      },
      include: {
        sender: { select: { id: true, fullName: true, profileImage: true } }
      }
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    }).catch(() => {});

    await prisma.messageRead.upsert({
      where: { messageId_userId: { messageId: message.id, userId: req.user.id } },
      update: { readAt: new Date() },
      create: {
        messageId: message.id,
        userId: req.user.id,
      }
    }).catch(() => {});

    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`conversation_${conversationId}`).emit('new_message', {
          ...message,
          attachments: JSON.parse(message.attachments || '[]'),
        });
      }
    } catch {}

    return res.status(201).json({
      ...message,
      attachments: JSON.parse(message.attachments || '[]'),
    });
  } catch (err) {
    console.error('Send message error:', err);
    return res.status(500).json({ error: 'Failed to send message: ' + (err.message || 'Server error') });
  }
}

/**
 * Send Message: Route 1 - /conversations/:id/messages
 */
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
  return executeSendMessage(req, res, req.params.id, req.body.text, req.body.attachments);
});

/**
 * Send Message: Route 2 - /send
 */
router.post('/send', authenticateToken, async (req, res) => {
  return executeSendMessage(req, res, req.body.conversationId, req.body.text, req.body.attachments);
});

/**
 * Send Message: Route 3 - POST /
 */
router.post('/', authenticateToken, async (req, res) => {
  return executeSendMessage(req, res, req.body.conversationId, req.body.text, req.body.attachments);
});

/**
 * Mark Message(s) as Read / Seen
 */
router.post('/read', authenticateToken, async (req, res) => {
  try {
    const { messageIds } = req.body;
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: 'Message IDs array required' });
    }

    for (const msgId of messageIds) {
      await prisma.messageRead.upsert({
        where: { messageId_userId: { messageId: msgId, userId: req.user.id } },
        update: {},
        create: { messageId: msgId, userId: req.user.id }
      });
    }

    return res.json({ message: 'Marked as read' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
