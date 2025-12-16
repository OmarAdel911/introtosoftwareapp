const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

// Get time entries for a job
router.get('/job/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        proposals: {
          where: {
            freelancerId: req.user.id,
            status: 'ACCEPTED'
          }
        }
      }
    });

    if (!job || job.proposals.length === 0) {
      return res.status(403).json({ message: 'Not authorized to view time entries for this job' });
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        jobId,
        userId: req.user.id
      },
      orderBy: {
        startTime: 'desc'
      }
    });

    res.json(timeEntries);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start time entry
router.post('/start', auth, async (req, res) => {
  try {
    const { jobId, description } = req.body;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        proposals: {
          where: {
            freelancerId: req.user.id,
            status: 'ACCEPTED'
          }
        }
      }
    });

    if (!job || job.proposals.length === 0) {
      return res.status(403).json({ message: 'Not authorized to track time for this job' });
    }

    // Check if there's already an active time entry
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        jobId,
        userId: req.user.id,
        endTime: null
      }
    });

    if (activeEntry) {
      return res.status(400).json({ message: 'You already have an active time entry for this job' });
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        jobId,
        userId: req.user.id,
        description,
        startTime: new Date()
      }
    });

    res.json(timeEntry);
  } catch (error) {
    console.error('Error starting time entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stop time entry
router.post('/stop/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    if (timeEntry.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (timeEntry.endTime) {
      return res.status(400).json({ message: 'Time entry already stopped' });
    }

    const endTime = new Date();
    const duration = Math.round((endTime - timeEntry.startTime) / 1000 / 60); // duration in minutes

    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        endTime,
        duration
      }
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('Error stopping time entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add screenshot to time entry
router.post('/:id/screenshots', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { screenshotUrl } = req.body;

    const timeEntry = await prisma.timeEntry.findUnique({
      where: { id }
    });

    if (!timeEntry) {
      return res.status(404).json({ message: 'Time entry not found' });
    }

    if (timeEntry.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        screenshots: {
          push: screenshotUrl
        }
      }
    });

    res.json(updatedEntry);
  } catch (error) {
    console.error('Error adding screenshot:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get time entry summary
router.get('/summary/:jobId', auth, async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        proposals: {
          where: {
            freelancerId: req.user.id,
            status: 'ACCEPTED'
          }
        }
      }
    });

    if (!job || job.proposals.length === 0) {
      return res.status(403).json({ message: 'Not authorized to view time summary for this job' });
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        jobId,
        userId: req.user.id
      }
    });

    const summary = {
      totalHours: timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 60,
      totalEntries: timeEntries.length,
      lastEntry: timeEntries[0] || null
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching time summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 