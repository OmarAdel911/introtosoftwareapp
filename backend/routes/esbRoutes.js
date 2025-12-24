/**
 * ESB Routes - Admin endpoints for managing Redis-based ESB
 */

const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const esbService = require('../services/esbService');

// Get ESB status and services
router.get('/status', adminAuth, async (req, res) => {
  try {
    const status = await esbService.discoverServices();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all services registered in Redis
router.get('/services', adminAuth, async (req, res) => {
  try {
    const services = await esbService.getAllServices();
    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Register a service
router.post('/services', adminAuth, async (req, res) => {
  try {
    const { name, ...serviceData } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Service name is required'
      });
    }

    const registered = await esbService.registerService(name, serviceData);
    res.json({
      success: registered,
      message: registered ? 'Service registered successfully' : 'Failed to register service'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get Redis info
router.get('/redis/info', adminAuth, async (req, res) => {
  try {
    const info = await esbService.getRedisInfo();
    if (!info) {
      return res.status(503).json({
        success: false,
        error: 'Redis not connected'
      });
    }

    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check through ESB
router.get('/health', async (req, res) => {
  try {
    const health = await esbService.getHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
