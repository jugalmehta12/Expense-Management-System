const express = require('express');
const router = express.Router();
const Company = require('../models/Company');

/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the company
 *         name:
 *           type: string
 *           description: Company name
 *         email:
 *           type: string
 *           description: Company contact email
 *         phone:
 *           type: string
 *           description: Company phone number
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             zipCode:
 *               type: string
 *             country:
 *               type: string
 *         settings:
 *           type: object
 *           properties:
 *             currency:
 *               type: string
 *               default: USD
 *             timezone:
 *               type: string
 *               default: UTC
 *             approvalLimits:
 *               type: object
 *               properties:
 *                 manager:
 *                   type: number
 *                   default: 1000
 *                 finance:
 *                   type: number
 *                   default: 5000
 *                 director:
 *                   type: number
 *                   default: 10000
 */

/**
 * @swagger
 * /api/companies/profile:
 *   get:
 *     summary: Get company profile
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Company'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */
router.get('/profile', async (req, res) => {
  try {
    const company = await Company.findById(req.user.company);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching company profile',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/companies/profile:
 *   put:
 *     summary: Update company profile (Admin only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       200:
 *         description: Company profile updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/profile', async (req, res) => {
  try {
    // Only admins can update company profile
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update company profile'
      });
    }

    const { name, email, phone, address } = req.body;
    
    const company = await Company.findByIdAndUpdate(
      req.user.company,
      { name, email, phone, address },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      message: 'Company profile updated successfully',
      data: company
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating company profile',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/companies/settings:
 *   get:
 *     summary: Get company settings
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company settings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */
router.get('/settings', async (req, res) => {
  try {
    const company = await Company.findById(req.user.company).select('settings');
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: company.settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching company settings',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/companies/settings:
 *   put:
 *     summary: Update company settings (Admin only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currency:
 *                 type: string
 *               timezone:
 *                 type: string
 *               approvalLimits:
 *                 type: object
 *                 properties:
 *                   manager:
 *                     type: number
 *                   finance:
 *                     type: number
 *                   director:
 *                     type: number
 *               expenseCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *               policies:
 *                 type: object
 *                 properties:
 *                   maxDailyAmount:
 *                     type: number
 *                   maxMonthlyAmount:
 *                     type: number
 *                   requireReceipts:
 *                     type: boolean
 *                   allowPersonalExpenses:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Company settings updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/settings', async (req, res) => {
  try {
    // Only admins can update company settings
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update company settings'
      });
    }

    const {
      currency,
      timezone,
      approvalLimits,
      expenseCategories,
      policies
    } = req.body;

    const settings = {
      ...(currency && { currency }),
      ...(timezone && { timezone }),
      ...(approvalLimits && { approvalLimits }),
      ...(expenseCategories && { expenseCategories }),
      ...(policies && { policies })
    };

    const company = await Company.findByIdAndUpdate(
      req.user.company,
      { $set: { settings } },
      { new: true, runValidators: true }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      message: 'Company settings updated successfully',
      data: company.settings
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating company settings',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/companies/stats:
 *   get:
 *     summary: Get company statistics (Admin/Manager only)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Company statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                     activeUsers:
 *                       type: number
 *                     totalExpenses:
 *                       type: number
 *                     pendingExpenses:
 *                       type: number
 *                     approvedExpenses:
 *                       type: number
 *                     totalAmount:
 *                       type: number
 *                     monthlyAmount:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient privileges
 */
router.get('/stats', async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'manager', 'finance', 'director'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges to view company statistics'
      });
    }

    const User = require('../models/User');
    const Expense = require('../models/Expense');

    // Get user statistics
    const totalUsers = await User.countDocuments({ company: req.user.company });
    const activeUsers = await User.countDocuments({ 
      company: req.user.company, 
      isActive: true 
    });

    // Get expense statistics
    const totalExpenses = await Expense.countDocuments({ company: req.user.company });
    const pendingExpenses = await Expense.countDocuments({ 
      company: req.user.company, 
      status: 'pending' 
    });
    const approvedExpenses = await Expense.countDocuments({ 
      company: req.user.company, 
      status: 'approved' 
    });

    // Get amount statistics
    const totalAmountResult = await Expense.aggregate([
      { $match: { company: req.user.company, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalAmount = totalAmountResult[0]?.total || 0;

    // Get current month amount
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyAmountResult = await Expense.aggregate([
      { 
        $match: { 
          company: req.user.company, 
          status: 'approved',
          createdAt: { $gte: currentMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyAmount = monthlyAmountResult[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalExpenses,
        pendingExpenses,
        approvedExpenses,
        totalAmount,
        monthlyAmount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching company statistics',
      error: error.message
    });
  }
});

module.exports = router;