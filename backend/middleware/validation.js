const { logger } = require('../utils/logger');

const validateMessage = (req, res, next) => {
  const { recipientId, content } = req.body;

  // Check if recipientId is provided
  if (!recipientId) {
    logger.warn('Message validation failed: recipientId is required');
    return res.status(400).json({ error: 'Recipient ID is required' });
  }

  // Check if content is provided
  if (!content) {
    logger.warn('Message validation failed: content is required');
    return res.status(400).json({ error: 'Message content is required' });
  }

  // Check if content is not empty after trimming
  if (content.trim().length === 0) {
    logger.warn('Message validation failed: content cannot be empty');
    return res.status(400).json({ error: 'Message content cannot be empty' });
  }

  // Check if content length is within limits (e.g., 5000 characters)
  if (content.length > 5000) {
    logger.warn('Message validation failed: content exceeds maximum length');
    return res.status(400).json({ error: 'Message content exceeds maximum length of 5000 characters' });
  }

  // Check if sender is not trying to send message to themselves
  if (recipientId === req.user.id) {
    logger.warn(`Message validation failed: user ${req.user.id} attempted to send message to themselves`);
    return res.status(400).json({ error: 'Cannot send message to yourself' });
  }

  next();
};

module.exports = {
  validateMessage
}; 