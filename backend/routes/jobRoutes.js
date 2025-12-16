const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Test endpoint
router.get('/test', (req, res) => {
  console.log('GET /api/jobs/test - Test endpoint hit');
  res.json({ message: 'Job routes are working!', timestamp: new Date().toISOString() });
});

// Get all jobs with optional filters
router.get('/', async (req, res) => {
  console.log('GET /api/jobs - Fetching jobs');
  try {
    const { category, budget, skills, status, search, page = 1, limit = 10 } = req.query;
    const where = {};

    if (category && category !== 'all') where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }
    if (budget) {
      where.budget = {
        gte: parseFloat(budget.min) || 0,
        lte: parseFloat(budget.max) || Infinity
      };
    }
    if (skills) {
      where.skills = {
        hasSome: Array.isArray(skills) ? skills : [skills]
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    console.log('Query parameters:', { category, budget, skills, status, search, page, limit });
    console.log('Where clause:', where);

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: { postedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.job.count({ where })
    ]);

    console.log(`Found ${jobs.length} jobs out of ${total} total`);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          current: parseInt(page)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a single job by ID
router.get('/:id', async (req, res) => {
  console.log(`GET /api/jobs/${req.params.id} - Fetching job details`);
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            image: true,
            createdAt: true
          }
        },
        proposals: {
          include: {
            freelancer: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    console.error(`Error fetching job ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new job
router.post('/', async (req, res) => {
  try {
    // Extract and validate required fields
    const { 
      title, 
      description, 
      category, 
      budget, 
      skills, 
      deadline, 
      jobType, 
      experience, 
      duration, 
      location, 
      status 
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !budget || !skills) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log('Creating job with data:', {
      title,
      description,
      category,
      budget: parseFloat(budget),
      skills: Array.isArray(skills) ? skills : JSON.parse(skills),
      deadline: deadline ? new Date(deadline) : null,
      jobType,
      experience,
      duration,
      location,
      status: status || "OPEN",
      clientId: req.user.id
    });

    // Create the job with all fields
    const job = await prisma.job.create({
      data: {
        title,
        description,
        category,
        budget: parseFloat(budget),
        skills: Array.isArray(skills) ? skills : JSON.parse(skills),
        deadline: deadline ? new Date(deadline) : null,
        jobType,
        experience,
        duration,
        location,
        status: status || "OPEN",
        clientId: req.user.id
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    console.log('Job created successfully:', job);

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a job
router.put('/:id', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedJob = await prisma.job.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    res.json(updatedJob);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a job
router.delete('/:id', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.job.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit a proposal
router.post('/:id/proposals', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'OPEN') {
      return res.status(400).json({ error: 'Job is not open for proposals' });
    }

    // Check if user is a freelancer
    if (req.user.role !== 'FREELANCER') {
      return res.status(403).json({ error: 'Only freelancers can submit proposals' });
    }

    // Check if user already submitted a proposal for this job
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        jobId: req.params.id,
        freelancerId: req.user.id
      }
    });
    
    if (existingProposal) {
      return res.status(400).json({ error: 'You have already submitted a proposal for this job' });
    }

    const proposal = await prisma.proposal.create({
      data: {
        ...req.body,
        jobId: req.params.id,
        freelancerId: req.user.id
      },
      include: {
        freelancer: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    res.status(201).json(proposal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Accept a proposal
router.put('/:jobId/proposals/:proposalId/accept', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.proposalId },
      include: {
        freelancer: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.jobId !== req.params.jobId) {
      return res.status(400).json({ error: 'Proposal does not belong to this job' });
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id: req.params.proposalId },
      data: { status: 'ACCEPTED' },
      include: {
        freelancer: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    await prisma.job.update({
      where: { id: req.params.jobId },
      data: { status: 'IN_PROGRESS' }
    });

    // Create notification for the freelancer
    await prisma.notification.create({
      data: {
        userId: proposal.freelancer.id,
        title: 'Proposal Accepted',
        message: `Your proposal for "${proposal.job.title}" has been accepted by ${proposal.job.client.name}`,
        read: false
      }
    });

    res.json(updatedProposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject a proposal
router.put('/:jobId/proposals/:proposalId/reject', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.jobId }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.proposalId },
      include: {
        freelancer: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    if (proposal.jobId !== req.params.jobId) {
      return res.status(400).json({ error: 'Proposal does not belong to this job' });
    }

    const updatedProposal = await prisma.proposal.update({
      where: { id: req.params.proposalId },
      data: { status: 'REJECTED' },
      include: {
        freelancer: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    // Create notification for the freelancer
    await prisma.notification.create({
      data: {
        userId: proposal.freelancer.id,
        title: 'Proposal Rejected',
        message: `Your proposal for "${proposal.job.title}" has been rejected by ${proposal.job.client.name}`,
        read: false
      }
    });

    res.json(updatedProposal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get jobs by freelancer ID
router.get('/freelancer/:freelancerId', async (req, res) => {
  try {
    // Check if the requesting user is the freelancer or an admin
    if (req.user.id !== req.params.freelancerId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const jobs = await prisma.job.findMany({
      where: {
        proposals: {
          some: {
            freelancerId: req.params.freelancerId
          }
        }
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        proposals: {
          where: {
            freelancerId: req.params.freelancerId
          },
          select: {
            id: true,
            status: true,
            amount: true,
            createdAt: true
          }
        }
      },
      orderBy: { postedAt: 'desc' }
    });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update job status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const job = await prisma.job.findUnique({
      where: { id: req.params.id }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedJob = await prisma.job.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    res.json(updatedJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if job has active contract
router.get('/:id/contract', async (req, res) => {
  try {
    const contract = await prisma.contract.findFirst({
      where: {
        proposal: {
          jobId: req.params.id
        },
        status: 'ACTIVE'
      }
    });

    res.json({ hasActiveContract: !!contract });
  } catch (error) {
    console.error('Error checking contract:', error);
    res.status(500).json({ error: error.message });
  }
});

// Close a job
router.patch('/:id/close', auth, async (req, res) => {
  try {
    // First check if job exists and user is authorized
    const job = await prisma.job.findUnique({
      where: { id: req.params.id }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check for active contract through proposal
    const activeContract = await prisma.contract.findFirst({
      where: {
        proposal: {
          jobId: req.params.id
        },
        status: 'ACTIVE'
      }
    });

    if (activeContract) {
      return res.status(400).json({ error: 'Cannot close job with active contract' });
    }

    // Update job status to CANCELLED
    const updatedJob = await prisma.job.update({
      where: { id: req.params.id },
      data: { 
        status: 'CANCELLED'
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            image: true,
            createdAt: true
          }
        }
      }
    });

    res.json(updatedJob);
  } catch (error) {
    console.error('Error closing job:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 