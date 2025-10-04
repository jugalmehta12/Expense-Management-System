const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');

/**
 * @swagger
 * /api/approvals/pending:
 *   get:
 *     summary: Get pending expense approvals
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of expenses per page
 *     responses:
 *       200:
 *         description: Pending approvals retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient privileges
 */
router.get('/pending', async (req, res) => {
  try {
    // Check if user has approval permissions
    if (!['manager', 'finance', 'director', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges to view pending approvals'
      });
    }

    const { page = 1, limit = 10 } = req.query;

    // Build query based on user role
    let query = { 
      company: req.user.company,
      status: 'pending'
    };

    // Role-based filtering
    if (req.user.role === 'manager') {
      query.currentApprover = req.user.id;
    }

    const expenses = await Expense.find(query)
      .populate('user', 'name email department')
      .populate('currentApprover', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: expenses,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching pending approvals',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/approvals/{id}/approve:
 *   post:
 *     summary: Approve an expense
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *                 description: Approval comments
 *     responses:
 *       200:
 *         description: Expense approved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Expense not found
 */
router.post('/:id/approve', async (req, res) => {
  try {
    const { comments } = req.body;
    const expenseId = req.params.id;

    const expense = await Expense.findOne({
      _id: expenseId,
      company: req.user.company
    }).populate('user');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user has permission to approve
    if (!canApprove(req.user, expense)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges to approve this expense'
      });
    }

    // Add approval to history
    const approval = {
      approver: req.user.id,
      action: 'approved',
      comments,
      timestamp: new Date()
    };

    expense.approvalHistory.push(approval);

    // Determine next approver or final approval
    const nextApprover = getNextApprover(expense, req.user);
    
    if (nextApprover) {
      expense.currentApprover = nextApprover;
    } else {
      expense.status = 'approved';
      expense.currentApprover = null;
      expense.approvedAt = new Date();
    }

    await expense.save();

    // Send notification
    const io = req.app.get('io');
    io.to(`user-${expense.user._id}`).emit('expense-approved', {
      expenseId: expense._id,
      title: expense.title,
      approver: req.user.name,
      status: expense.status
    });

    if (nextApprover) {
      io.to(`user-${nextApprover}`).emit('approval-required', {
        expenseId: expense._id,
        title: expense.title,
        amount: expense.amount,
        submitter: expense.user.name
      });
    }

    res.json({
      success: true,
      message: expense.status === 'approved' ? 'Expense approved successfully' : 'Expense forwarded to next approver',
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving expense',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/approvals/{id}/reject:
 *   post:
 *     summary: Reject an expense
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Rejection reason
 *               comments:
 *                 type: string
 *                 description: Additional comments
 *     responses:
 *       200:
 *         description: Expense rejected successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Expense not found
 */
router.post('/:id/reject', async (req, res) => {
  try {
    const { reason, comments } = req.body;
    const expenseId = req.params.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const expense = await Expense.findOne({
      _id: expenseId,
      company: req.user.company
    }).populate('user');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user has permission to reject
    if (!canApprove(req.user, expense)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges to reject this expense'
      });
    }

    // Add rejection to history
    const rejection = {
      approver: req.user.id,
      action: 'rejected',
      reason,
      comments,
      timestamp: new Date()
    };

    expense.approvalHistory.push(rejection);
    expense.status = 'rejected';
    expense.currentApprover = null;
    expense.rejectedAt = new Date();

    await expense.save();

    // Send notification
    const io = req.app.get('io');
    io.to(`user-${expense.user._id}`).emit('expense-rejected', {
      expenseId: expense._id,
      title: expense.title,
      rejector: req.user.name,
      reason,
      comments
    });

    res.json({
      success: true,
      message: 'Expense rejected successfully',
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting expense',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/approvals/{id}/override:
 *   post:
 *     summary: Override expense approval (Admin/Director only)
 *     tags: [Approvals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - reason
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 description: Override action
 *               reason:
 *                 type: string
 *                 description: Override reason
 *               comments:
 *                 type: string
 *                 description: Additional comments
 *     responses:
 *       200:
 *         description: Expense override successful
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/Director access required
 *       404:
 *         description: Expense not found
 */
router.post('/:id/override', async (req, res) => {
  try {
    // Only admins and directors can override
    if (!['admin', 'director'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators and directors can override approvals'
      });
    }

    const { action, reason, comments } = req.body;
    const expenseId = req.params.id;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Valid action (approve/reject) is required'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Override reason is required'
      });
    }

    const expense = await Expense.findOne({
      _id: expenseId,
      company: req.user.company
    }).populate('user');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Add override to history
    const override = {
      approver: req.user.id,
      action: `override-${action}`,
      reason,
      comments,
      timestamp: new Date()
    };

    expense.approvalHistory.push(override);
    expense.status = action === 'approve' ? 'approved' : 'rejected';
    expense.currentApprover = null;
    
    if (action === 'approve') {
      expense.approvedAt = new Date();
    } else {
      expense.rejectedAt = new Date();
    }

    await expense.save();

    // Send notification
    const io = req.app.get('io');
    io.to(`user-${expense.user._id}`).emit(`expense-${action}d`, {
      expenseId: expense._id,
      title: expense.title,
      approver: req.user.name,
      override: true,
      reason,
      comments
    });

    res.json({
      success: true,
      message: `Expense ${action}d successfully (override)`,
      data: expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing override',
      error: error.message
    });
  }
});

// Helper functions
function canApprove(user, expense) {
  // Admin can approve anything
  if (user.role === 'admin') return true;
  
  // Check if user is the current approver
  if (expense.currentApprover && expense.currentApprover.toString() === user.id) {
    return true;
  }
  
  // Role-based approval rules
  if (user.role === 'director') return true;
  if (user.role === 'finance' && expense.amount >= 1000) return true;
  if (user.role === 'manager' && expense.amount < 1000) return true;
  
  return false;
}

function getNextApprover(expense, currentApprover) {
  const amount = expense.amount;
  
  // Approval flow based on amount and current approver role
  if (currentApprover.role === 'manager' && amount >= 1000) {
    // Manager approved, but amount requires finance approval
    return findUserByRole(expense.company, 'finance');
  }
  
  if (currentApprover.role === 'finance' && amount >= 5000) {
    // Finance approved, but amount requires director approval
    return findUserByRole(expense.company, 'director');
  }
  
  // No further approval needed
  return null;
}

async function findUserByRole(companyId, role) {
  const User = require('../models/User');
  const user = await User.findOne({ 
    company: companyId, 
    role, 
    isActive: true 
  });
  return user ? user._id : null;
}

module.exports = router;