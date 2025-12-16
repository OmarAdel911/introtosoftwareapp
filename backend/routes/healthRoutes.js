const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Basic health check
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'healthy',
      message: 'API is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;

    // Get system metrics
    const [
      userCount,
      activeUsers,
      jobCount,
      activeJobs,
      totalEarnings,
      systemMetrics
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.job.count(),
      prisma.job.count({
        where: { status: 'ACTIVE' }
      }),
      prisma.payment.aggregate({
        _sum: {
          amount: true
        }
      }),
      prisma.systemMetrics.findFirst({
        orderBy: {
          timestamp: 'desc'
        }
      })
    ]);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        database: {
          status: 'healthy',
          latency: `${dbLatency}ms`
        }
      },
      metrics: {
        users: {
          total: userCount,
          active: activeUsers
        },
        jobs: {
          total: jobCount,
          active: activeJobs
        },
        earnings: {
          total: totalEarnings._sum.amount || 0
        },
        system: systemMetrics || {
          cpuUsage: 0,
          memoryUsage: 0,
          diskUsage: 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Component health check
router.get('/components', async (req, res) => {
  try {
    const components = {
      database: {
        status: 'healthy',
        latency: 0,
        lastChecked: new Date().toISOString()
      },
      cache: {
        status: 'healthy',
        latency: 0,
        lastChecked: new Date().toISOString()
      },
      storage: {
        status: 'healthy',
        latency: 0,
        lastChecked: new Date().toISOString()
      }
    };

    // Check database
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    components.database.latency = Date.now() - dbStartTime;

    // TODO: Implement cache health check
    // TODO: Implement storage health check

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// System metrics
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await prisma.systemMetrics.findFirst({
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (!metrics) {
      return res.status(404).json({ error: 'No metrics found' });
    }

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update system metrics
router.post('/metrics', async (req, res) => {
  try {
    const { cpuUsage, memoryUsage, diskUsage } = req.body;

    const metrics = await prisma.systemMetrics.create({
      data: {
        cpuUsage,
        memoryUsage,
        diskUsage,
        timestamp: new Date()
      }
    });

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get historical metrics
router.get('/metrics/history', async (req, res) => {
  try {
    const { startDate, endDate, interval = '1h' } = req.query;

    const where = {
      ...(startDate && endDate && {
        timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const metrics = await prisma.systemMetrics.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      }
    });

    // TODO: Implement interval-based aggregation
    // This would involve grouping metrics by the specified interval
    // and calculating averages/min/max values

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 