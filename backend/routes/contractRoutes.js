const express = require('express');
const router = express.Router();
const { PrismaClient, ContractStatus } = require('@prisma/client');
const auth = require('../middleware/auth');
const prisma = new PrismaClient();
const multer = require('multer');
const { validateContract, validateContractSubmission, formatValidationError, fileValidation } = require('../utils/validation');
const { uploadFile } = require('../utils/cloudinary');

// Test endpoint to check if contract routes are working
router.get('/test', async (req, res) => {
  try {
    res.json({
      message: 'Contract test endpoint',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      message: 'Error in contract test endpoint'
    });
  }
});

// Get all contracts for the current user
router.get('/', auth, async (req, res) => {
  try {
    console.log('Contracts route called, user:', req.user);
    console.log('Request headers:', req.headers);
    
    if (!req.user || !req.user.id) {
      console.log('No user found in contracts request');
      return res.status(401).json({ 
        success: false,
        error: 'User not authenticated' 
      });
    }

    const userId = req.user.id;
    console.log('Fetching contracts for user:', userId);
    const contracts = await prisma.contract.findMany({
      where: {
        OR: [
          { proposal: { job: { clientId: userId } } }, // For job posters
          { proposal: { freelancerId: userId } } // For freelancers
        ]
      },
      include: {
        proposal: {
          include: {
            job: {
              include: {
                client: true
              }
            },
            freelancer: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${contracts.length} contracts for user ${userId}`);
    console.log('Contracts:', contracts.map(c => ({ id: c.id, status: c.status, proposalId: c.proposalId })));
    
    res.json({
      success: true,
      data: contracts
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch contracts'
    });
  }
});

// Get contract by proposal ID
router.get('/proposal/:proposalId', auth, async (req, res) => {
  try {
    const { proposalId } = req.params;
    const userId = req.user.id;

    const contract = await prisma.contract.findFirst({
      where: {
        proposalId,
        OR: [
          { proposal: { job: { clientId: userId } } },
          { proposal: { freelancerId: userId } }
        ]
      },
      include: {
        proposal: {
          include: {
            job: {
              include: {
                client: true
              }
            },
            freelancer: true
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ 
        success: false,
        error: 'Contract not found' 
      });
    }

    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch contract' 
    });
  }
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit to match frontend
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
      cb(new Error(`Invalid file type. Only PDF, Word documents, text files, and archives are allowed. Received: ${file.mimetype}`));
    }
  }
});

// Error handler middleware for multer
const multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer error occurred
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message,
        field: err.field
      }
    });
  } else if (err) {
    // Other error occurred
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message
      }
    });
  }
  next();
};

// Error handler middleware
const handleError = (error, res) => {
  console.error('Error:', error);
  
  if (error.code === 'VALIDATION_ERROR') {
    return res.status(400).json({
      success: false,
      error: error
    });
  }

  if (error.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ERROR',
        message: 'A contract already exists for this proposal'
      }
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: error.message
    }
  });
};

// Create a new contract
router.post('/', auth, async (req, res) => {
  try {
    const { proposalId, terms, startDate, endDate, amount } = req.body;
    const userId = req.user.id;

    // Validate contract data
    const { error } = validateContract({ terms });
    if (error) {
      return res.status(400).json({
        success: false,
        error: formatValidationError(error)
      });
    }

    // Check if contract already exists
    const existingContract = await prisma.contract.findFirst({
      where: { proposalId }
    });

    if (existingContract) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'A contract already exists for this proposal'
        }
      });
    }

    // Get the proposal with job details
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        job: true,
        freelancer: true
      }
    });

    if (!proposal) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Proposal not found'
        }
      });
    }

    // Check if user is authorized to create contract
    if (proposal.job.clientId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only the client can create a contract'
        }
      });
    }

    // Create contract
    const contract = await prisma.contract.create({
      data: {
        proposalId,
        terms,
        startDate,
        endDate,
        amount,
        status: 'PENDING'
      },
      include: {
        proposal: {
          include: {
            job: {
              include: {
                client: true
              }
            },
            freelancer: true
          }
        }
      }
    });

    // Create notification for freelancer
    await prisma.notification.create({
      data: {
        userId: proposal.freelancerId,
        title: 'New Contract',
        message: `A new contract has been created for "${proposal.job.title}". Please review and accept.`,
        read: false
      }
    });

    res.json({
      success: true,
      data: contract
    });
  } catch (error) {
    handleError(error, res);
  }
});

// Accept a contract
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get the contract with the proposal and related data
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        proposal: {
          include: {
            job: true,
            freelancer: true
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ 
        success: false,
        error: 'Contract not found' 
      });
    }

    // Check if user is either the freelancer or the client
    const isFreelancer = contract.proposal.freelancerId === userId;
    const isClient = contract.proposal.job.clientId === userId;

    if (!isFreelancer && !isClient) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to accept this contract' 
      });
    }

    // Update contract status based on who is accepting
    let newStatus;
    if (isFreelancer) {
      newStatus = ContractStatus.FREELANCER_ACCEPTED;
    } else {
      // When client accepts, set status to ACTIVE
      newStatus = ContractStatus.ACTIVE;
    }

    // If both parties have accepted, set status to ACTIVE
    if ((isFreelancer && contract.status === ContractStatus.CLIENT_ACCEPTED) ||
        (isClient && contract.status === ContractStatus.FREELANCER_ACCEPTED)) {
      newStatus = ContractStatus.ACTIVE;
    }

    // Update the contract using the Prisma enum
    const updatedContract = await prisma.contract.update({
      where: { id },
      data: { 
        status: newStatus,
        updatedAt: new Date()
      },
      include: {
        proposal: {
          include: {
            job: {
              include: {
                client: true
              }
            },
            freelancer: true
          }
        }
      }
    });

    // Create notification for the other party
    const notificationRecipientId = isFreelancer ? contract.proposal.job.clientId : contract.proposal.freelancerId;
    let notificationMessage = isFreelancer 
      ? 'The freelancer has accepted the contract. Work can now begin!'
      : 'The client has accepted the contract. Once you accept, work can begin.';

    await prisma.notification.create({
      data: {
        userId: notificationRecipientId,
        title: 'Contract Update',
        message: notificationMessage,
        read: false
      }
    });

    // Log the contract status update
    console.log(`Contract ${id} status updated from ${contract.status} to ${newStatus}`);
    console.log('Updated contract:', updatedContract);

    res.json({
      success: true,
      data: updatedContract
    });
  } catch (error) {
    console.error('Error accepting contract:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to accept contract: ' + error.message 
    });
  }
});

// Decline a contract
router.post('/:id/decline', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    // Get the contract with the proposal and related data
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        proposal: {
          include: {
            job: true,
            freelancer: true
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ 
        success: false,
        error: 'Contract not found' 
      });
    }

    // Check if user is either the freelancer or the client
    const isFreelancer = contract.proposal.freelancerId === userId;
    const isClient = contract.proposal.job.clientId === userId;

    if (!isFreelancer && !isClient) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to decline this contract' 
      });
    }

    // Create a ticket for admin review
    const ticket = await prisma.ticket.create({
      data: {
        title: `Contract Rejection - ${contract.proposal.job.title}`,
        description: `Contract ID: ${contract.id}\nJob Title: ${contract.proposal.job.title}\n${isFreelancer ? 'Client' : 'Freelancer'}: ${isFreelancer ? contract.proposal.job.client.name : contract.proposal.freelancer.name}\nAmount: ${contract.amount}\nReason: ${reason || 'No reason provided'}`,
        status: 'OPEN',
        priority: 'HIGH',
        contractId: contract.id,
        createdById: userId,
        assignedToId: null // Will be assigned by admin
      }
    });

    // Update contract status to UNDER_ADMIN_REVIEW
    const updatedContract = await prisma.contract.update({
      where: { id },
      data: { 
        status: 'UNDER_ADMIN_REVIEW',
        terms: `${contract.terms}\n\nDeclined by ${isFreelancer ? 'freelancer' : 'client'}. Reason: ${reason || 'No reason provided'}\nTicket ID: ${ticket.id}`
      },
      include: {
        proposal: {
          include: {
            job: {
              include: {
                client: true
              }
            },
            freelancer: true
          }
        }
      }
    });

    // Create notification for the other party
    const notificationRecipientId = isFreelancer ? contract.proposal.job.clientId : contract.proposal.freelancerId;
    const notificationMessage = isFreelancer 
      ? `The freelancer has declined the contract and it is now under admin review.${reason ? ` Reason: ${reason}` : ''}`
      : `The client has declined the contract and it is now under admin review.${reason ? ` Reason: ${reason}` : ''}`;

    await prisma.notification.create({
      data: {
        userId: notificationRecipientId,
        title: 'Contract Under Admin Review',
        message: notificationMessage,
        read: false
      }
    });

    res.json({
      success: true,
      data: updatedContract
    });
  } catch (error) {
    console.error('Error declining contract:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to decline contract' 
    });
  }
});

// Complete a contract
router.put('/:contractId/complete', auth, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { user } = req;

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        proposal: {
          include: {
            job: true,
            freelancer: true
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user is authorized to complete the contract
    if (contract.proposal.freelancerId !== user.id && contract.proposal.job.clientId !== user.id) {
      return res.status(403).json({ error: 'Not authorized to complete contract' });
    }

    // Start a transaction to update contract, job status and create notifications
    const result = await prisma.$transaction(async (prisma) => {
      // Update contract status to COMPLETED
      const updatedContract = await prisma.contract.update({
        where: { id: contractId },
        data: { status: 'COMPLETED' },
        include: {
          proposal: {
            include: {
              job: {
                include: {
                  client: true
                }
              },
              freelancer: true
            }
          }
        }
      });

      // Update job status to COMPLETED
      await prisma.job.update({
        where: { id: contract.proposal.job.id },
        data: { status: 'COMPLETED' }
      });

      // Create notification for the freelancer
      await prisma.notification.create({
        data: {
          userId: contract.proposal.freelancer.id,
          title: 'Contract Completed',
          message: `The contract for "${contract.proposal.job.title}" has been completed.`,
          read: false
        }
      });

      // Create notification for the client
      await prisma.notification.create({
        data: {
          userId: contract.proposal.job.clientId,
          title: 'Contract Completed',
          message: `The contract for "${contract.proposal.job.title}" has been completed.`,
          read: false
        }
      });

      return updatedContract;
    });

    res.json(result);
  } catch (error) {
    console.error('Error completing contract:', error);
    res.status(500).json({ error: 'Failed to complete contract' });
  }
});

// Submit work for a contract
router.post('/:contractId/submit', auth, upload.single('file'), multerErrorHandler, async (req, res) => {
  try {
    console.log('[Contract] Starting work submission process');
    console.log('[Contract] Request body:', {
      hasDescription: !!req.body.description,
      hasFile: !!req.file,
      fileDetails: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });

    // Validate submission data
    const { error } = validateContractSubmission(req.body);
    if (error) {
      console.error('[Contract] Validation error:', error.details);
      return res.status(400).json({
        success: false,
        error: formatValidationError(error)
      });
    }

    // Find the contract
    const contract = await prisma.contract.findUnique({
      where: { id: req.params.contractId },
      include: {
        proposal: {
          include: {
            job: true,
            freelancer: true
          }
        }
      }
    });
    if (!contract) {
      console.error('[Contract] Contract not found:', req.params.contractId);
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    console.log('[Contract] Found contract:', {
      id: contract.id,
      status: contract.status,
      freelancerId: contract.proposal.freelancerId,
      userId: req.user.id
    });

    // Check if user is authorized to submit work
    if (contract.proposal.freelancerId.toString() !== req.user.id.toString()) {
      console.error('[Contract] Unauthorized submission attempt:', {
        contractFreelancerId: contract.proposal.freelancerId,
        userId: req.user.id
      });
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to submit work for this contract'
      });
    }

    // Check if contract is active
    if (contract.status !== 'ACTIVE') {
      console.error('[Contract] Invalid contract status for submission:', contract.status);
      return res.status(400).json({
        success: false,
        error: 'Cannot submit work for a contract that is not active'
      });
    }

    // Handle file upload if present
    let fileUrl = null;
    if (req.file) {
      try {
        console.log('[Contract] Starting file upload to Cloudinary');
        const fileBuffer = req.file.buffer;
        const base64File = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;

        const uploadResult = await uploadFile(base64File, 'contract-submissions');
        console.log('[Contract] File upload successful:', {
          publicId: uploadResult.public_id,
          hasUrl: !!uploadResult.secure_url
        });

        fileUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('[Contract] File upload failed:', {
          error: uploadError,
          message: uploadError.message,
          code: uploadError.http_code,
          details: uploadError.error || uploadError
        });
        return res.status(500).json({
          success: false,
          error: 'Failed to upload file: ' + uploadError.message
        });
      }
    }

    // Update contract with submission
    try {
      console.log('[Contract] Updating contract with submission data');
      const updatedContract = await prisma.contract.update({
        where: { id: req.params.contractId },
        data: {
          status: 'PENDING_REVIEW',
          submissionData: {
            description: req.body.description,
            fileUrl: fileUrl,
            submittedAt: new Date().toISOString(),
            fileName: req.file?.originalname
          },
          submissionDescription: req.body.description,
          submittedAt: new Date()
        },
        include: {
          proposal: {
            include: {
              job: {
                include: {
                  client: true
                }
              },
              freelancer: true
            }
          }
        }
      });

      console.log('[Contract] Contract updated successfully:', {
        id: updatedContract.id,
        newStatus: updatedContract.status,
        hasSubmission: !!updatedContract.submissionData
      });

      // Create support ticket for review
      try {
        console.log('[Contract] Creating support ticket for review');
        await prisma.ticket.create({
          data: {
            title: `Work Submission - ${updatedContract.proposal.job.title}`,
            description: `Work submitted for "${updatedContract.proposal.job.title}".`,
            status: 'OPEN',
            priority: 'MEDIUM',
            contractId: updatedContract.id,
            createdById: req.user.id,
            assignedToId: updatedContract.proposal.freelancerId
          }
        });
        console.log('[Contract] Support ticket created:', updatedContract.id);
      } catch (ticketError) {
        console.error('[Contract] Failed to create support ticket:', ticketError);
        // Don't fail the submission if ticket creation fails
      }

      // Create notification for client
      await prisma.notification.create({
        data: {
          userId: updatedContract.proposal.job.clientId,
          title: 'Work Submitted for Review',
          message: `The freelancer has submitted work for "${updatedContract.proposal.job.title}". Please review and accept or reject the submission.`,
          read: false
        }
      });

      res.json({
        success: true,
        message: 'Work submitted successfully',
        data: updatedContract
      });
    } catch (updateError) {
      console.error('[Contract] Failed to update contract:', {
        error: updateError,
        message: updateError.message,
        stack: updateError.stack
      });
      return res.status(500).json({
        success: false,
        error: 'Failed to update contract: ' + updateError.message
      });
    }
  } catch (error) {
    console.error('[Contract] Unhandled error in work submission:', {
      error: error,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while submitting work'
    });
  }
});

// Review submitted work
router.post('/:contractId/review', auth, async (req, res) => {
  try {
    const { contractId } = req.params;
    const { accepted, feedback } = req.body;
    const userId = req.user.id;

    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        proposal: {
          include: {
            job: true,
            freelancer: true
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user is the client
    if (contract.proposal.job.clientId !== userId) {
      return res.status(403).json({ error: 'Only the client can review work' });
    }

    // Check if contract is pending review
    if (contract.status !== 'PENDING_REVIEW') {
      return res.status(400).json({ error: 'Contract must be pending review' });
    }

    let newStatus;
    let notificationMessage;

    if (accepted) {
      newStatus = 'COMPLETED';
      notificationMessage = `Your work for "${contract.proposal.job.title}" has been accepted and marked as completed.`;
    } else {
      newStatus = 'ACTIVE';
      notificationMessage = `Your work for "${contract.proposal.job.title}" needs revisions. ${feedback || ''}`;

      // Create tickets for both parties when work is rejected
      await prisma.$transaction([
        // Create client's ticket
        prisma.ticket.create({
          data: {
            title: `Work Rejection - ${contract.proposal.job.title}`,
            description: `Work submitted for "${contract.proposal.job.title}" was rejected. Reason: ${feedback}`,
            status: 'OPEN',
            priority: 'HIGH',
            contractId: contractId,
            createdById: userId,
            assignedToId: contract.proposal.freelancerId
          }
        }),
        // Create freelancer's ticket
        prisma.ticket.create({
          data: {
            title: `Work Rejection - ${contract.proposal.job.title}`,
            description: `Your work for "${contract.proposal.job.title}" was rejected. Reason: ${feedback}`,
            status: 'OPEN',
            priority: 'HIGH',
            contractId: contractId,
            createdById: userId,
            assignedToId: contract.proposal.freelancerId
          }
        })
      ]);
    }

    // Update contract status
    const updatedContract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        status: newStatus,
        clientFeedback: feedback,
        reviewedAt: new Date()
      },
      include: {
        proposal: {
          include: {
            job: {
              include: {
                client: true
              }
            },
            freelancer: true
          }
        }
      }
    });

    // Create notification for freelancer
    await prisma.notification.create({
      data: {
        userId: contract.proposal.freelancerId,
        title: accepted ? 'Work Accepted' : 'Work Needs Revision',
        message: notificationMessage,
        read: false
      }
    });

    res.json({
      success: true,
      data: updatedContract
    });
  } catch (error) {
    console.error('Error reviewing work:', error);
    res.status(500).json({ error: 'Failed to review work' });
  }
});

module.exports = router; 