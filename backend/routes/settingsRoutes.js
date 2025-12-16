const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const prisma = new PrismaClient();

// Get user settings
router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await prisma.userSettings.findUnique({
      where: { userId }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user settings
router.put('/user', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId },
      update: settings,
      create: {
        userId,
        ...settings
      }
    });

    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get platform settings (admin only)
router.get('/platform', adminAuth, async (req, res) => {
  try {
    const settings = await prisma.platformSettings.findFirst();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update platform settings (admin only)
router.put('/platform', adminAuth, async (req, res) => {
  try {
    const settings = req.body;

    const updatedSettings = await prisma.platformSettings.upsert({
      where: { id: 1 }, // Assuming we only have one platform settings record
      update: settings,
      create: settings
    });

    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get feature flags (admin only)
router.get('/features', adminAuth, async (req, res) => {
  try {
    const features = await prisma.featureFlag.findMany();
    res.json(features);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update feature flag (admin only)
router.put('/features/:featureId', adminAuth, async (req, res) => {
  try {
    const { featureId } = req.params;
    const { isEnabled, settings } = req.body;

    const feature = await prisma.featureFlag.update({
      where: { id: featureId },
      data: {
        isEnabled,
        settings
      }
    });

    res.json(feature);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get system defaults (admin only)
router.get('/defaults', adminAuth, async (req, res) => {
  try {
    const defaults = await prisma.systemDefaults.findFirst();
    res.json(defaults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update system defaults (admin only)
router.put('/defaults', adminAuth, async (req, res) => {
  try {
    const defaults = req.body;

    const updatedDefaults = await prisma.systemDefaults.upsert({
      where: { id: 1 }, // Assuming we only have one system defaults record
      update: defaults,
      create: defaults
    });

    res.json(updatedDefaults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notification settings
router.get('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await prisma.notificationSettings.findUnique({
      where: { userId }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update notification settings
router.put('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    const updatedSettings = await prisma.notificationSettings.upsert({
      where: { userId },
      update: settings,
      create: {
        userId,
        ...settings
      }
    });

    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get privacy settings
router.get('/privacy', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await prisma.privacySettings.findUnique({
      where: { userId }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update privacy settings
router.put('/privacy', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = req.body;

    const updatedSettings = await prisma.privacySettings.upsert({
      where: { userId },
      update: settings,
      create: {
        userId,
        ...settings
      }
    });

    res.json(updatedSettings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 