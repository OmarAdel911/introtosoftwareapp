const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {
      totalJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      totalApplications: 0,
      acceptedApplications: 0,
      pendingApplications: 0,
      totalEarnings: 0,
      pendingPayments: 0,
      completedPayments: 0
    };

    if (userRole === 'FREELANCER') {
      // Get job application stats
      const applications = await prisma.proposal.findMany({
        where: {
          freelancerId: userId
        }
      });

      stats.totalApplications = applications.length;
      stats.acceptedApplications = applications.filter(app => app.status === 'ACCEPTED').length;
      stats.pendingApplications = applications.filter(app => app.status === 'PENDING').length;

      // Get active contracts count
      const contracts = await prisma.contract.findMany({
        where: {
          proposal: {
            freelancerId: userId
          }
        }
      });
      
      const activeContracts = contracts.filter(contract => contract.status === 'ACTIVE');
      const completedContracts = contracts.filter(contract => contract.status === 'COMPLETED');
      
      stats.activeJobs = activeContracts.length;
      stats.completedJobs = completedContracts.length;
      stats.totalJobs = contracts.length;

      // Get payment stats
      const payments = await prisma.payment.findMany({
        where: {
          freelancerId: userId
        }
      });

      stats.totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);
      stats.pendingPayments = payments.filter(payment => payment.status === 'PENDING').length;
      stats.completedPayments = payments.filter(payment => payment.status === 'COMPLETED').length;
    } else if (userRole === 'CLIENT' || userRole === 'JOB_POSTER') {
      // Get job stats
      const jobs = await prisma.job.findMany({
        where: {
          clientId: userId
        }
      });

      stats.totalJobs = jobs.length;
      stats.activeJobs = jobs.filter(job => job.status === 'OPEN').length;
      stats.completedJobs = jobs.filter(job => job.status === 'COMPLETED').length;

      // Get application stats for the client's jobs
      const applications = await prisma.proposal.findMany({
        where: {
          job: {
            clientId: userId
          }
        }
      });

      stats.totalApplications = applications.length;
      stats.acceptedApplications = applications.filter(app => app.status === 'ACCEPTED').length;
      stats.pendingApplications = applications.filter(app => app.status === 'PENDING').length;

      // Get payment stats
      const payments = await prisma.payment.findMany({
        where: {
          userId: userId
        }
      });

      stats.totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);
      stats.pendingPayments = payments.filter(payment => payment.status === 'PENDING').length;
      stats.completedPayments = payments.filter(payment => payment.status === 'COMPLETED').length;
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// Get recent jobs
router.get('/jobs/recent', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let jobs = [];

    if (userRole === 'FREELANCER') {
      // Get jobs that the freelancer has applied to
      const applications = await prisma.proposal.findMany({
        where: {
          freelancerId: userId
        },
        include: {
          job: {
            include: {
              client: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          contract: {
            select: {
              id: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10 // Take more to account for potential duplicates
      });

      // Use a Map to deduplicate jobs by job ID
      const jobsMap = new Map();
      
      applications.forEach(app => {
        if (!jobsMap.has(app.job.id)) {
          // Split the name into firstName and lastName
          const nameParts = app.job.client.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          jobsMap.set(app.job.id, {
            id: app.job.id,
            title: app.job.title,
            description: app.job.description,
            status: app.job.status,
            budget: app.job.budget,
            createdAt: app.job.postedAt,
            client: {
              id: app.job.client.id,
              firstName: firstName,
              lastName: lastName
            },
            contract: app.contract ? {
              id: app.contract.id,
              status: app.contract.status
            } : null
          });
        }
      });
      
      // Convert Map values to array and take only the first 5
      jobs = Array.from(jobsMap.values()).slice(0, 5);
    } else if (userRole === 'CLIENT' || userRole === 'JOB_POSTER') {
      // Get jobs posted by the client
      const clientJobs = await prisma.job.findMany({
        where: {
          clientId: userId
        },
        include: {
          client: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              proposals: true
            }
          },
          proposals: {
            include: {
              contract: {
                select: {
                  id: true,
                  status: true
                }
              }
            }
          }
        },
        orderBy: {
          postedAt: 'desc'
        },
        take: 5
      });

      jobs = clientJobs.map(job => {
        // Split the name into firstName and lastName
        const nameParts = job.client.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Find the active contract if any
        const activeContract = job.proposals.find(p => p.contract)?.contract || null;

        return {
          id: job.id,
          title: job.title,
          description: job.description,
          status: job.status,
          budget: job.budget,
          createdAt: job.postedAt,
          _count: job._count,
          client: {
            id: job.client.id,
            firstName: firstName,
            lastName: lastName
          },
          contract: activeContract
        };
      });
    }

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching recent jobs:', error);
    res.status(500).json({ message: 'Failed to fetch recent jobs' });
  }
});

// Get recent applications
router.get('/applications/recent', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let applications = [];

    if (userRole === 'FREELANCER') {
      // Get applications made by the freelancer
      applications = await prisma.proposal.findMany({
        where: {
          freelancerId: userId
        },
        include: {
          job: {
            select: {
              title: true,
              client: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      applications = applications.map(app => {
        // Split the name into firstName and lastName
        const nameParts = app.job.client.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
          id: app.id,
          jobId: app.jobId,
          jobTitle: app.job.title,
          status: app.status,
          createdAt: app.createdAt,
          client: {
            id: app.job.client.id,
            firstName: firstName,
            lastName: lastName
          }
        };
      });
    } else if (userRole === 'CLIENT' || userRole === 'JOB_POSTER') {
      // Get applications for jobs posted by the client
      const clientJobs = await prisma.job.findMany({
        where: {
          clientId: userId
        },
        select: {
          id: true
        }
      });

      const jobIds = clientJobs.map(job => job.id);

      applications = await prisma.proposal.findMany({
        where: {
          jobId: {
            in: jobIds
          }
        },
        include: {
          job: {
            select: {
              title: true
            }
          },
          freelancer: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      applications = applications.map(app => {
        // Split the name into firstName and lastName
        const nameParts = app.freelancer.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        return {
          id: app.id,
          jobId: app.jobId,
          jobTitle: app.job.title,
          status: app.status,
          createdAt: app.createdAt,
          freelancer: {
            id: app.freelancer.id,
            firstName: firstName,
            lastName: lastName,
            image: app.freelancer.image 
              ? `${process.env.CLOUDINARY_CLOUD_NAME 
                  ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${app.freelancer.image}` 
                  : `https://egbackend-1.onrender.com/${app.freelancer.image}`}`
              : null
          }
        };
      });
    }

    res.json(applications);
  } catch (error) {
    console.error('Error fetching recent applications:', error);
    res.status(500).json({ message: 'Failed to fetch recent applications' });
  }
});

// Get recent payments
router.get('/payments/recent', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    let payments = [];

    if (userRole === 'FREELANCER') {
      // Get payments received by the freelancer
      payments = await prisma.payment.findMany({
        where: {
          freelancerId: userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      payments = payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        type: 'PAYMENT',
        status: payment.status,
        createdAt: payment.createdAt
      }));
    } else if (userRole === 'CLIENT' || userRole === 'JOB_POSTER') {
      // Get payments made by the client
      payments = await prisma.payment.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });

      payments = payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        type: 'PAYMENT',
        status: payment.status,
        createdAt: payment.createdAt
      }));
    }

    res.json(payments);
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    res.status(500).json({ error: 'Failed to fetch recent payments' });
  }
});

module.exports = router; 