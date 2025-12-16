const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const adminAuth = require('../middleware/adminAuth');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// Apply admin authentication middleware to all routes
router.use(adminAuth);

// Dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalJobs,
      totalPayments,
      activeDisputes,
      recentUsers,
      recentJobs,
      recentPayments,
      activeUsers,
      activeJobs,
      totalEarnings,
      monthlyEarnings,
      pendingPayments,
      totalContracts,
      activeContracts
    ] = await Promise.all([
      prisma.user.count(),
      prisma.job.count(),
      prisma.payment.count(),
      prisma.dispute.count({ where: { status: 'OPEN' } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.job.findMany({
        take: 5,
        orderBy: { postedAt: 'desc' },
        include: {
          client: {
            select: {
              name: true
            }
          }
        }
      }),
      prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: { lastActiveAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
      prisma.job.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.payment.aggregate({ _sum: { amount: true } }).then(result => result._sum.amount || 0),
      prisma.payment.aggregate({ 
        _sum: { amount: true },
        where: { createdAt: { gte: new Date(new Date().setDate(1)) } }
      }).then(result => result._sum.amount || 0),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.contract.count(),
      prisma.contract.count({ where: { status: 'ACTIVE' } })
    ]);

    res.json({
      success: true,
      data: {
        statistics: {
          totalUsers,
          totalJobs,
          totalPayments,
          activeDisputes,
          activeUsers,
          activeJobs,
          totalEarnings,
          monthlyEarnings,
          pendingPayments,
          totalContracts,
          activeContracts
        },
        recent: {
          users: recentUsers,
          jobs: recentJobs,
          payments: recentPayments
        }
      }
    });
  } catch (error) {
    console.error('Dashboard statistics error:', error);
    res.status(500).json({ error: 'Error retrieving dashboard statistics' });
  }
});

// Get all users with pagination and filters
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      ...(role && { role }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Get total count
    const totalUsers = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: {
        [sortBy]: sortOrder
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        image: true,
        _count: {
          select: {
            jobs: true,
            proposals: true,
            payments: true,
            reviews: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: totalUsers,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalUsers / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Get user details
router.get('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobs: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        proposals: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        contracts: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            jobs: true,
            proposals: true,
            contracts: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user details' });
  }
});

// Update user
router.patch('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if email is taken by another user
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email }
      });

      if (emailTaken) {
        return res.status(400).json({ success: false, error: 'Email is already taken' });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(password && { password: await bcrypt.hash(password, 10) })
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        image: true
      }
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// Create admin user
router.post('/users', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        lastActiveAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Job management
router.get('/jobs', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } }
        ]
      })
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { postedAt: 'desc' },
        include: {
          client: true,
          _count: {
            select: {
              proposals: true,
              reviews: true
            }
          }
        }
      }),
      prisma.job.count({ where })
    ]);

    res.json({
      jobs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'Error retrieving jobs' });
  }
});

// Delete job
router.delete('/jobs/:jobId', async (req, res) => {
  try {
    const jobId = req.params.jobId;

    // First check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        _count: {
          select: {
            proposals: true,
            reviews: true,
            timeEntries: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Start a transaction to handle all deletions
    await prisma.$transaction(async (tx) => {
      // Delete related time entries
      await tx.timeEntry.deleteMany({
        where: { jobId }
      });

      // Delete related reviews
      await tx.review.deleteMany({
        where: { jobId }
      });

      // Delete related proposals
      await tx.proposal.deleteMany({
        where: { jobId }
      });

      // Delete related payments
      await tx.payment.deleteMany({
        where: { jobId }
      });

      // Delete related disputes
      await tx.dispute.deleteMany({
        where: { jobId }
      });

      // Finally, delete the job
      await tx.job.delete({
        where: { id: jobId }
      });
    });

    res.json({
      success: true,
      message: 'Job and all related data deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete job',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update job status
router.patch('/jobs/:jobId', async (req, res) => {
  try {
    const { status } = req.body;
    const jobId = req.params.jobId;

    // Validate status
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'UNDER_REVIEW'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    // Update job
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: { status },
      include: {
        client: true,
        _count: {
          select: {
            proposals: true,
            reviews: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedJob
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Payment management
router.get('/payments', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status })
    };

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          freelancer: true,
          job: true
        }
      }),
      prisma.payment.count({ where })
    ]);

    res.json({
      payments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Error retrieving payments' });
  }
});

// Dispute management
router.get('/disputes', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status })
    };

    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          receivedBy: true,
          contract: true
        }
      }),
      prisma.dispute.count({ where })
    ]);

    res.json({
      disputes,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ error: 'Error retrieving disputes' });
  }
});

// Update dispute
router.patch('/disputes/:disputeId', async (req, res) => {
  try {
    const { status, resolution } = req.body;
    const dispute = await prisma.dispute.update({
      where: { id: req.params.disputeId },
      data: { status, resolution },
      include: {
        user: true,
        receivedBy: true,
        contract: true
      }
    });
    res.json(dispute);
  } catch (error) {
    console.error('Update dispute error:', error);
    res.status(500).json({ error: 'Error updating dispute' });
  }
});

// Ticket management
router.get('/tickets', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(priority && { priority })
    };

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          creator: true,
          assignee: true,
          contract: true
        }
      }),
      prisma.ticket.count({ where })
    ]);

    res.json({
      tickets,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        current: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ error: 'Error retrieving tickets' });
  }
});

// Update ticket
router.patch('/tickets/:ticketId', async (req, res) => {
  try {
    const { status, priority, assigneeId } = req.body;
    const ticket = await prisma.ticket.update({
      where: { id: req.params.ticketId },
      data: { status, priority, assigneeId },
      include: {
        creator: true,
        assignee: true,
        contract: true
      }
    });
    res.json(ticket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Error updating ticket' });
  }
});

// System settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findFirst();
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Error retrieving settings' });
  }
});

// Update system settings
router.patch('/settings', async (req, res) => {
  try {
    const settings = await prisma.systemSettings.update({
      where: { id: 1 },
      data: req.body
    });
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Error updating settings' });
  }
});

// Analytics Overview
router.get('/analytics', async (req, res) => {
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
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.count(),
      prisma.payment.aggregate({ _sum: { amount: true } }).then(result => result._sum.amount || 0),
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
        orderBy: { postedAt: 'desc' },
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
          totalEarnings,
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
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Error retrieving analytics overview' });
  }
});

// User Analytics
router.get('/analytics/users', async (req, res) => {
  try {
    const [growth, active] = await Promise.all([
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
        where: {
          lastActiveAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        growth,
        active
      }
    });
  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ error: 'Error retrieving user analytics' });
  }
});

// Revenue Analytics
router.get('/analytics/revenue', async (req, res) => {
  try {
    const [total, monthly] = await Promise.all([
      prisma.payment.groupBy({
        by: ['status'],
        _sum: {
          amount: true
        }
      }),
      prisma.payment.groupBy({
        by: ['createdAt'],
        _sum: {
          amount: true
        },
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(1)) // First day of current month
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        monthly
      }
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Error retrieving revenue analytics' });
  }
});

// Get admin statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalJobs,
      activeJobs,
      totalEarnings,
      monthlyEarnings,
      totalPayments,
      pendingPayments,
      totalContracts,
      activeContracts
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.job.count(),
      prisma.job.count({ where: { status: 'ACTIVE' } }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: {
            gte: new Date(new Date().setDate(1)) // First day of current month
          }
        }
      }),
      prisma.payment.count(),
      prisma.payment.count({ where: { status: 'PENDING' } }),
      prisma.contract.count(),
      prisma.contract.count({ where: { status: 'ACTIVE' } })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalJobs,
        activeJobs,
        totalEarnings: totalEarnings._sum.amount || 0,
        monthlyEarnings: monthlyEarnings._sum.amount || 0,
        totalPayments,
        pendingPayments,
        totalContracts,
        activeContracts
      }
    });
  } catch (error) {
    console.error('Admin statistics error:', error);
    res.status(500).json({ success: false, error: 'Error retrieving admin statistics' });
  }
});

// Get recent users
router.get('/users/recent', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true
      }
    });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching recent users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent users' });
  }
});

// Get recent jobs
router.get('/jobs/recent', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        client: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        createdAt: true
      }
    });
    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Error fetching recent jobs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent jobs' });
  }
});

// Get recent payments
router.get('/payments/recent', async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        status: true,
        type: true,
        createdAt: true
      }
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recent payments' });
  }
});

// Get job by ID
router.get('/jobs/:jobId', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.jobId },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        proposals: {
          include: {
            freelancer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          }
        },
        contract: true,
        attachments: true,
        category: true
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    console.error('Get job details error:', error);
    res.status(500).json({ error: 'Error retrieving job details' });
  }
});

module.exports = router; 