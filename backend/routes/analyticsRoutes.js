const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();

// Get dashboard analytics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;

    let analytics;
    if (userType === 'FREELANCER') {
      analytics = await prisma.freelancer.findUnique({
        where: { userId },
        include: {
          _count: {
            select: {
              completedJobs: true,
              activeJobs: true,
              proposals: true,
            },
          },
          earnings: {
            select: {
              totalEarnings: true,
              monthlyEarnings: true,
              pendingPayments: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });
    } else {
      analytics = await prisma.jobPoster.findUnique({
        where: { userId },
        include: {
          _count: {
            select: {
              postedJobs: true,
              activeJobs: true,
              completedJobs: true,
            },
          },
          jobs: {
            include: {
              proposals: true,
              contracts: true,
            },
          },
        },
      });
    }

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get job analytics
router.get('/jobs', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type;

    let jobAnalytics;
    if (userType === 'FREELANCER') {
      jobAnalytics = await prisma.job.findMany({
        where: {
          contracts: {
            some: {
              freelancerId: userId,
            },
          },
        },
        include: {
          _count: {
            select: {
              proposals: true,
              contracts: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });
    } else {
      jobAnalytics = await prisma.job.findMany({
        where: {
          jobPosterId: userId,
        },
        include: {
          _count: {
            select: {
              proposals: true,
              contracts: true,
            },
          },
          reviews: {
            select: {
              rating: true,
            },
          },
        },
      });
    }

    res.json(jobAnalytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get earnings analytics
router.get('/earnings', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const earnings = await prisma.payment.findMany({
      where: {
        freelancerId: userId,
        createdAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      include: {
        job: {
          select: {
            title: true,
            budget: true,
          },
        },
      },
    });

    res.json(earnings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user activity analytics
router.get('/activity', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const activity = await prisma.userActivity.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      include: {
        job: {
          select: {
            title: true,
          },
        },
      },
    });

    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 