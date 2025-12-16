const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const axios = require('axios');

const prisma = new PrismaClient();

// Create a new webhook
router.post('/', auth, async (req, res) => {
  try {
    const { url, events, description } = req.body;
    
    // Generate a secret for webhook signing
    const secret = crypto.randomBytes(32).toString('hex');
    
    const webhook = await prisma.webhook.create({
      data: {
        url,
        events,
        description,
        secret,
        userId: req.user.id,
        isActive: true
      }
    });
    
    // Return webhook without secret
    const { secret: _, ...webhookWithoutSecret } = webhook;
    res.status(201).json(webhookWithoutSecret);
  } catch (error) {
    console.error('Error creating webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

// Get all webhooks for a user
router.get('/', auth, async (req, res) => {
  try {
    const webhooks = await prisma.webhook.findMany({
      where: { userId: req.user.id },
      include: {
        logs: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    // Remove secrets from response
    const webhooksWithoutSecrets = webhooks.map(({ secret, ...rest }) => rest);
    res.json(webhooksWithoutSecrets);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// Update a webhook
router.patch('/:webhookId', auth, async (req, res) => {
  try {
    const { webhookId } = req.params;
    const { url, events, description, isActive } = req.body;
    
    // Check if webhook exists and belongs to user
    const existingWebhook = await prisma.webhook.findUnique({
      where: { id: webhookId }
    });
    
    if (!existingWebhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    if (existingWebhook.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this webhook' });
    }
    
    // Update webhook
    const updatedWebhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        url,
        events,
        description,
        isActive
      }
    });
    
    // Return webhook without secret
    const { secret: _, ...webhookWithoutSecret } = updatedWebhook;
    res.json(webhookWithoutSecret);
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

// Delete a webhook
router.delete('/:webhookId', auth, async (req, res) => {
  try {
    const { webhookId } = req.params;
    
    // Check if webhook exists and belongs to user
    const existingWebhook = await prisma.webhook.findUnique({
      where: { id: webhookId }
    });
    
    if (!existingWebhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    if (existingWebhook.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this webhook' });
    }
    
    // Delete webhook
    await prisma.webhook.delete({
      where: { id: webhookId }
    });
    
    res.json({ message: 'Webhook deleted successfully' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Get webhook logs
router.get('/:webhookId/logs', auth, async (req, res) => {
  try {
    const { webhookId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Check if webhook exists and belongs to user
    const existingWebhook = await prisma.webhook.findUnique({
      where: { id: webhookId }
    });
    
    if (!existingWebhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }
    
    if (existingWebhook.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view these logs' });
    }
    
    // Get logs with pagination
    const logs = await prisma.webhookLog.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });
    
    // Get total count for pagination
    const total = await prisma.webhookLog.count({
      where: { webhookId }
    });
    
    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching webhook logs:', error);
    res.status(500).json({ error: 'Failed to fetch webhook logs' });
  }
});

// Helper function to trigger webhooks
async function triggerWebhooks(event, payload) {
  try {
    // Find all active webhooks that are subscribed to this event
    const webhooks = await prisma.webhook.findMany({
      where: {
        isActive: true,
        events: {
          has: event
        }
      }
    });
    
    if (webhooks.length === 0) {
      return;
    }
    
    // Trigger each webhook
    const results = await Promise.allSettled(
      webhooks.map(async (webhook) => {
        try {
          // Create signature
          const signature = crypto
            .createHmac('sha256', webhook.secret)
            .update(JSON.stringify(payload))
            .digest('hex');
          
          // Send webhook
          const response = await axios.post(webhook.url, payload, {
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': signature,
              'X-Webhook-Event': event
            },
            timeout: 5000 // 5 second timeout
          });
          
          // Log successful webhook
          await prisma.webhookLog.create({
            data: {
              webhookId: webhook.id,
              event,
              payload: JSON.stringify(payload),
              status: 'SUCCESS',
              statusCode: response.status,
              response: JSON.stringify(response.data)
            }
          });
          
          return { webhookId: webhook.id, status: 'success' };
        } catch (error) {
          // Log failed webhook
          await prisma.webhookLog.create({
            data: {
              webhookId: webhook.id,
              event,
              payload: JSON.stringify(payload),
              status: 'FAILED',
              statusCode: error.response?.status || 0,
              response: error.message
            }
          });
          
          return { webhookId: webhook.id, status: 'failed', error: error.message };
        }
      })
    );
    
    return results;
  } catch (error) {
    console.error('Error triggering webhooks:', error);
    return [];
  }
}

// Export both the router and the triggerWebhooks function
module.exports = {
  router,
  triggerWebhooks
}; 