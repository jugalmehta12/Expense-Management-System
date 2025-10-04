const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const User = require('../models/User');

/**
 * @swagger
 * components:
 *   schemas:
 *     ExpenseReport:
 *       type: object
 *       properties:
 *         summary:
 *           type: object
 *           properties:
 *             totalExpenses:
 *               type: number
 *             totalAmount:
 *               type: number
 *             averageExpense:
 *               type: number
 *             pendingAmount:
 *               type: number
 *             approvedAmount:
 *               type: number
 *         breakdown:
 *           type: object
 *           properties:
 *             byCategory:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                   count:
 *                     type: number
 *                   amount:
 *                     type: number
 *             byStatus:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                   count:
 *                     type: number
 *                   amount:
 *                     type: number
 *             byDepartment:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   department:
 *                     type: string
 *                   count:
 *                     type: number
 *                   amount:
 *                     type: number
 */

/**
 * @swagger
 * /api/reports/expense-summary:
 *   get:
 *     summary: Get comprehensive expense summary report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report period
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by expense category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by expense status
 *     responses:
 *       200:
 *         description: Expense summary report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ExpenseReport'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient privileges
 */
router.get('/expense-summary', async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'manager', 'finance', 'director'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges to view expense reports'
      });
    }

    const {
      startDate,
      endDate,
      department,
      category,
      status
    } = req.query;

    // Build base query
    const baseQuery = { company: req.user.company };
    
    // Date range filter
    if (startDate || endDate) {
      baseQuery.date = {};
      if (startDate) baseQuery.date.$gte = new Date(startDate);
      if (endDate) baseQuery.date.$lte = new Date(endDate);
    }

    // Additional filters
    if (category) baseQuery.category = category;
    if (status) baseQuery.status = status;

    // Department filter requires user lookup
    let userIds = null;
    if (department) {
      const departmentUsers = await User.find({
        company: req.user.company,
        department: department
      }).select('_id');
      userIds = departmentUsers.map(u => u._id);
      baseQuery.user = { $in: userIds };
    }

    // Get summary statistics
    const [
      totalStats,
      categoryBreakdown,
      statusBreakdown,
      departmentBreakdown
    ] = await Promise.all([
      // Total statistics
      Expense.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            averageExpense: { $avg: '$amount' },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
              }
            },
            approvedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0]
              }
            },
            rejectedAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'rejected'] }, '$amount', 0]
              }
            }
          }
        }
      ]),

      // Category breakdown
      Expense.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
            averageAmount: { $avg: '$amount' }
          }
        },
        { $sort: { amount: -1 } },
        {
          $project: {
            category: '$_id',
            count: 1,
            amount: 1,
            averageAmount: { $round: ['$averageAmount', 2] },
            _id: 0
          }
        }
      ]),

      // Status breakdown
      Expense.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { amount: -1 } },
        {
          $project: {
            status: '$_id',
            count: 1,
            amount: 1,
            _id: 0
          }
        }
      ]),

      // Department breakdown
      Expense.aggregate([
        { $match: baseQuery },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        {
          $group: {
            _id: '$userInfo.department',
            count: { $sum: 1 },
            amount: { $sum: '$amount' },
            uniqueUsers: { $addToSet: '$user' }
          }
        },
        {
          $project: {
            department: '$_id',
            count: 1,
            amount: 1,
            userCount: { $size: '$uniqueUsers' },
            _id: 0
          }
        },
        { $sort: { amount: -1 } }
      ])
    ]);

    const summary = totalStats[0] || {
      totalExpenses: 0,
      totalAmount: 0,
      averageExpense: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      rejectedAmount: 0
    };

    res.json({
      success: true,
      data: {
        summary: {
          ...summary,
          averageExpense: Math.round(summary.averageExpense * 100) / 100
        },
        breakdown: {
          byCategory: categoryBreakdown,
          byStatus: statusBreakdown,
          byDepartment: departmentBreakdown
        },
        filters: {
          startDate,
          endDate,
          department,
          category,
          status
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating expense summary report',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/reports/monthly-trends:
 *   get:
 *     summary: Get monthly expense trends report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of months to include in trends
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by expense category
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *     responses:
 *       200:
 *         description: Monthly trends report generated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient privileges
 */
router.get('/monthly-trends', async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'manager', 'finance', 'director'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges to view trend reports'
      });
    }

    const { months = 12, category, department } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    // Build query
    const baseQuery = {
      company: req.user.company,
      date: { $gte: startDate, $lte: endDate }
    };

    if (category) baseQuery.category = category;

    // Department filter
    if (department) {
      const departmentUsers = await User.find({
        company: req.user.company,
        department: department
      }).select('_id');
      baseQuery.user = { $in: departmentUsers.map(u => u._id) };
    }

    const monthlyTrends = await Expense.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          totalExpenses: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageExpense: { $avg: '$amount' },
          approvedExpenses: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
            }
          },
          approvedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0]
            }
          }
        }
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1
        }
      },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              {
                $cond: [
                  { $lt: ['$_id.month', 10] },
                  { $concat: ['0', { $toString: '$_id.month' }] },
                  { $toString: '$_id.month' }
                ]
              }
            ]
          },
          totalExpenses: 1,
          totalAmount: 1,
          averageExpense: { $round: ['$averageExpense', 2] },
          approvedExpenses: 1,
          approvedAmount: 1,
          approvalRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$approvedExpenses', '$totalExpenses'] },
                  100
                ]
              },
              2
            ]
          },
          _id: 0
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        trends: monthlyTrends,
        period: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          months: parseInt(months)
        },
        filters: { category, department }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating monthly trends report',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/reports/user-spending:
 *   get:
 *     summary: Get user spending report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report period
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of users to include
 *     responses:
 *       200:
 *         description: User spending report generated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient privileges
 */
router.get('/user-spending', async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'manager', 'finance', 'director'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges to view user spending reports'
      });
    }

    const {
      startDate,
      endDate,
      department,
      limit = 50
    } = req.query;

    // Build date query
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.date = {};
      if (startDate) dateQuery.date.$gte = new Date(startDate);
      if (endDate) dateQuery.date.$lte = new Date(endDate);
    }

    // Build aggregation pipeline
    const pipeline = [
      {
        $match: {
          company: req.user.company,
          ...dateQuery
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
      { $unwind: '$userInfo' }
    ];

    // Add department filter if specified
    if (department) {
      pipeline.push({
        $match: {
          'userInfo.department': department
        }
      });
    }

    // Group by user and calculate statistics
    pipeline.push(
      {
        $group: {
          _id: '$user',
          user: { $first: '$userInfo' },
          totalExpenses: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          averageExpense: { $avg: '$amount' },
          approvedExpenses: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
            }
          },
          approvedAmount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, '$amount', 0]
            }
          },
          pendingExpenses: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
            }
          },
          rejectedExpenses: {
            $sum: {
              $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0]
            }
          },
          categories: { $addToSet: '$category' }
        }
      },
      {
        $project: {
          user: {
            id: '$user._id',
            name: '$user.name',
            email: '$user.email',
            department: '$user.department',
            role: '$user.role'
          },
          totalExpenses: 1,
          totalAmount: 1,
          averageExpense: { $round: ['$averageExpense', 2] },
          approvedExpenses: 1,
          approvedAmount: 1,
          pendingExpenses: 1,
          rejectedExpenses: 1,
          categoriesCount: { $size: '$categories' },
          approvalRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$approvedExpenses', '$totalExpenses'] },
                  100
                ]
              },
              2
            ]
          },
          _id: 0
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: parseInt(limit) }
    );

    const userSpending = await Expense.aggregate(pipeline);

    res.json({
      success: true,
      data: {
        users: userSpending,
        filters: {
          startDate,
          endDate,
          department,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating user spending report',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/reports/export:
 *   post:
 *     summary: Export expense report data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportType
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [summary, trends, user-spending, detailed]
 *               format:
 *                 type: string
 *                 enum: [csv, xlsx, pdf]
 *                 default: csv
 *               filters:
 *                 type: object
 *                 properties:
 *                   startDate:
 *                     type: string
 *                     format: date
 *                   endDate:
 *                     type: string
 *                     format: date
 *                   department:
 *                     type: string
 *                   category:
 *                     type: string
 *                   status:
 *                     type: string
 *     responses:
 *       200:
 *         description: Report exported successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient privileges
 *       400:
 *         description: Invalid report type or format
 */
router.post('/export', async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'manager', 'finance', 'director'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges to export reports'
      });
    }

    const { reportType, format = 'csv', filters = {} } = req.body;

    if (!['summary', 'trends', 'user-spending', 'detailed'].includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report type'
      });
    }

    // Build base query from filters
    const baseQuery = { company: req.user.company };
    
    if (filters.startDate || filters.endDate) {
      baseQuery.date = {};
      if (filters.startDate) baseQuery.date.$gte = new Date(filters.startDate);
      if (filters.endDate) baseQuery.date.$lte = new Date(filters.endDate);
    }

    if (filters.category) baseQuery.category = filters.category;
    if (filters.status) baseQuery.status = filters.status;

    // Department filter
    if (filters.department) {
      const departmentUsers = await User.find({
        company: req.user.company,
        department: filters.department
      }).select('_id');
      baseQuery.user = { $in: departmentUsers.map(u => u._id) };
    }

    let exportData;
    let filename;

    switch (reportType) {
      case 'detailed':
        const expenses = await Expense.find(baseQuery)
          .populate('user', 'name email department')
          .sort({ date: -1 })
          .limit(10000);

        if (format === 'csv') {
          const csvHeader = 'Date,User,Department,Category,Description,Amount,Status,Currency\n';
          const csvRows = expenses.map(expense => {
            return `"${expense.date.toISOString().split('T')[0]}","${expense.user?.name || 'Unknown'}","${expense.user?.department || 'N/A'}","${expense.category}","${expense.description}","${expense.amount}","${expense.status}","${expense.currency}"`;
          }).join('\n');
          exportData = csvHeader + csvRows;
          filename = `detailed-expenses-${Date.now()}.csv`;
        }
        break;

      case 'summary':
        // Generate summary data and export
        // Implementation similar to expense-summary endpoint
        exportData = 'Summary report export not fully implemented yet';
        filename = `expense-summary-${Date.now()}.csv`;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Report export not implemented for this type'
        });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(exportData);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting report',
      error: error.message
    });
  }
});

module.exports = router;