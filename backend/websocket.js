const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const url = require('url');
const { logger } = require('./utils/logger');

const prisma = new PrismaClient();

// Helper function to transform image URL
const transformImageUrl = (image) => {
  if (!image) return null;
  return process.env.CLOUDINARY_CLOUD_NAME 
    ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${image}` 
    : `https://egbackend-1.onrender.com/${image}`;
};

function setupWebSocket(server, path = '/ws') {
  const wss = new WebSocket.Server({ 
    server,
    path,
    verifyClient: async (info, callback) => {
      try {
        const { query } = url.parse(info.req.url, true);
        const token = query.token;

        if (!token) {
          logger.warn('WebSocket connection attempt without token');
          callback(false, 401, 'No authentication token provided');
          return;
        }

        // Verify token
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await prisma.user.findUnique({
            where: { id: decoded.id }
          });

          if (!user) {
            logger.warn(`WebSocket connection attempt with invalid user ID: ${decoded.id}`);
            callback(false, 401, 'Invalid user');
            return;
          }

          // Store user info in request object
          info.req.user = user;
          callback(true);
        } catch (jwtError) {
          logger.error('JWT verification error:', jwtError);
          callback(false, 401, 'Invalid token');
        }
      } catch (error) {
        logger.error('WebSocket verification error:', error);
        callback(false, 401, 'Authentication failed');
      }
    }
  });
  
  // Store connected clients with their user info
  const clients = new Map();

  // Set up heartbeat interval to check for stale connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        logger.info('Terminating inactive WebSocket connection');
        return ws.terminate();
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', async (ws, req) => {
    try {
      const user = req.user;
      logger.info(`WebSocket connection established for user ${user.id}`);

      // Store client connection with user info
      clients.set(ws, {
        userId: user.id,
        role: user.role
      });

      // Initialize connection state
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Send connection status
      ws.send(JSON.stringify({
        type: 'CONNECTION_STATUS',
        status: 'connected'
      }));

      // Send unread message count
      const unreadCount = await prisma.chatMessage.count({
        where: {
          recipientId: user.id,
          read: false
        }
      });

      ws.send(JSON.stringify({
        type: 'UNREAD_COUNT',
        count: unreadCount
      }));

      // Handle incoming messages
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          switch (data.type) {
            case 'PING':
              ws.send(JSON.stringify({ type: 'PONG' }));
              break;

            case 'CHAT_MESSAGE':
              // Handle chat messages
              const { recipientId, content } = data;
              
              // Verify recipient exists
              const recipient = await prisma.user.findUnique({
                where: { id: recipientId }
              });

              if (!recipient) {
                logger.warn(`Attempt to send message to non-existent user: ${recipientId}`);
                ws.send(JSON.stringify({
                  type: 'ERROR',
                  message: 'Recipient not found'
                }));
                return;
              }
              
              // Save message to database with complete user details
              const chatMessage = await prisma.chatMessage.create({
                data: {
                  content,
                  senderId: user.id,
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

              // Transform message to include proper image URLs
              const transformedMessage = {
                ...chatMessage,
                sender: {
                  ...chatMessage.sender,
                  image: transformImageUrl(chatMessage.sender.image)
                },
                recipient: {
                  ...chatMessage.recipient,
                  image: transformImageUrl(chatMessage.recipient.image)
                }
              };

              // Create notification for the recipient
              await prisma.notification.create({
                data: {
                  userId: recipientId,
                  title: 'New Message',
                  message: `You have a new message from ${user.name}`,
                  data: JSON.stringify({
                    type: 'CHAT',
                    messageId: chatMessage.id,
                    senderId: user.id,
                    senderName: user.name,
                    senderImage: user.image,
                    content: content.substring(0, 50) + (content.length > 50 ? '...' : '')
                  })
                }
              });

              // Send to recipient if online
              let recipientOnline = false;
              for (const [client, clientInfo] of clients) {
                if (clientInfo.userId === recipientId) {
                  recipientOnline = true;
                  client.send(JSON.stringify({
                    type: 'CHAT_MESSAGE',
                    message: transformedMessage
                  }));
                  
                  // Send unread count update
                  const recipientUnreadCount = await prisma.chatMessage.count({
                    where: {
                      recipientId,
                      read: false
                    }
                  });
                  
                  client.send(JSON.stringify({
                    type: 'UNREAD_COUNT',
                    count: recipientUnreadCount
                  }));
                  break;
                }
              }

              // Send confirmation back to sender
              ws.send(JSON.stringify({
                type: 'MESSAGE_SENT',
                message: transformedMessage,
                recipientOnline
              }));
              
              logger.info(`Message sent from user ${user.id} to user ${recipientId}`);
              break;

            case 'TYPING_STATUS':
              // Handle typing status updates
              const { isTyping, conversationId } = data;
              
              // Send typing status to the other user in the conversation
              for (const [client, clientInfo] of clients) {
                if (clientInfo.userId === conversationId) {
                  client.send(JSON.stringify({
                    type: 'TYPING_STATUS',
                    userId: user.id,
                    isTyping,
                    userName: user.name
                  }));
                  break;
                }
              }
              break;

            case 'MESSAGE_READ':
              // Handle message read status
              const { messageId } = data;
              
              // Update message read status
              await prisma.chatMessage.update({
                where: { id: messageId },
                data: { read: true }
              });
              
              // Notify sender that message was read
              const message = await prisma.chatMessage.findUnique({
                where: { id: messageId },
                select: { senderId: true }
              });
              
              if (message) {
                for (const [client, clientInfo] of clients) {
                  if (clientInfo.userId === message.senderId) {
                    client.send(JSON.stringify({
                      type: 'MESSAGE_READ',
                      messageId
                    }));
                    break;
                  }
                }
              }
              break;

            case 'PROPOSAL_UPDATE':
              // Notify client about proposal updates
              const { proposalId, status } = data;
              
              const proposal = await prisma.proposal.findUnique({
                where: { id: proposalId },
                include: { job: true }
              });

              if (proposal) {
                // Notify job owner
                for (const [client, clientInfo] of clients) {
                  if (clientInfo.userId === proposal.job.clientId) {
                    client.send(JSON.stringify({
                      type: 'PROPOSAL_UPDATE',
                      proposal: {
                        id: proposal.id,
                        status,
                        jobTitle: proposal.job.title
                      }
                    }));
                    break;
                  }
                }
              }
              break;

            default:
              logger.warn('Unknown message type:', data.type);
              ws.send(JSON.stringify({
                type: 'ERROR',
                message: 'Unknown message type'
              }));
          }
        } catch (error) {
          logger.error('Error handling message:', error);
          ws.send(JSON.stringify({
            type: 'ERROR',
            message: 'Failed to process message',
            details: error.message
          }));
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        logger.info(`Client disconnected: ${user.id}`);
        clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket client error:', error);
        clients.delete(ws);
        ws.close(1011, 'Internal error occurred');
      });

    } catch (error) {
      logger.error('WebSocket connection error:', error);
      ws.close(1011, 'Internal server error');
    }
  });

  return wss;
}

module.exports = setupWebSocket; 