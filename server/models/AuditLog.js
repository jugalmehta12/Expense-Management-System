const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'create_expense',
      'update_expense',
      'delete_expense',
      'approve_expense',
      'reject_expense',
      'create_user',
      'update_user',
      'delete_user',
      'update_profile',
      'change_password',
      'update_company',
      'upload_receipt',
      'export_data',
      'view_report',
      'update_settings'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'expense',
      'user',
      'company',
      'report',
      'receipt',
      'settings',
      'auth'
    ]
  },
  resourceId: {
    type: String,
    required: false
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
auditLogSchema.index({ company: 1, createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });

// Static method to log an action
auditLogSchema.statics.logAction = async function(data) {
  try {
    const auditLog = new this(data);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Error logging audit action:', error);
    return null;
  }
};

// Static method to get recent activities for a user
auditLogSchema.statics.getRecentActivities = async function(userId, limit = 10) {
  try {
    return await this.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email')
      .exec();
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};

// Static method to get audit summary for a time period
auditLogSchema.statics.getSummary = async function(companyId, startDate, endDate) {
  try {
    const summary = await this.aggregate([
      {
        $match: {
          company: mongoose.Types.ObjectId(companyId),
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          totalActions: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' },
          actionBreakdown: {
            $push: {
              action: '$action',
              count: 1
            }
          },
          resourceBreakdown: {
            $push: {
              resource: '$resource',
              count: 1
            }
          }
        }
      },
      {
        $project: {
          totalActions: 1,
          uniqueUsersCount: { $size: '$uniqueUsers' },
          actionBreakdown: 1,
          resourceBreakdown: 1
        }
      }
    ]);

    return summary[0] || {
      totalActions: 0,
      uniqueUsersCount: 0,
      actionBreakdown: [],
      resourceBreakdown: []
    };
  } catch (error) {
    console.error('Error generating audit summary:', error);
    return null;
  }
};

module.exports = mongoose.model('AuditLog', auditLogSchema);