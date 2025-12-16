const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { triggerWebhooks } = require('./webhookRoutes');

const prisma = new PrismaClient();

// Get all tickets for a user
router.get('/tickets', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    // Build filter
    const filter = { userId: req.user.id };
    if (status) {
      filter.status = status;
    }
    
    // Get tickets with pagination
    const tickets = await prisma.ticket.findMany({
      where: filter,
      include: {
        responses: {
          orderBy: { createdAt: 'asc' }
        },
        attachments: true
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });
    
    // Get total count for pagination
    const total = await prisma.ticket.count({
      where: filter
    });
    
    res.json({
      tickets,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// Create a new ticket
router.post('/tickets', auth, async (req, res) => {
  try {
    const { subject, description, category, priority, attachments } = req.body;
    
    // Create ticket
    const ticket = await prisma.ticket.create({
      data: {
        subject,
        description,
        category,
        priority,
        status: 'OPEN',
        userId: req.user.id,
        attachments: attachments ? {
          create: attachments.map(url => ({ url }))
        } : undefined
      },
      include: {
        attachments: true
      }
    });
    
    // Trigger webhook for ticket creation
    await triggerWebhooks('ticket.created', {
      ticketId: ticket.id,
      userId: req.user.id,
      subject,
      category,
      priority
    });
    
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// Get ticket details
router.get('/tickets/:ticketId', auth, async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Get ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        responses: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        },
        attachments: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Check if user has access to this ticket
    if (ticket.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to view this ticket' });
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Failed to fetch ticket' });
  }
});

// Add response to ticket
router.post('/tickets/:ticketId/responses', auth, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, attachments } = req.body;
    
    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Check if user has access to this ticket
    if (ticket.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to respond to this ticket' });
    }
    
    // Create response
    const response = await prisma.ticketResponse.create({
      data: {
        message,
        ticketId,
        userId: req.user.id,
        attachments: attachments ? {
          create: attachments.map(url => ({ url }))
        } : undefined
      },
      include: {
        attachments: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });
    
    // Update ticket status to IN_PROGRESS if it was OPEN
    if (ticket.status === 'OPEN') {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'IN_PROGRESS' }
      });
    }
    
    // Trigger webhook for ticket response
    await triggerWebhooks('ticket.response.created', {
      ticketId,
      responseId: response.id,
      userId: req.user.id,
      message
    });
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating ticket response:', error);
    res.status(500).json({ error: 'Failed to create ticket response' });
  }
});

// Update ticket status
router.put('/tickets/:ticketId/status', auth, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;
    
    // Check if ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId }
    });
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Check if user has access to this ticket
    if (ticket.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this ticket' });
    }
    
    // Update ticket status
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status }
    });
    
    // Trigger webhook for ticket status update
    await triggerWebhooks('ticket.status.updated', {
      ticketId,
      userId: req.user.id,
      oldStatus: ticket.status,
      newStatus: status
    });
    
    res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

// Get ticket categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await prisma.ticketCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching ticket categories:', error);
    res.status(500).json({ error: 'Failed to fetch ticket categories' });
  }
});

// Get ticket priorities
router.get('/priorities', async (req, res) => {
  try {
    const priorities = await prisma.ticketPriority.findMany({
      where: { isActive: true },
      orderBy: { level: 'asc' }
    });
    
    res.json(priorities);
  } catch (error) {
    console.error('Error fetching ticket priorities:', error);
    res.status(500).json({ error: 'Failed to fetch ticket priorities' });
  }
});

// Get FAQ categories
router.get('/faq/categories', async (req, res) => {
  try {
    const categories = await prisma.faqCategory.findMany({
      where: { isActive: true },
      include: {
        faqs: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching FAQ categories:', error);
    res.status(500).json({ error: 'Failed to fetch FAQ categories' });
  }
});

// Search FAQs
router.get('/faq/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const faqs = await prisma.faq.findMany({
      where: {
        isActive: true,
        OR: [
          { question: { contains: query, mode: 'insensitive' } },
          { answer: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        category: true
      },
      orderBy: { order: 'asc' }
    });
    
    res.json(faqs);
  } catch (error) {
    console.error('Error searching FAQs:', error);
    res.status(500).json({ error: 'Failed to search FAQs' });
  }
});

module.exports = router; 