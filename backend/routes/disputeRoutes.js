const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all disputes for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const disputes = await prisma.dispute.findMany({
      where: {
        OR: [
          { userId: req.user.id },
          { respondentId: req.user.id },
        ],
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        respondent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(disputes);
  } catch (error) {
    console.error('Error fetching disputes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific dispute
router.get('/:id', auth, async (req, res) => {
  try {
    const dispute = await prisma.dispute.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { userId: req.user.id },
          { respondentId: req.user.id },
        ],
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
            budget: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        respondent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    res.json(dispute);
  } catch (error) {
    console.error('Error fetching dispute:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new dispute
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, jobId, respondentId } = req.body;

    // Check if the job exists and user is involved
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        OR: [
          { clientId: req.user.id },
          {
            proposals: {
              some: {
                freelancerId: req.user.id,
                status: 'ACCEPTED',
              },
            },
          },
        ],
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found or not authorized' });
    }

    const dispute = await prisma.dispute.create({
      data: {
        title,
        description,
        jobId,
        userId: req.user.id,
        respondentId,
        status: 'OPEN',
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        respondent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(dispute);
  } catch (error) {
    console.error('Error creating dispute:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a dispute
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, resolution } = req.body;

    // Only allow updates if user is involved in the dispute
    const dispute = await prisma.dispute.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { userId: req.user.id },
          { respondentId: req.user.id },
        ],
      },
    });

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found or not authorized' });
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id: req.params.id },
      data: {
        status,
        resolution,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        respondent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(updatedDispute);
  } catch (error) {
    console.error('Error updating dispute:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a comment to a dispute
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;

    // Check if user is involved in the dispute
    const dispute = await prisma.dispute.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { userId: req.user.id },
          { respondentId: req.user.id },
        ],
      },
    });

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found or not authorized' });
    }

    // Create a notification for the other party
    const notificationUserId = dispute.userId === req.user.id
      ? dispute.respondentId
      : dispute.userId;

    await prisma.$transaction([
      prisma.notification.create({
        data: {
          title: 'New Dispute Comment',
          message: `A new comment has been added to dispute: ${dispute.title}`,
          userId: notificationUserId,
        },
      }),
    ]);

    res.json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 