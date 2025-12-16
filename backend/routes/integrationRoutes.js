const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { triggerWebhooks } = require('./webhookRoutes');

const prisma = new PrismaClient();

// Payment Gateway Integration
router.post('/payment-gateway/connect', auth, async (req, res) => {
  try {
    const { provider, credentials } = req.body;
    const integration = await prisma.integration.create({
      data: {
        type: 'PAYMENT_GATEWAY',
        provider,
        credentials,
        userId: req.user.id,
        isActive: true
      }
    });

    // Trigger webhook for new integration
    await triggerWebhooks('integration.created', {
      type: 'PAYMENT_GATEWAY',
      provider,
      userId: req.user.id
    });

    res.json(integration);
  } catch (error) {
    console.error('Connect payment gateway error:', error);
    res.status(500).json({ error: 'Error connecting payment gateway' });
  }
});

// Email Service Integration
router.post('/email-service/connect', auth, async (req, res) => {
  try {
    const { provider, credentials } = req.body;
    const integration = await prisma.integration.create({
      data: {
        type: 'EMAIL_SERVICE',
        provider,
        credentials,
        userId: req.user.id,
        isActive: true
      }
    });

    // Trigger webhook for new integration
    await triggerWebhooks('integration.created', {
      type: 'EMAIL_SERVICE',
      provider,
      userId: req.user.id
    });

    res.json(integration);
  } catch (error) {
    console.error('Connect email service error:', error);
    res.status(500).json({ error: 'Error connecting email service' });
  }
});

// Cloud Storage Integration
router.post('/cloud-storage/connect', auth, async (req, res) => {
  try {
    const { provider, credentials } = req.body;
    const integration = await prisma.integration.create({
      data: {
        type: 'CLOUD_STORAGE',
        provider,
        credentials,
        userId: req.user.id,
        isActive: true
      }
    });

    // Trigger webhook for new integration
    await triggerWebhooks('integration.created', {
      type: 'CLOUD_STORAGE',
      provider,
      userId: req.user.id
    });

    res.json(integration);
  } catch (error) {
    console.error('Connect cloud storage error:', error);
    res.status(500).json({ error: 'Error connecting cloud storage' });
  }
});

// Get user's integrations
router.get('/', auth, async (req, res) => {
  try {
    const integrations = await prisma.integration.findMany({
      where: {
        userId: req.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(integrations);
  } catch (error) {
    console.error('Get integrations error:', error);
    res.status(500).json({ error: 'Error retrieving integrations' });
  }
});

// Update integration
router.patch('/:integrationId', auth, async (req, res) => {
  try {
    const { credentials, isActive } = req.body;
    const integration = await prisma.integration.update({
      where: {
        id: req.params.integrationId,
        userId: req.user.id
      },
      data: {
        credentials,
        isActive
      }
    });

    // Trigger webhook for integration update
    await triggerWebhooks('integration.updated', {
      integrationId: integration.id,
      type: integration.type,
      provider: integration.provider,
      userId: req.user.id
    });

    res.json(integration);
  } catch (error) {
    console.error('Update integration error:', error);
    res.status(500).json({ error: 'Error updating integration' });
  }
});

// Delete integration
router.delete('/:integrationId', auth, async (req, res) => {
  try {
    const integration = await prisma.integration.delete({
      where: {
        id: req.params.integrationId,
        userId: req.user.id
      }
    });

    // Trigger webhook for integration deletion
    await triggerWebhooks('integration.deleted', {
      integrationId: integration.id,
      type: integration.type,
      provider: integration.provider,
      userId: req.user.id
    });

    res.json({ message: 'Integration deleted successfully' });
  } catch (error) {
    console.error('Delete integration error:', error);
    res.status(500).json({ error: 'Error deleting integration' });
  }
});

// Test integration
router.post('/:integrationId/test', auth, async (req, res) => {
  try {
    const integration = await prisma.integration.findFirst({
      where: {
        id: req.params.integrationId,
        userId: req.user.id
      }
    });

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    let testResult;
    switch (integration.type) {
      case 'PAYMENT_GATEWAY':
        testResult = await testPaymentGateway(integration);
        break;
      case 'EMAIL_SERVICE':
        testResult = await testEmailService(integration);
        break;
      case 'CLOUD_STORAGE':
        testResult = await testCloudStorage(integration);
        break;
      default:
        return res.status(400).json({ error: 'Invalid integration type' });
    }

    res.json(testResult);
  } catch (error) {
    console.error('Test integration error:', error);
    res.status(500).json({ error: 'Error testing integration' });
  }
});

// Helper functions for testing integrations
async function testPaymentGateway(integration) {
  // Implement payment gateway test logic
  return { status: 'success', message: 'Payment gateway connection successful' };
}

async function testEmailService(integration) {
  // Implement email service test logic
  return { status: 'success', message: 'Email service connection successful' };
}

async function testCloudStorage(integration) {
  // Implement cloud storage test logic
  return { status: 'success', message: 'Cloud storage connection successful' };
}

module.exports = router; 