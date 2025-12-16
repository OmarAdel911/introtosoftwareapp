const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Get reviews for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { userId },
      include: {
        job: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get reviews for a job
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { jobId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Create a new review
router.post('/', auth, async (req, res) => {
  try {
    const { jobId, rating, comment } = req.body;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        proposals: {
          where: { status: 'ACCEPTED' }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user is authorized to review (either client or freelancer of the job)
    const isAuthorized = job.clientId === req.user.id || 
      job.proposals.some(p => p.freelancerId === req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to review this job' });
    }

    // Check if user has already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        jobId,
        userId: req.user.id
      }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this job' });
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        jobId,
        userId: req.user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create review' });
  }
});

// Update a review
router.put('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        comment
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update review' });
  }
});

// Delete a review
router.delete('/:reviewId', auth, async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.review.delete({
      where: { id: reviewId }
    });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

module.exports = router; 