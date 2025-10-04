const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const User = require('../models/User');
const Company = require('../models/Company');
const mongoose = require('mongoose');

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalExpenses:
 *                   type: number
 *                 pendingApprovals:
 *                   type: number
 *                 thisMonth:
 *                   type: number
 *                 approved:
 *                   type: number
 *                 rejected:
 *                   type: number
 *                 avgProcessingTime:
 *                   type: string
 *                 complianceScore:
 *                   type: number
 *                 savings:
 *                   type: number
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const companyId = req.user.company;
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfQuarter = new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1);

    // Get total expenses for the quarter
    const totalExpensesResult = await Expense.aggregate([
      {
        $match: {
          submittedBy: new mongoose.Types.ObjectId(userId),
          date: { $gte: startOfQuarter },
          status: { $in: ['approved', 'pending', 'processing'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Get pending approvals count
    const pendingCount = await Expense.countDocuments({
      submittedBy: userId,
      status: 'pending'
    });

    // Get this month's expenses
    const thisMonthResult = await Expense.aggregate([
      {
        $match: {
          submittedBy: new mongoose.Types.ObjectId(userId),
          date: { $gte: startOfMonth },
          status: { $in: ['approved', 'pending', 'processing'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Get approved and rejected counts
    const [approvedCount, rejectedCount] = await Promise.all([
      Expense.countDocuments({
        submittedBy: userId,
        status: 'approved',
        date: { $gte: startOfQuarter }
      }),
      Expense.countDocuments({
        submittedBy: userId,
        status: 'rejected',
        date: { $gte: startOfQuarter }
      })
    ]);

    // Calculate average processing time (mock for now)
    const avgProcessingTime = '2.5 days';

    // Calculate compliance score (mock for now)
    const complianceScore = 94;

    // Calculate savings (mock for now)
    const savings = 1200.25;

    const stats = {
      totalExpenses: totalExpensesResult[0]?.total || 0,
      pendingApprovals: pendingCount,
      thisMonth: thisMonthResult[0]?.total || 0,
      approved: approvedCount,
      rejected: rejectedCount,
      avgProcessingTime,
      complianceScore,
      savings
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

/**
 * @swagger
 * /api/dashboard/analytics:
 *   get:
 *     summary: Get dashboard analytics data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics data
 */
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    
    // Get monthly trends for last 5 months
    const monthlyTrends = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      
      const monthData = await Expense.aggregate([
        {
          $match: {
            submittedBy: new mongoose.Types.ObjectId(userId),
            date: { $gte: date, $lt: nextDate }
          }
        },
        {
          $group: {
            _id: null,
            amount: { $sum: '$amount' },
            approved: {
              $sum: {
                $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
              }
            },
            pending: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, 1, 0]
              }
            }
          }
        }
      ]);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      monthlyTrends.push({
        month: monthNames[date.getMonth()],
        amount: monthData[0]?.amount || 0,
        approved: monthData[0]?.approved || 0,
        pending: monthData[0]?.pending || 0
      });
    }

    // Get category breakdown
    const categoryBreakdown = await Expense.aggregate([
      {
        $match: {
          submittedBy: new mongoose.Types.ObjectId(userId),
          date: { $gte: new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1) },
          status: { $in: ['approved', 'pending', 'processing'] }
        }
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { amount: -1 }
      }
    ]);

    // Calculate total for percentages
    const total = categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);
    
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff69b4', '#8b5cf6'];
    
    const formattedCategoryBreakdown = categoryBreakdown.map((cat, index) => ({
      name: cat._id,
      value: total > 0 ? Math.round((cat.amount / total) * 100) : 0,
      amount: cat.amount,
      color: colors[index % colors.length]
    }));

    // AI Insights (mock data for now)
    const aiInsights = [
      {
        type: 'anomaly',
        title: 'Unusual Spending Pattern Detected',
        description: 'Travel expenses increased 35% compared to last month',
        action: 'Review travel policy compliance',
        severity: 'medium'
      },
      {
        type: 'optimization',
        title: 'Cost Saving Opportunity',
        description: 'Switch to preferred hotel chain could save $200/month',
        action: 'Update travel guidelines',
        severity: 'low'
      },
      {
        type: 'compliance',
        title: 'Missing Receipts',
        description: '3 expenses over $50 without receipts',
        action: 'Follow up with employees',
        severity: 'high'
      }
    ];

    // Approval workflow (mock data for now)
    const approvalWorkflow = [
      { step: 'Manager Review', completed: 65, pending: 8, avgTime: '1.2 days' },
      { step: 'Finance Review', completed: 58, pending: 7, avgTime: '0.8 days' },
      { step: 'Director Approval', completed: 55, pending: 3, avgTime: '0.5 days' },
    ];

    res.json({
      monthlyTrends,
      categoryBreakdown: formattedCategoryBreakdown,
      aiInsights,
      approvalWorkflow
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ message: 'Error fetching dashboard analytics' });
  }
});

module.exports = router;