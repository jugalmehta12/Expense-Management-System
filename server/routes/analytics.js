const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const User = require('../models/User');

/**
 * @swagger
 * /api/analytics/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
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
 *                     totalExpenses:
 *                       type: number
 *                     totalAmount:
 *                       type: number
 *                     pendingExpenses:
 *                       type: number
 *                     approvedExpenses:
 *                       type: number
 *                     rejectedExpenses:
 *                       type: number
 *                     monthlyTotal:
 *                       type: number
 *                     averageExpense:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user.id;
    const isManager = ['manager', 'finance', 'director', 'admin'].includes(req.user.role);
    
    // Base query - managers see all company expenses, employees see only their own
    const baseQuery = isManager 
      ? { company: req.user.company }
      : { user: userId };

    // Get basic counts and totals
    const [
      totalExpenses,
      pendingExpenses,
      approvedExpenses,
      rejectedExpenses,
      totalAmountResult,
      monthlyAmountResult
    ] = await Promise.all([
      Expense.countDocuments(baseQuery),
      Expense.countDocuments({ ...baseQuery, status: 'pending' }),
      Expense.countDocuments({ ...baseQuery, status: 'approved' }),
      Expense.countDocuments({ ...baseQuery, status: 'rejected' }),
      
      // Total approved amount
      Expense.aggregate([
        { $match: { ...baseQuery, status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      
      // Current month approved amount
      Expense.aggregate([
        {
          $match: {
            ...baseQuery,
            status: 'approved',
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalAmount = totalAmountResult[0]?.total || 0;
    const monthlyTotal = monthlyAmountResult[0]?.total || 0;
    const averageExpense = totalExpenses > 0 ? totalAmount / totalExpenses : 0;

    res.json({
      success: true,
      data: {
        totalExpenses,
        totalAmount: Math.round(totalAmount * 100) / 100,
        pendingExpenses,
        approvedExpenses,
        rejectedExpenses,
        monthlyTotal: Math.round(monthlyTotal * 100) / 100,
        averageExpense: Math.round(averageExpense * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard analytics',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/trends:
 *   get:
 *     summary: Get spending trends
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *           default: month
 *         description: Time period for trends
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of months to include
 *     responses:
 *       200:
 *         description: Spending trends retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/trends', async (req, res) => {
  try {
    const { period = 'month', months = 6 } = req.query;
    const userId = req.user.id;
    const isManager = ['manager', 'finance', 'director', 'admin'].includes(req.user.role);
    
    const baseQuery = isManager 
      ? { company: req.user.company, status: 'approved' }
      : { user: userId, status: 'approved' };

    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    // Aggregate by time period
    let groupStage;
    if (period === 'week') {
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      };
    } else if (period === 'month') {
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      };
    } else if (period === 'quarter') {
      groupStage = {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            quarter: {
              $ceil: { $divide: [{ $month: '$createdAt' }, 3] }
            }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      };
    } else {
      groupStage = {
        $group: {
          _id: { year: { $year: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      };
    }

    const trends = await Expense.aggregate([
      {
        $match: {
          ...baseQuery,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      groupStage,
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1, '_id.quarter': 1 } }
    ]);

    res.json({
      success: true,
      data: trends.map(trend => ({
        period: trend._id,
        total: Math.round(trend.total * 100) / 100,
        count: trend.count,
        average: Math.round(trend.avgAmount * 100) / 100
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching spending trends',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/categories:
 *   get:
 *     summary: Get expense breakdown by category
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analysis
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analysis
 *     responses:
 *       200:
 *         description: Category breakdown retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/categories', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    const isManager = ['manager', 'finance', 'director', 'admin'].includes(req.user.role);
    
    const baseQuery = isManager 
      ? { company: req.user.company, status: 'approved' }
      : { user: userId, status: 'approved' };

    // Add date range if provided
    if (startDate || endDate) {
      baseQuery.createdAt = {};
      if (startDate) baseQuery.createdAt.$gte = new Date(startDate);
      if (endDate) baseQuery.createdAt.$lte = new Date(endDate);
    }

    const categoryBreakdown = await Expense.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Calculate total for percentages
    const grandTotal = categoryBreakdown.reduce((sum, cat) => sum + cat.total, 0);

    res.json({
      success: true,
      data: categoryBreakdown.map(category => ({
        category: category._id,
        total: Math.round(category.total * 100) / 100,
        count: category.count,
        average: Math.round(category.avgAmount * 100) / 100,
        percentage: grandTotal > 0 ? Math.round((category.total / grandTotal) * 10000) / 100 : 0
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category breakdown',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/top-spenders:
 *   get:
 *     summary: Get top spenders (Manager+ only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of top spenders to return
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [month, quarter, year]
 *           default: month
 *         description: Time period for analysis
 *     responses:
 *       200:
 *         description: Top spenders retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager+ access required
 */
router.get('/top-spenders', async (req, res) => {
  try {
    // Check permissions
    if (!['manager', 'finance', 'director', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges to view top spenders'
      });
    }

    const { limit = 10, period = 'month' } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'quarter') {
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const topSpenders = await Expense.aggregate([
      {
        $match: {
          company: req.user.company,
          status: 'approved',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$user',
          totalAmount: { $sum: '$amount' },
          expenseCount: { $sum: 1 },
          avgExpense: { $avg: '$amount' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$userInfo.name',
          email: '$userInfo.email',
          department: '$userInfo.department',
          totalAmount: { $round: ['$totalAmount', 2] },
          expenseCount: 1,
          avgExpense: { $round: ['$avgExpense', 2] }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({
      success: true,
      data: topSpenders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching top spenders',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/analytics/department-summary:
 *   get:
 *     summary: Get department spending summary (Manager+ only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Department summary retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Manager+ access required
 */
router.get('/department-summary', async (req, res) => {
  try {
    // Check permissions
    if (!['manager', 'finance', 'director', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges to view department summary'
      });
    }

    const departmentSummary = await Expense.aggregate([
      {
        $match: {
          company: req.user.company,
          status: 'approved'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $group: {
          _id: '$userInfo.department',
          totalAmount: { $sum: '$amount' },
          expenseCount: { $sum: 1 },
          avgExpense: { $avg: '$amount' },
          userCount: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          department: '$_id',
          totalAmount: { $round: ['$totalAmount', 2] },
          expenseCount: 1,
          avgExpense: { $round: ['$avgExpense', 2] },
          userCount: { $size: '$userCount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.json({
      success: true,
      data: departmentSummary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching department summary',
      error: error.message
    });
  }
});

module.exports = router;