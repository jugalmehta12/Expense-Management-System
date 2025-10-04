const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { body, validationResult, param, query } = require('express-validator');
const Expense = require('../models/Expense');
const Company = require('../models/Company');
const User = require('../models/User');
const { requireRole, requireSameUserOrManager } = require('../middleware/auth');
const { processOCR } = require('../services/ocrService');
const { convertCurrency } = require('../services/currencyService');
const { detectAnomalies } = require('../services/anomalyService');
const { createApprovalFlow } = require('../services/approvalService');

const router = express.Router();

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
 *       500:
 *         description: Internal server error
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
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by expense status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
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
 *           default: 20
 *         description: Number of expenses per page
 *     responses:
 *       200:
 *         description: Expenses retrieved successfully
 *       500:
 *         description: Internal server error
 */

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
 * /api/expenses:
 *   post:
 *     summary: Create a new expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - date
 *               - category
 *               - description
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 125.50
 *               originalAmount:
 *                 type: number
 *                 example: 100.00
 *               currency:
 *                 type: string
 *                 example: USD
 *               originalCurrency:
 *                 type: string
 *                 example: EUR
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-15
 *               category:
 *                 type: string
 *                 example: Travel
 *               subcategory:
 *                 type: string
 *                 example: Flight
 *               description:
 *                 type: string
 *                 example: Flight to New York for client meeting
 *               vendor:
 *                 type: string
 *                 example: Delta Airlines
 *               businessPurpose:
 *                 type: string
 *                 example: Client meeting and project discussion
 *               projectCode:
 *                 type: string
 *                 example: PROJ-2024-001
 *               receipts:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Expense created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post('/', upload.array('receipts', 5), [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('date').isISO8601().withMessage('Date must be in YYYY-MM-DD format'),
  body('category').trim().isLength({ min: 1, max: 100 }).withMessage('Category is required'),
  body('description').trim().isLength({ min: 1, max: 500 }).withMessage('Description is required'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
], async (req, res) => {
  try {
    // Validation check
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    let {
      amount,
      originalAmount,
      currency,
      originalCurrency,
      date,
      category,
      subcategory,
      description,
      vendor,
      businessPurpose,
      projectCode,
      clientCode,
      paymentMethod,
      isPersonal = false,
      isBillable = false,
      location,
      attendees,
      mileage,
      tags
    } = req.body;

    // Set default currency from company if not provided
    currency = currency || req.user.company.defaultCurrency;
    originalCurrency = originalCurrency || currency;
    originalAmount = originalAmount || amount;

    // Handle currency conversion if needed
    let exchangeRate = 1;
    if (originalCurrency !== currency) {
      const conversionResult = await convertCurrency(originalAmount, originalCurrency, currency);
      amount = conversionResult.convertedAmount;
      exchangeRate = conversionResult.exchangeRate;
    }

    // Process uploaded receipts
    const receipts = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const receiptData = {
          filename: file.filename,
          originalName: file.originalname,
          url: `/uploads/receipts/${file.filename}`,
          size: file.size,
          mimeType: file.mimetype
        };

        // Process OCR for image files
        if (file.mimetype.startsWith('image/')) {
          try {
            const ocrResult = await processOCR(file.path);
            receiptData.ocrData = ocrResult;

            // Auto-fill expense data from OCR if not provided
            if (ocrResult.parsedData) {
              if (!vendor && ocrResult.parsedData.vendor) {
                vendor = ocrResult.parsedData.vendor;
              }
              if (!originalAmount && ocrResult.parsedData.amount) {
                originalAmount = ocrResult.parsedData.amount;
                amount = originalAmount;
              }
              if (!date && ocrResult.parsedData.date) {
                date = ocrResult.parsedData.date;
              }
            }
          } catch (ocrError) {
            console.error('OCR processing failed:', ocrError);
            // Continue without OCR data
          }
        }

        receipts.push(receiptData);
      }
    }

    // Parse JSON fields if they're strings
    if (typeof location === 'string') location = JSON.parse(location);
    if (typeof attendees === 'string') attendees = JSON.parse(attendees);
    if (typeof mileage === 'string') mileage = JSON.parse(mileage);
    if (typeof tags === 'string') tags = JSON.parse(tags);

    // Create expense
    const expense = new Expense({
      amount,
      originalAmount,
      currency,
      originalCurrency,
      exchangeRate,
      date: new Date(date),
      category,
      subcategory,
      description,
      vendor,
      businessPurpose,
      projectCode,
      clientCode,
      paymentMethod,
      isPersonal,
      isBillable,
      location,
      attendees,
      mileage,
      tags,
      receipts,
      submittedBy: req.user._id,
      company: req.user.company._id,
      status: 'draft'
    });

    await expense.save();

    // Detect anomalies
    try {
      const anomalies = await detectAnomalies(expense, req.user);
      if (anomalies.length > 0) {
        expense.anomalyFlags = anomalies;
        await expense.save();
      }
    } catch (anomalyError) {
      console.error('Anomaly detection failed:', anomalyError);
    }

    // Populate expense data for response
    await expense.populate('submittedBy', 'firstName lastName email');

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`company-${req.user.company._id}`).emit('expense-created', {
        expense,
        user: req.user
      });
    }

    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: expense
    });

  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/expenses/{id}/submit:
 *   patch:
 *     summary: Submit expense for approval
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense submitted successfully
 *       400:
 *         description: Invalid expense or already submitted
 *       404:
 *         description: Expense not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/submit', [
  param('id').isMongoId().withMessage('Invalid expense ID')
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

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check if user owns the expense
    if (expense.submittedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only submit your own expenses.'
      });
    }

    // Check if expense is in draft status
    if (expense.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Expense can only be submitted from draft status'
      });
    }

    // Validate expense has required data
    if (!expense.receipts || expense.receipts.length === 0) {
      const company = await Company.findById(expense.company);
      const category = company.settings.expenseCategories.find(cat => cat.name === expense.category);
      if (category && category.requiresReceipt) {
        return res.status(400).json({
          success: false,
          message: 'Receipt is required for this expense category'
        });
      }
    }

    // Create approval flow
    const approvalFlow = await createApprovalFlow(expense, req.user.company);
    expense.approvalFlow = approvalFlow;
    expense.status = 'submitted';
    expense.submittedAt = new Date();

    await expense.save();

    // Populate for response
    await expense.populate('submittedBy', 'firstName lastName email');
    await expense.populate('approvalFlow.approver', 'firstName lastName email role');

    // Send notifications to approvers
    const io = req.app.get('io');
    if (io) {
      // Notify first approver
      const firstApprover = expense.approvalFlow[0];
      if (firstApprover) {
        io.to(`user-${firstApprover.approver._id}`).emit('approval-request', {
          expense,
          approver: firstApprover.approver
        });
      }

      // Notify company about submission
      io.to(`company-${expense.company}`).emit('expense-submitted', {
        expense,
        submitter: req.user
      });
    }

    res.json({
      success: true,
      message: 'Expense submitted for approval',
      data: expense
    });

  } catch (error) {
    console.error('Submit expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit expense',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get expenses (filtered by user role and permissions)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, approved, rejected, reimbursed, cancelled]
 *         description: Filter by expense status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by expense category
 *       - in: query
 *         name: submittedBy
 *         schema:
 *           type: string
 *         description: Filter by user ID (managers/admins only)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter expenses from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter expenses until this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [date, amount, createdAt, -date, -amount, -createdAt]
 *           default: -createdAt
 *         description: Sort field and direction
 *     responses:
 *       200:
 *         description: Expenses retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('startDate').optional().isISO8601().withMessage('Start date must be in YYYY-MM-DD format'),
  query('endDate').optional().isISO8601().withMessage('End date must be in YYYY-MM-DD format')
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

    const {
      status,
      category,
      submittedBy,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    // Build query based on user role
    let query = { company: req.user.company._id };

    // Role-based filtering
    if (req.user.role === 'employee') {
      // Employees can only see their own expenses
      query.submittedBy = req.user._id;
    } else if (req.user.role === 'manager') {
      // Managers can see their own expenses and their subordinates' expenses
      if (submittedBy) {
        // Check if the requested user is a subordinate
        const targetUser = await User.findById(submittedBy);
        if (targetUser && targetUser.manager && targetUser.manager.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only view expenses of your subordinates.'
          });
        }
        query.submittedBy = submittedBy;
      } else {
        // Get all subordinates
        const subordinates = await User.find({ manager: req.user._id }).select('_id');
        const subordinateIds = subordinates.map(sub => sub._id);
        subordinateIds.push(req.user._id); // Include manager's own expenses
        query.submittedBy = { $in: subordinateIds };
      }
    } else if (['finance', 'director', 'admin'].includes(req.user.role)) {
      // Finance, directors, and admins can see all company expenses
      if (submittedBy) {
        query.submittedBy = submittedBy;
      }
    }

    // Apply additional filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (startDate) {
      query.date = { ...query.date, $gte: new Date(startDate) };
    }
    if (endDate) {
      query.date = { ...query.date, $lte: new Date(endDate) };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const expenses = await Expense.find(query)
      .populate('submittedBy', 'firstName lastName email employeeId')
      .populate('approvalFlow.approver', 'firstName lastName email role')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expenses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     summary: Get expense by ID
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Expense not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid expense ID')
], requireSameUserOrManager, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const expense = await Expense.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName email employeeId department')
      .populate('approvalFlow.approver', 'firstName lastName email role')
      .populate('company', 'name code');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    // Check access permissions
    const canAccess = (
      expense.submittedBy._id.toString() === req.user._id.toString() ||
      ['admin', 'director', 'finance'].includes(req.user.role) ||
      (req.user.role === 'manager' && expense.submittedBy.manager && expense.submittedBy.manager.toString() === req.user._id.toString()) ||
      expense.approvalFlow.some(approval => approval.approver._id.toString() === req.user._id.toString())
    );

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this expense.'
      });
    }

    res.json({
      success: true,
      data: expense
    });

  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expense',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @swagger
 * /api/expenses/pending-approvals:
 *   get:
 *     summary: Get expenses pending approval for current user
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Pending approvals retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/pending-approvals', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Only managers, finance, directors, and admins can have pending approvals
    if (!['manager', 'finance', 'director', 'admin'].includes(req.user.role)) {
      return res.json({
        success: true,
        data: {
          expenses: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const expenses = await Expense.find({
      'approvalFlow.approver': req.user._id,
      'approvalFlow.status': 'pending',
      status: 'submitted'
    })
    .populate('submittedBy', 'firstName lastName email employeeId department')
    .populate('approvalFlow.approver', 'firstName lastName email role')
    .sort('-submittedAt')
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Expense.countDocuments({
      'approvalFlow.approver': req.user._id,
      'approvalFlow.status': 'pending',
      status: 'submitted'
    });

    res.json({
      success: true,
      data: {
        expenses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending approvals',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;