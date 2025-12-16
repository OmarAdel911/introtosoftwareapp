const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();

// Test endpoint to check if proposal routes are working
router.get('/test', async (req, res) => {
  try {
    res.json({
      message: 'Proposal test endpoint',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      message: 'Error in proposal test endpoint'
    });
  }
});

// Get all proposals for a job
router.get('/job/:jobId', async (req, res) => {
  try {
    console.log('Fetching proposals for job:', req.params.jobId);
    console.log('User ID:', req.user.id);

    // First check if the job exists and get its owner
    const job = await prisma.job.findUnique({
      where: { id: req.params.jobId },
      select: {
        id: true,
        clientId: true
      }
    });

    console.log('Found job:', job);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is the job owner
    if (job.clientId !== req.user.id) {
      console.log('User not authorized. Job owner:', job.clientId, 'Current user:', req.user.id);
      return res.status(403).json({ error: 'Not authorized to view these proposals' });
    }

    // Fetch all proposals for the job with freelancer details
    const proposals = await prisma.proposal.findMany({
      where: {
        jobId: req.params.jobId
      },
      include: {
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
      }
    });

    // Transform image URLs for Cloudinary
    const transformedProposals = proposals.map(proposal => ({
      ...proposal,
      freelancer: {
        ...proposal.freelancer,
        image: proposal.freelancer.image 
          ? `${process.env.CLOUDINARY_CLOUD_NAME 
              ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${proposal.freelancer.image}` 
              : `https://egbackend-1.onrender.com/${proposal.freelancer.image}`}`
          : null
      }
    }));

    console.log('Found proposals:', proposals.length);
    res.json(transformedProposals);
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    
    if (error.code === 'P2023') {
      return res.status(400).json({ error: 'Invalid job ID format' });
    }
    res.status(500).json({ error: 'Failed to fetch proposals: ' + error.message });
  }
});

// Get all proposals by a freelancer
router.get('/freelancer/:freelancerId', async (req, res) => {
  try {
    // Only allow users to view their own proposals or admins
    if (req.params.freelancerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to view these proposals' });
    }

    const proposals = await prisma.proposal.findMany({
      where: {
        freelancerId: req.params.freelancerId
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            budget: true,
            client: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform image URLs for Cloudinary
    const transformedProposals = proposals.map(proposal => ({
      ...proposal,
      job: {
        ...proposal.job,
        client: {
          ...proposal.job.client,
          image: proposal.job.client.image 
            ? `${process.env.CLOUDINARY_CLOUD_NAME 
                ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${proposal.job.client.image}` 
                : `https://egbackend-1.onrender.com/${proposal.job.client.image}`}`
            : null
        }
      }
    }));

    res.json(transformedProposals);
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Failed to fetch proposals' });
  }
});

// Create a new proposal
router.post('/', async (req, res) => {
  try {
    console.log('Proposal creation route called, user:', req.user);
    
    if (!req.user || !req.user.id) {
      console.log('No user found in proposal creation request');
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { jobId, amount, coverLetter } = req.body;
    
    if (!jobId || !amount || !coverLetter) {
      return res.status(400).json({ error: 'Missing required fields: jobId, amount, and coverLetter are required' });
    }
    
    // Check if job exists and is open
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'OPEN') {
      return res.status(400).json({ error: 'This job is not open for proposals' });
    }
    
    // Check if user is a freelancer
    if (req.user.role !== 'FREELANCER') {
      return res.status(403).json({ error: 'Only freelancers can submit proposals' });
    }
    
    // Check if user already submitted a proposal for this job
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        jobId,
        freelancerId: req.user.id
      }
    });
    
    if (existingProposal) {
      return res.status(400).json({ error: 'You have already submitted a proposal for this job' });
    }

    // Get user's active connects
    const activeConnects = await prisma.connect.findMany({
      where: {
        userId: req.user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc', // Use oldest connects first
      },
    });

    // Calculate total available connects
    const totalAvailable = activeConnects.reduce((sum, connect) => sum + connect.amount, 0);

    if (totalAvailable < 1) {
      return res.status(400).json({ error: 'Insufficient connects. You need at least 1 connect to submit a proposal.' });
    }

    // Use 1 connect
    let remainingAmount = 1;
    const usedConnects = [];

    for (const connect of activeConnects) {
      if (remainingAmount <= 0) break;

      const useAmount = Math.min(remainingAmount, connect.amount);
      remainingAmount -= useAmount;

      // Update connect
      const updatedConnect = await prisma.connect.update({
        where: { id: connect.id },
        data: {
          amount: connect.amount - useAmount,
          isActive: connect.amount - useAmount > 0,
        },
      });

      usedConnects.push(updatedConnect);
    }
    
    const proposal = await prisma.proposal.create({
      data: {
        jobId,
        freelancerId: req.user.id,
        amount: parseFloat(amount),
        coverLetter,
        status: 'PENDING'
      },
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

    // Transform image URLs for Cloudinary
    const transformedProposal = {
      ...proposal,
      freelancer: {
        ...proposal.freelancer,
        image: proposal.freelancer.image 
          ? `${process.env.CLOUDINARY_CLOUD_NAME 
              ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${proposal.freelancer.image}` 
              : `https://egbackend-1.onrender.com/${proposal.freelancer.image}`}`
          : null
      }
    };
    
    res.status(201).json({
      proposal: transformedProposal,
      usedConnects,
      remainingConnects: totalAvailable - 1
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A proposal for this job already exists' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid job ID or freelancer ID' });
    }
    res.status(500).json({ error: 'Failed to create proposal: ' + error.message });
  }
});

// Update a proposal
router.patch('/:id', auth, async (req, res) => {
  try {
    const { amount, coverLetter, estimatedDuration, status } = req.body;
    
    // Validate status if provided
    if (status && !['PENDING', 'ACCEPTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid proposal status. Must be PENDING, ACCEPTED, or REJECTED' });
    }
    
    // Check if proposal exists
    const existingProposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
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
        freelancer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!existingProposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    // Only allow freelancer who created the proposal or job owner to update
    if (existingProposal.freelancerId !== req.user.id && existingProposal.job.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this proposal' });
    }
    
    // If status is being updated to ACCEPTED, update job status to IN_PROGRESS
    if (status === 'ACCEPTED') {
      await prisma.job.update({
        where: { id: existingProposal.jobId },
        data: { status: 'IN_PROGRESS' }
      });
    }
    
    const proposal = await prisma.proposal.update({
      where: {
        id: req.params.id
      },
      data: {
        amount,
        coverLetter,
        estimatedDuration,
        status
      },
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

    // Transform image URLs for Cloudinary
    const transformedProposal = {
      ...proposal,
      freelancer: {
        ...proposal.freelancer,
        image: proposal.freelancer.image 
          ? `${process.env.CLOUDINARY_CLOUD_NAME 
              ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${proposal.freelancer.image}` 
              : `https://egbackend-1.onrender.com/${proposal.freelancer.image}`}`
          : null
      }
    };
    
    // If proposal was rejected, create a notification for the freelancer
    if (status === 'REJECTED') {
      await prisma.notification.create({
        data: {
          userId: existingProposal.freelancerId,
          title: 'Proposal Rejected',
          message: `Your proposal for "${existingProposal.job.title}" has been rejected by ${existingProposal.job.client.name}`,
          read: false
        }
      });
    }
    
    res.json(transformedProposal);
  } catch (error) {
    console.error('Error updating proposal:', error);
    res.status(500).json({ error: 'Failed to update proposal' });
  }
});

// Delete a proposal
router.delete('/:id', async (req, res) => {
  try {
    // Check if proposal exists
    const existingProposal = await prisma.proposal.findUnique({
      where: { id: req.params.id }
    });
    
    if (!existingProposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    // Only allow freelancer who created the proposal or job owner to delete
    if (existingProposal.freelancerId !== req.user.id && 
        (await prisma.job.findUnique({ where: { id: existingProposal.jobId } })).clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this proposal' });
    }
    
    await prisma.proposal.delete({
      where: {
        id: req.params.id
      }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting proposal:', error);
    res.status(500).json({ error: 'Failed to delete proposal' });
  }
});

// Get a single proposal
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching proposal with ID:', req.params.id);
    console.log('User ID:', req.user.id);

    const proposal = await prisma.proposal.findUnique({
      where: {
        id: req.params.id
      },
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
            description: true,
            budget: true,
            status: true,
            deadline: true,
            clientId: true,
            client: {
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
    
    if (!proposal) {
      console.log('Proposal not found');
      return res.status(404).json({ error: 'Proposal not found' });
    }
    
    // Only allow freelancer who created the proposal or job owner to view
    if (proposal.freelancerId !== req.user.id && proposal.job.clientId !== req.user.id) {
      console.log('User not authorized. Freelancer:', proposal.freelancerId, 'Job owner:', proposal.job.clientId, 'Current user:', req.user.id);
      return res.status(403).json({ error: 'Not authorized to view this proposal' });
    }
    
    // Transform image URLs for Cloudinary
    const transformedProposal = {
      id: proposal.id,
      coverLetter: proposal.coverLetter,
      amount: proposal.amount,
      status: proposal.status,
      createdAt: proposal.createdAt,
      freelancer: {
        id: proposal.freelancer.id,
        name: proposal.freelancer.name,
        image: proposal.freelancer.image 
          ? `${process.env.CLOUDINARY_CLOUD_NAME 
              ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${proposal.freelancer.image}` 
              : `https://egbackend-1.onrender.com/${proposal.freelancer.image}`}`
          : null
      },
      job: {
        id: proposal.job.id,
        title: proposal.job.title,
        description: proposal.job.description,
        budget: proposal.job.budget,
        status: proposal.job.status,
        deadline: proposal.job.deadline,
        client: {
          id: proposal.job.client.id,
          name: proposal.job.client.name,
          image: proposal.job.client.image 
            ? `${process.env.CLOUDINARY_CLOUD_NAME 
                ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${proposal.job.client.image}` 
                : `https://egbackend-1.onrender.com/${proposal.job.client.image}`}`
            : null
        }
      }
    };
    
    console.log('Successfully fetched proposal');
    res.json(transformedProposal);
  } catch (error) {
    console.error('Error fetching proposal:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    
    if (error.code === 'P2023') {
      return res.status(400).json({ error: 'Invalid proposal ID format' });
    }
    res.status(500).json({ error: 'Failed to fetch proposal: ' + error.message });
  }
});

// Accept a proposal
router.post('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    console.log('Accepting proposal:', { id, userId });

    // Get the proposal with job and freelancer details
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        job: true,
        freelancer: true
      }
    });

    if (!proposal) {
      console.log('Proposal not found:', id);
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Check if user is the job owner
    if (proposal.job.clientId !== userId) {
      console.log('Unauthorized access:', { 
        jobClientId: proposal.job.clientId, 
        userId 
      });
      return res.status(403).json({ error: 'Not authorized to accept this proposal' });
    }

    // Check if job is still open
    if (proposal.job.status !== 'OPEN') {
      console.log('Job not open:', { 
        jobId: proposal.job.id, 
        status: proposal.job.status 
      });
      return res.status(400).json({ error: 'Job is no longer open for proposals' });
    }

    // Check if contract already exists
    const existingContract = await prisma.contract.findUnique({
      where: { proposalId: id }
    });

    if (existingContract) {
      console.log('Contract already exists:', { 
        proposalId: id, 
        contractId: existingContract.id 
      });
      return res.status(400).json({ error: 'A contract already exists for this proposal' });
    }

    // Start a transaction to update proposal, job, and create contract
    const result = await prisma.$transaction(async (prisma) => {
      console.log('Starting transaction for proposal acceptance');

      // Update proposal status
      const updatedProposal = await prisma.proposal.update({
        where: { id },
        data: { status: 'ACCEPTED' }
      });
      console.log('Updated proposal status:', updatedProposal.status);

      // Update job status
      const updatedJob = await prisma.job.update({
        where: { id: proposal.jobId },
        data: { status: 'IN_PROGRESS' }
      });
      console.log('Updated job status:', updatedJob.status);

      // Create contract
      const contract = await prisma.contract.create({
        data: {
          proposalId: id,
          status: 'PENDING',
          amount: proposal.amount,
          terms: proposal.coverLetter, // Using cover letter as initial terms
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      });
      console.log('Created contract:', contract.id);

      // Create notification for freelancer
      const freelancerNotification = await prisma.notification.create({
        data: {
          userId: proposal.freelancerId,
          title: 'Proposal Accepted - Contract Created',
          message: `Your proposal for "${proposal.job.title}" has been accepted. A contract has been created and is waiting for both parties to accept. Please review and accept the contract in your contracts page.`,
          read: false
        }
      });
      console.log('Created freelancer notification:', freelancerNotification.id);

      // Create notification for client
      const clientNotification = await prisma.notification.create({
        data: {
          userId: proposal.job.clientId,
          title: 'Contract Created',
          message: `A contract has been created for "${proposal.job.title}". Please review and accept the contract in your contracts page to begin work.`,
          read: false
        }
      });
      console.log('Created client notification:', clientNotification.id);

      return { proposal: updatedProposal, contract };
    });

    console.log('Successfully completed proposal acceptance transaction');
    res.json(result);
  } catch (error) {
    console.error('Error accepting proposal:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to accept proposal',
      details: error.message 
    });
  }
});

// Reject a proposal
router.put('/:proposalId/reject', async (req, res) => {
  try {
    const { proposalId } = req.params;

    // Get the proposal with job details
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        job: {
          select: {
            id: true,
            clientId: true,
            status: true
          }
        }
      }
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Check if user is the job owner
    if (proposal.job.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to reject this proposal' });
    }

    // Check if job is still open
    if (proposal.job.status !== 'OPEN') {
      return res.status(400).json({ error: 'This job is no longer open for proposals' });
    }

    // Update the proposal status to REJECTED
    const updatedProposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'REJECTED' },
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

    // Transform image URLs for Cloudinary
    const transformedProposal = {
      ...updatedProposal,
      freelancer: {
        ...updatedProposal.freelancer,
        image: updatedProposal.freelancer.image 
          ? `${process.env.CLOUDINARY_CLOUD_NAME 
              ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${updatedProposal.freelancer.image}` 
              : `https://egbackend-1.onrender.com/${updatedProposal.freelancer.image}`}`
          : null
      }
    };

    res.json(transformedProposal);
  } catch (error) {
    console.error('Error rejecting proposal:', error);
    res.status(500).json({ error: 'Failed to reject proposal' });
  }
});

module.exports = router; 