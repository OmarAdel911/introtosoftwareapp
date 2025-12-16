const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const prisma = new PrismaClient();

// Get audit logs with filtering and pagination
router.get('/logs', adminAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      status
    } = req.query;

    const skip = (page - 1) * limit;

    const where = {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(resourceType && { resourceType }),
      ...(status && { status }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit log details
router.get('/logs/:logId', adminAuth, async (req, res) => {
  try {
    const { logId } = req.params;
    const log = await prisma.auditLog.findUnique({
      where: { id: logId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        changes: true
      }
    });

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's audit logs
router.get('/user/logs', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.auditLog.count({
        where: { userId }
      })
    ]);

    res.json({
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get resource audit history
router.get('/resources/:resourceType/:resourceId', adminAuth, async (req, res) => {
  try {
    const { resourceType, resourceId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          resourceType,
          resourceId
        },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          changes: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.auditLog.count({
        where: {
          resourceType,
          resourceId
        }
      })
    ]);

    res.json({
      logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit statistics
router.get('/statistics', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const [
      totalLogs,
      actionStats,
      resourceTypeStats,
      statusStats,
      userStats
    ] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: true
      }),
      prisma.auditLog.groupBy({
        by: ['resourceType'],
        where,
        _count: true
      }),
      prisma.auditLog.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.auditLog.groupBy({
        by: ['userId'],
        where,
        _count: true
      })
    ]);

    res.json({
      totalLogs,
      actionStats,
      resourceTypeStats,
      statusStats,
      userStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export audit logs
router.get('/export', adminAuth, async (req, res) => {
  try {
    const {
      format = 'csv',
      startDate,
      endDate,
      userId,
      action,
      resourceType,
      status
    } = req.query;

    const where = {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(resourceType && { resourceType }),
      ...(status && { status }),
      ...(startDate && endDate && {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        changes: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // TODO: Implement export logic based on format
    // This would involve converting the logs to the requested format
    // and setting appropriate headers for file download

    res.json({ message: 'Export functionality to be implemented' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 