/**
 * IAM Usage Examples
 * 
 * This file demonstrates how to use the IAM middleware in your routes
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  requirePermission, 
  requireRole, 
  requireOwnership,
  requireOwnershipOrPermission,
  PERMISSIONS 
} = require('../middleware/iam');

// ============================================
// Example 1: Simple Permission Check
// ============================================
// Only users with job:create permission can create jobs
router.post('/jobs',
  auth,
  requirePermission(PERMISSIONS.JOB_CREATE),
  async (req, res) => {
    // Only CLIENT role can reach here (they have job:create permission)
    const job = await createJob(req.body, req.user.id);
    res.json(job);
  }
);

// ============================================
// Example 2: Role-Based Access
// ============================================
// Only freelancers can access this endpoint
router.get('/freelancer/dashboard',
  auth,
  requireRole('FREELANCER'),
  async (req, res) => {
    const dashboard = await getFreelancerDashboard(req.user.id);
    res.json(dashboard);
  }
);

// ============================================
// Example 3: Permission + Ownership Check
// ============================================
// User must have permission AND own the resource
router.put('/jobs/:id',
  auth,
  requirePermission(PERMISSIONS.JOB_UPDATE),
  requireOwnership('job', 'id', 'clientId'),
  async (req, res) => {
    // User must be the job owner (client)
    const job = await updateJob(req.params.id, req.body);
    res.json(job);
  }
);

// ============================================
// Example 4: Ownership OR Permission
// ============================================
// User can access if they own it OR have admin permission
router.get('/contracts/:id',
  auth,
  requireOwnershipOrPermission(
    PERMISSIONS.CONTRACT_READ,
    'contract',
    'id'
  ),
  async (req, res) => {
    // Both client and freelancer can view their contracts
    const contract = await getContract(req.params.id);
    res.json(contract);
  }
);

// ============================================
// Example 5: Multiple Roles
// ============================================
// Allow multiple roles to access
router.get('/notifications',
  auth,
  requireRole('FREELANCER', 'CLIENT', 'ADMIN'),
  requirePermission(PERMISSIONS.NOTIFICATION_READ),
  async (req, res) => {
    const notifications = await getNotifications(req.user.id);
    res.json(notifications);
  }
);

// ============================================
// Example 6: Admin Only with Specific Permission
// ============================================
router.get('/admin/users',
  auth,
  requireRole('ADMIN'),
  requirePermission(PERMISSIONS.ADMIN_USERS),
  async (req, res) => {
    const users = await getAllUsers();
    res.json(users);
  }
);

// ============================================
// Example 7: Complex Business Logic
// ============================================
// Freelancer can submit proposal, but only for jobs they haven't already proposed
router.post('/proposals',
  auth,
  requireRole('FREELANCER'),
  requirePermission(PERMISSIONS.PROPOSAL_CREATE),
  async (req, res) => {
    const { jobId } = req.body;
    
    // Check if freelancer already has a proposal for this job
    const existingProposal = await prisma.proposal.findFirst({
      where: {
        jobId,
        freelancerId: req.user.id
      }
    });

    if (existingProposal) {
      return res.status(400).json({ 
        error: 'You have already submitted a proposal for this job' 
      });
    }

    const proposal = await createProposal(req.body, req.user.id);
    res.json(proposal);
  }
);

// ============================================
// Example 8: Conditional Access Based on Resource State
// ============================================
// Client can only accept proposals for their own jobs
router.patch('/proposals/:id/accept',
  auth,
  requirePermission(PERMISSIONS.PROPOSAL_ACCEPT),
  async (req, res) => {
    const proposal = await prisma.proposal.findUnique({
      where: { id: req.params.id },
      include: { job: true }
    });

    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found' });
    }

    // Check ownership
    if (proposal.job.clientId !== req.user.id) {
      return res.status(403).json({ 
        error: 'You can only accept proposals for your own jobs' 
      });
    }

    const updatedProposal = await acceptProposal(req.params.id);
    res.json(updatedProposal);
  }
);

module.exports = router;

