const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult, param, query } = require('express-validator');
const Expense = require('../models/Expense');
const Company = require('../models/Company');
const User = require('../models/User');
const { requireRole, requireSameUserOrManager } = require('../middleware/auth');
const { validateObjectId, validatePagination, validateSearchQuery } = require('../middleware/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/receipts');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 5 // Maximum 5 files per request
  }
});

/**
 * @swagger
 * /api/expenses/recent:
 *   get:
 *     summary: Get recent expenses
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent expenses to retrieve
 *     responses:
 *       200:
 *         description: Recent expenses retrieved successfully
 */
router.get('/recent', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { limit = 10 } = req.query;
    const userId = req.user._id;

    // Get recent expenses for the current user
    const expenses = await Expense.find({
      submittedBy: userId
    })
    .populate('submittedBy', 'firstName lastName email')
    .populate('approvalFlow.approver', 'firstName lastName')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

    // Format the expenses for frontend consumption
    const formattedExpenses = expenses.map(expense => ({
      id: expense.expenseNumber || expense._id,
      description: expense.description,
      amount: expense.amount,
      currency: expense.currency,
      category: expense.category,
      date: expense.date,
      status: expense.status,
      submittedBy: `${expense.submittedBy.firstName} ${expense.submittedBy.lastName}`,
      approver: expense.approvalFlow && expense.approvalFlow.length > 0 
        ? `${expense.approvalFlow[0].approver?.firstName || ''} ${expense.approvalFlow[0].approver?.lastName || ''}`.trim()
        : 'N/A',
      receipt: expense.receipts && expense.receipts.length > 0,
      ocrProcessed: expense.ocrData && expense.ocrData.processed,
      confidence: expense.ocrData?.confidence || null,
      flagReason: expense.flags && expense.flags.length > 0 ? expense.flags[0].reason : null
    }));

    res.json({
      success: true,
      expenses: formattedExpenses,
      count: formattedExpenses.length
    });
  } catch (error) {
    console.error('Error fetching recent expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent expenses'
    });
  }
});

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get expenses with filtering and pagination
 */
router.get('/', validatePagination, validateSearchQuery, async (req, res) => {
  try {
    const {
      status,
      category,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    let query = { 
      submittedBy: req.user._id,
      company: req.user.company 
    };

    if (status) query.status = status;
    if (category) query.category = category;

    const expenses = await Expense.find(query)
      .populate('submittedBy', 'firstName lastName')
      .populate('approvalFlow.approver', 'firstName lastName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses'
    });
  }
});

/**
 * @swagger
 * /api/expenses/create:
 *   post:
 *     summary: Create a new expense
 */
router.post('/create', [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('date').isISO8601().withMessage('Date must be valid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, category, description, date, currency = 'USD' } = req.body;

    // Generate expense number
    const count = await Expense.countDocuments({ company: req.user.company });
    const expenseNumber = `EXP-${String(count + 1).padStart(3, '0')}`;

    const expense = new Expense({
      amount,
      category,
      description,
      date: new Date(date),
      currency,
      submittedBy: req.user._id,
      company: req.user.company,
      expenseNumber,
      status: 'submitted',
      receiptRequired: amount > 50
    });

    // Create approval flow
    const manager = await User.findOne({ 
      company: req.user.company, 
      role: 'manager',
      _id: { $ne: req.user._id }
    });

    if (manager) {
      expense.approvalFlow = [{
        approver: manager._id,
        role: 'manager',
        status: 'pending'
      }];
    }

    await expense.save();

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      expense: {
        id: expense._id,
        expenseNumber: expense.expenseNumber,
        amount: expense.amount,
        status: expense.status
      }
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating expense'
    });
  }
});

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     summary: Get expense by ID
 */
router.get('/:id', validateObjectId(), async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName email')
      .populate('approvalFlow.approver', 'firstName lastName email')
      .populate('company', 'name');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user has permission to view this expense
    if (expense.submittedBy._id.toString() !== req.user._id.toString() &&
        req.user.role === 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      expense
    });
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expense'
    });
  }
});

module.exports = router;