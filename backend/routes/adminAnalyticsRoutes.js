const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const adminAuth = require('../middleware/adminAuth');

const prisma = new PrismaClient();

// Get admin analytics overview
router.get('/', adminAuth, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalJobs,
      activeJobs,
      totalPayments,
      totalEarnings,
      totalDisputes,
      totalContracts,
      recentUsers,
      recentJobs,
      recentPayments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
          }
        }
      }),
      prisma.job.count(),
      prisma.job.count({
        where: { status: 'ACTIVE' }
      }),
      prisma.payment.count(),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
      }),
      prisma.dispute.count(),
      prisma.contract.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      }),
      prisma.job.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          budget: true,
          createdAt: true,
          client: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          totalJobs,
          activeJobs,
          totalPayments,
          totalEarnings: totalEarnings._sum.amount || 0,
          totalDisputes,
          totalContracts
        },
        recent: {
          users: recentUsers,
          jobs: recentJobs,
          payments: recentPayments
        }
      }
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data'
    });
  }
});

// Get user growth analytics
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const userGrowth = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const activeUsers = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
      where: {
        lastActiveAt: {
          gte: start,
          lte: end
        }
      }
    });

    res.json({
      success: true,
      data: {
        growth: userGrowth,
        active: activeUsers
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user analytics'
    });
  }
});

// Get revenue analytics
router.get('/revenue', adminAuth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const revenue = await prisma.payment.groupBy({
      by: ['status'],
      _sum: {
        amount: true
      },
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    const monthlyRevenue = await prisma.payment.groupBy({
      by: ['createdAt'],
      _sum: {
        amount: true
      },
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: start,
          lte: end
        }
      }
    });

    res.json({
      success: true,
      data: {
        total: revenue,
        monthly: monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue analytics'
    });
  }
});

module.exports = router; 