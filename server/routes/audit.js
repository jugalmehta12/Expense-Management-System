const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the audit log
 *         user:
 *           type: string
 *           description: ID of the user who performed the action
 *         company:
 *           type: string
 *           description: ID of the company
 *         action:
 *           type: string
 *           description: Action performed
 *         resource:
 *           type: string
 *           description: Resource affected
 *         resourceId:
 *           type: string
 *           description: ID of the affected resource
 *         details:
 *           type: object
 *           description: Additional details about the action
 *         ipAddress:
 *           type: string
 *           description: IP address of the user
 *         userAgent:
 *           type: string
 *           description: User agent string
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the action
 */

/**
 * @swagger
 * /api/audit/logs:
 *   get:
 *     summary: Get audit logs (Admin/Manager only)
 *     tags: [Audit]
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
 *           default: 50
 *         description: Number of logs per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: Filter by resource type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLog'
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient privileges
 */
router.get('/logs', async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'manager', 'finance', 'director'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges to view audit logs'
      });
    }

    const {
      page = 1,
      limit = 50,
      action,
      resource,
      userId,
      startDate,
      endDate
    } = req.query;

    // Build query
    const query = { company: req.user.company };
    
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (userId) query.user = userId;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const auditLogs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: auditLogs,
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
      message: 'Error fetching audit logs',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/audit/logs/{id}:
 *   get:
 *     summary: Get specific audit log details (Admin only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Audit log ID
 *     responses:
 *       200:
 *         description: Audit log details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       404:
 *         description: Audit log not found
 */
router.get('/logs/:id', async (req, res) => {
  try {
    // Only admins can view individual audit log details
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view detailed audit logs'
      });
    }

    const auditLog = await AuditLog.findOne({
      _id: req.params.id,
      company: req.user.company
    }).populate('user', 'name email role department');

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: 'Audit log not found'
      });
    }

    res.json({
      success: true,
      data: auditLog
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching audit log details',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/audit/summary:
 *   get:
 *     summary: Get audit summary statistics (Admin/Manager only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: month
 *         description: Time period for summary
 *     responses:
 *       200:
 *         description: Audit summary retrieved successfully
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
 *                     totalActions:
 *                       type: number
 *                     uniqueUsers:
 *                       type: number
 *                     actionBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           action:
 *                             type: string
 *                           count:
 *                             type: number
 *                     resourceBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           resource:
 *                             type: string
 *                           count:
 *                             type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient privileges
 */
router.get('/summary', async (req, res) => {
  try {
    // Check permissions
    if (!['admin', 'manager', 'finance', 'director'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges to view audit summary'
      });
    }

    const { period = 'month' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const baseQuery = {
      company: req.user.company,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    // Get summary statistics
    const [
      totalActions,
      uniqueUsers,
      actionBreakdown,
      resourceBreakdown
    ] = await Promise.all([
      // Total actions count
      AuditLog.countDocuments(baseQuery),
      
      // Unique users count
      AuditLog.distinct('user', baseQuery).then(users => users.length),
      
      // Action breakdown
      AuditLog.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { action: '$_id', count: 1, _id: 0 } }
      ]),
      
      // Resource breakdown
      AuditLog.aggregate([
        { $match: baseQuery },
        { $group: { _id: '$resource', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { resource: '$_id', count: 1, _id: 0 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalActions,
        uniqueUsers,
        actionBreakdown,
        resourceBreakdown,
        period: {
          type: period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching audit summary',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/audit/user-activity:
 *   get:
 *     summary: Get user activity audit (Admin only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to get activity for
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
 *         description: Number of activities per page
 *     responses:
 *       200:
 *         description: User activity retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       400:
 *         description: User ID is required
 */
router.get('/user-activity', async (req, res) => {
  try {
    // Only admins can view user activity
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can view user activity'
      });
    }

    const { userId, page = 1, limit = 20 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const query = {
      company: req.user.company,
      user: userId
    };

    const userActivity = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AuditLog.countDocuments(query);

    // Get user info
    const User = require('../models/User');
    const userInfo = await User.findById(userId).select('name email role department');

    res.json({
      success: true,
      data: {
        user: userInfo,
        activities: userActivity,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/audit/export:
 *   post:
 *     summary: Export audit logs (Admin only)
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               format:
 *                 type: string
 *                 enum: [csv, json]
 *                 default: csv
 *               filters:
 *                 type: object
 *                 properties:
 *                   action:
 *                     type: string
 *                   resource:
 *                     type: string
 *                   userId:
 *                     type: string
 *     responses:
 *       200:
 *         description: Audit logs exported successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/export', async (req, res) => {
  try {
    // Only admins can export audit logs
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can export audit logs'
      });
    }

    const { startDate, endDate, format = 'csv', filters = {} } = req.body;

    // Build query
    const query = { company: req.user.company };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (filters.action) query.action = filters.action;
    if (filters.resource) query.resource = filters.resource;
    if (filters.userId) query.user = filters.userId;

    const auditLogs = await AuditLog.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10000); // Limit to prevent memory issues

    // Generate export file
    let exportData;
    let contentType;
    let filename;

    if (format === 'json') {
      exportData = JSON.stringify(auditLogs, null, 2);
      contentType = 'application/json';
      filename = `audit-logs-${Date.now()}.json`;
    } else {
      // CSV format
      const csvHeader = 'Date,User,Action,Resource,Resource ID,IP Address,Details\n';
      const csvRows = auditLogs.map(log => {
        const details = JSON.stringify(log.details || {}).replace(/"/g, '""');
        return `"${log.createdAt.toISOString()}","${log.user?.name || 'Unknown'}","${log.action}","${log.resource}","${log.resourceId || ''}","${log.ipAddress || ''}","${details}"`;
      }).join('\n');
      
      exportData = csvHeader + csvRows;
      contentType = 'text/csv';
      filename = `audit-logs-${Date.now()}.csv`;
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentType);
    res.send(exportData);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting audit logs',
      error: error.message
    });
  }
});

module.exports = router;