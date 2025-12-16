const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { validateMessage } = require('../middleware/validation');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

// Helper function to transform image URL
const transformImageUrl = (image) => {
  if (!image) return null;
  return process.env.CLOUDINARY_CLOUD_NAME 
    ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${image}` 
    : `https://egbackend-1.onrender.com/${image}`;
};

// Get user's conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    logger.info(`Fetching conversations for user ${req.user.id}`);
    
    // Get all messages where the user is either sender or recipient
    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: req.user.id },
          { recipientId: req.user.id }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group messages by conversation
    const conversationsMap = new Map();
    messages.forEach(message => {
      const isUserSender = message.senderId === req.user.id;
      const otherUserId = isUserSender ? message.recipientId : message.senderId;
      const otherUser = isUserSender ? message.recipient : message.sender;

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          id: otherUserId,
          recipientId: otherUserId,
          recipientName: otherUser.name,
          recipientImage: transformImageUrl(otherUser.image),
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: isUserSender ? 0 : (message.read ? 0 : 1)
        });
      } else if (!message.read && !isUserSender) {
        const conv = conversationsMap.get(otherUserId);
        conv.unreadCount += 1;
      }
    });

    const conversations = Array.from(conversationsMap.values());
    logger.info(`Successfully fetched ${conversations.length} conversations for user ${req.user.id}`);
    res.json(conversations);
  } catch (error) {
    logger.error('Failed to fetch conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific conversation
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    logger.info(`Fetching messages between users ${req.user.id} and ${userId}`);

    // Verify that the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userExists) {
      logger.warn(`User ${userId} not found`);
      return res.status(404).json({ error: 'User not found' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          {
            AND: [
              { senderId: req.user.id },
              { recipientId: userId }
            ]
          },
          {
            AND: [
              { senderId: userId },
              { recipientId: req.user.id }
            ]
          }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Transform messages to include proper image URLs
    const transformedMessages = messages.map(message => ({
      ...message,
      sender: {
        ...message.sender,
        image: transformImageUrl(message.sender.image)
      },
      recipient: {
        ...message.recipient,
        image: transformImageUrl(message.recipient.image)
      }
    }));

    // Mark unread messages as read
    await prisma.chatMessage.updateMany({
      where: {
        senderId: userId,
        recipientId: req.user.id,
        read: false
      },
      data: {
        read: true
      }
    });

    logger.info(`Successfully fetched ${messages.length} messages between users ${req.user.id} and ${userId}`);
    res.json(transformedMessages);
  } catch (error) {
    logger.error('Failed to fetch messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create a new message
router.post('/', auth, validateMessage, async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    logger.info(`Creating message from user ${req.user.id} to user ${recipientId}`);

    // Verify that the recipient exists
    const recipientExists = await prisma.user.findUnique({
      where: { id: recipientId }
    });

    if (!recipientExists) {
      logger.warn(`Recipient ${recipientId} not found`);
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        content,
        senderId: req.user.id,
        recipientId,
        read: false
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    // Transform the message to include proper image URLs
    const transformedMessage = {
      ...message,
      sender: {
        ...message.sender,
        image: transformImageUrl(message.sender.image)
      },
      recipient: {
        ...message.recipient,
        image: transformImageUrl(message.recipient.image)
      }
    };

    logger.info(`Successfully created message ${message.id}`);
    res.status(201).json(transformedMessage);
  } catch (error) {
    logger.error('Failed to create message:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
});

// Mark messages as read
router.put('/read/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    logger.info(`Marking messages as read from user ${userId} to user ${req.user.id}`);

    const result = await prisma.chatMessage.updateMany({
      where: {
        senderId: userId,
        recipientId: req.user.id,
        read: false
      },
      data: {
        read: true
      }
    });

    logger.info(`Successfully marked ${result.count} messages as read`);
    res.json({ message: 'Messages marked as read', count: result.count });
  } catch (error) {
    logger.error('Failed to mark messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Delete a message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    logger.info(`Attempting to delete message ${messageId}`);

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      logger.warn(`Message ${messageId} not found`);
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId !== req.user.id) {
      logger.warn(`User ${req.user.id} attempted to delete message ${messageId} they don't own`);
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.chatMessage.delete({
      where: { id: messageId }
    });

    logger.info(`Successfully deleted message ${messageId}`);
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    logger.error('Failed to delete message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Get a single message by ID
router.get('/:messageId', auth, async (req, res) => {
  try {
    const { messageId } = req.params;
    logger.info(`Fetching message ${messageId}`);

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    if (!message) {
      logger.warn(`Message ${messageId} not found`);
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check if the user is either the sender or recipient
    if (message.senderId !== req.user.id && message.recipientId !== req.user.id) {
      logger.warn(`User ${req.user.id} attempted to access message ${messageId} they don't have access to`);
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Transform the message to include proper image URLs
    const transformedMessage = {
      ...message,
      sender: {
        ...message.sender,
        image: transformImageUrl(message.sender.image)
      },
      recipient: {
        ...message.recipient,
        image: transformImageUrl(message.recipient.image)
      }
    };

    logger.info(`Successfully fetched message ${messageId}`);
    res.json(transformedMessage);
  } catch (error) {
    logger.error('Failed to fetch message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

module.exports = router; 