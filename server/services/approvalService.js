const User = require('../models/User');
const Company = require('../models/Company');
const Expense = require('../models/Expense');

/**
 * Approval Service for managing expense approval workflows
 * Handles multi-level approval chains with conditional logic
 */

class ApprovalService {
  /**
   * Create approval flow for an expense based on company rules
   * @param {Object} expense - Expense document
   * @param {Object} company - Company document
   * @returns {Array} Array of approval steps
   */
  async createApprovalFlow(expense, company) {
    try {
      const submitter = await User.findById(expense.submittedBy);
      const companySettings = company.settings;
      
      // Get approval rules based on amount thresholds
      const applicableRules = this.getApplicableRules(expense.amount, companySettings.approvalRules);
      
      // Build approval flow
      const approvalFlow = [];
      
      // Step 1: Manager approval (if submitter has a manager)
      if (submitter.manager && applicableRules.requiresManager !== false) {
        const manager = await User.findById(submitter.manager);
        if (manager && manager.isActive) {
          approvalFlow.push({
            approver: manager._id,
            role: 'manager',
            status: 'pending'
          });
        }
      }
      
      // Step 2: Apply amount-based rules
      if (applicableRules.amountThreshold) {
        const additionalApprovers = await this.getAdditionalApprovers(
          applicableRules.amountThreshold,
          company._id,
          submitter._id
        );
        
        approvalFlow.push(...additionalApprovers);
      }
      
      // Step 3: Category-specific rules
      const categoryRules = this.getCategoryRules(expense.category, companySettings);
      if (categoryRules) {
        const categoryApprovers = await this.getCategoryApprovers(categoryRules, company._id);
        approvalFlow.push(...categoryApprovers);
      }
      
      // Step 4: Special conditions (project codes, high amounts, etc.)
      const specialApprovers = await this.getSpecialApprovers(expense, company);
      approvalFlow.push(...specialApprovers);
      
      // Remove duplicates and ensure proper order
      const uniqueFlow = this.removeDuplicateApprovers(approvalFlow);
      
      // Apply conditional logic (percentage, specific approver rules)
      const finalFlow = this.applyConditionalLogic(uniqueFlow, applicableRules);
      
      return finalFlow;
      
    } catch (error) {
      console.error('Error creating approval flow:', error);
      throw new Error('Failed to create approval flow');
    }
  }

  /**
   * Get applicable approval rules based on expense amount
   * @param {number} amount - Expense amount
   * @param {Object} approvalRules - Company approval rules
   * @returns {Object} Applicable rules
   */
  getApplicableRules(amount, approvalRules) {
    const thresholds = approvalRules.amountThresholds || [];
    
    // Sort thresholds by amount (ascending)
    const sortedThresholds = thresholds.sort((a, b) => a.amount - b.amount);
    
    // Find the highest threshold that the amount exceeds
    let applicableThreshold = null;
    for (const threshold of sortedThresholds) {
      if (amount >= threshold.amount) {
        applicableThreshold = threshold;
      } else {
        break;
      }
    }
    
    return {
      amountThreshold: applicableThreshold,
      defaultFlow: approvalRules.defaultFlow || ['manager', 'finance'],
      requiresManager: amount >= 50 // Require manager approval for expenses >= $50
    };
  }

  /**
   * Get additional approvers based on amount thresholds
   * @param {Object} threshold - Amount threshold rule
   * @param {string} companyId - Company ID
   * @param {string} submitterId - Submitter's user ID
   * @returns {Array} Additional approvers
   */
  async getAdditionalApprovers(threshold, companyId, submitterId) {
    const approvers = [];
    
    for (const role of threshold.approvers) {
      const users = await User.find({
        company: companyId,
        role: role,
        isActive: true,
        _id: { $ne: submitterId } // Exclude submitter
      });
      
      // Add all users with the required role
      for (const user of users) {
        approvers.push({
          approver: user._id,
          role: role,
          status: 'pending',
          ruleType: threshold.rule || 'all',
          percentage: threshold.percentage
        });
      }
    }
    
    return approvers;
  }

  /**
   * Get category-specific approval requirements
   * @param {string} category - Expense category
   * @param {Object} companySettings - Company settings
   * @returns {Object|null} Category rules
   */
  getCategoryRules(category, companySettings) {
    const categoryConfig = companySettings.expenseCategories.find(
      cat => cat.name === category
    );
    
    if (categoryConfig && categoryConfig.specialApprovalRules) {
      return categoryConfig.specialApprovalRules;
    }
    
    // Default category rules
    const specialCategories = {
      'Travel': { requiresFinance: true, maxAmount: 5000 },
      'Client Entertainment': { requiresManager: true, requiresFinance: true },
      'Software': { requiresFinance: true },
      'Training': { requiresManager: true }
    };
    
    return specialCategories[category] || null;
  }

  /**
   * Get approvers for category-specific rules
   * @param {Object} categoryRules - Category approval rules
   * @param {string} companyId - Company ID
   * @returns {Array} Category approvers
   */
  async getCategoryApprovers(categoryRules, companyId) {
    const approvers = [];
    
    if (categoryRules.requiresFinance) {
      const financeUsers = await User.find({
        company: companyId,
        role: 'finance',
        isActive: true
      });
      
      for (const user of financeUsers) {
        approvers.push({
          approver: user._id,
          role: 'finance',
          status: 'pending',
          reason: 'category_requirement'
        });
      }
    }
    
    if (categoryRules.requiresDirector) {
      const directors = await User.find({
        company: companyId,
        role: 'director',
        isActive: true
      });
      
      for (const user of directors) {
        approvers.push({
          approver: user._id,
          role: 'director',
          status: 'pending',
          reason: 'category_requirement'
        });
      }
    }
    
    return approvers;
  }

  /**
   * Get special approvers based on expense characteristics
   * @param {Object} expense - Expense document
   * @param {Object} company - Company document
   * @returns {Array} Special approvers
   */
  async getSpecialApprovers(expense, company) {
    const approvers = [];
    
    // High-value expenses require director approval
    if (expense.amount >= 10000) {
      const directors = await User.find({
        company: company._id,
        role: 'director',
        isActive: true
      });
      
      for (const director of directors) {
        approvers.push({
          approver: director._id,
          role: 'director',
          status: 'pending',
          reason: 'high_value'
        });
      }
    }
    
    // Expenses with anomaly flags require additional review
    if (expense.anomalyFlags && expense.anomalyFlags.length > 0) {
      const hasHighSeverityFlag = expense.anomalyFlags.some(
        flag => flag.severity === 'high' || flag.severity === 'critical'
      );
      
      if (hasHighSeverityFlag) {
        const admins = await User.find({
          company: company._id,
          role: 'admin',
          isActive: true
        });
        
        for (const admin of admins) {
          approvers.push({
            approver: admin._id,
            role: 'admin',
            status: 'pending',
            reason: 'anomaly_detection'
          });
        }
      }
    }
    
    // Client billable expenses might need special approval
    if (expense.isBillable && expense.clientCode) {
      // Add client-specific approval logic here
    }
    
    return approvers;
  }

  /**
   * Remove duplicate approvers from the flow
   * @param {Array} approvalFlow - Original approval flow
   * @returns {Array} Deduplicated approval flow
   */
  removeDuplicateApprovers(approvalFlow) {
    const seen = new Set();
    const unique = [];
    
    for (const approval of approvalFlow) {
      const key = approval.approver.toString();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(approval);
      }
    }
    
    return unique;
  }

  /**
   * Apply conditional logic to approval flow
   * @param {Array} approvalFlow - Base approval flow
   * @param {Object} rules - Approval rules
   * @returns {Array} Final approval flow with conditional logic
   */
  applyConditionalLogic(approvalFlow, rules) {
    // Group approvers by role for conditional rules
    const roleGroups = {};
    approvalFlow.forEach(approval => {
      if (!roleGroups[approval.role]) {
        roleGroups[approval.role] = [];
      }
      roleGroups[approval.role].push(approval);
    });
    
    // Apply percentage rules
    for (const [role, approvers] of Object.entries(roleGroups)) {
      if (approvers.length > 1 && approvers[0].ruleType === 'percentage') {
        const percentage = approvers[0].percentage || 60;
        const requiredCount = Math.ceil(approvers.length * (percentage / 100));
        
        // Mark the rule type for processing during approval
        approvers.forEach(approver => {
          approver.conditionalRule = {
            type: 'percentage',
            requiredCount,
            totalCount: approvers.length,
            percentage
          };
        });
      }
    }
    
    return approvalFlow;
  }

  /**
   * Process approval decision
   * @param {string} expenseId - Expense ID
   * @param {string} approverId - Approver's user ID
   * @param {string} decision - 'approved' or 'rejected'
   * @param {string} comments - Approval comments
   * @param {Object} metadata - Additional metadata
   * @returns {Object} Updated expense with new approval status
   */
  async processApproval(expenseId, approverId, decision, comments = '', metadata = {}) {
    try {
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }
      
      // Find the approval step for this approver
      const approvalIndex = expense.approvalFlow.findIndex(
        approval => approval.approver.toString() === approverId && approval.status === 'pending'
      );
      
      if (approvalIndex === -1) {
        throw new Error('No pending approval found for this user');
      }
      
      // Update the approval step
      expense.approvalFlow[approvalIndex].status = decision;
      expense.approvalFlow[approvalIndex].comments = comments;
      expense.approvalFlow[approvalIndex].timestamp = new Date();
      expense.approvalFlow[approvalIndex].metadata = metadata;
      
      // Check if this completes a conditional rule
      const approval = expense.approvalFlow[approvalIndex];
      if (approval.conditionalRule) {
        const sameRoleApprovals = expense.approvalFlow.filter(
          a => a.role === approval.role && a.conditionalRule
        );
        const approvedCount = sameRoleApprovals.filter(a => a.status === 'approved').length;
        
        // Check if percentage requirement is met
        if (approvedCount >= approval.conditionalRule.requiredCount) {
          // Mark remaining pending approvals of the same role as not required
          sameRoleApprovals
            .filter(a => a.status === 'pending')
            .forEach(a => {
              a.status = 'skipped';
              a.comments = 'Percentage requirement met';
              a.timestamp = new Date();
            });
        }
      }
      
      // Determine overall status
      const pendingApprovals = expense.approvalFlow.filter(a => a.status === 'pending');
      const rejectedApprovals = expense.approvalFlow.filter(a => a.status === 'rejected');
      
      if (rejectedApprovals.length > 0) {
        expense.status = 'rejected';
        expense.rejectedAt = new Date();
      } else if (pendingApprovals.length === 0) {
        expense.status = 'approved';
        expense.approvedAt = new Date();
      }
      
      await expense.save();
      
      // Populate for return
      await expense.populate('submittedBy', 'firstName lastName email');
      await expense.populate('approvalFlow.approver', 'firstName lastName email role');
      
      return expense;
      
    } catch (error) {
      console.error('Error processing approval:', error);
      throw error;
    }
  }

  /**
   * Override approval (admin only)
   * @param {string} expenseId - Expense ID
   * @param {string} adminId - Admin user ID
   * @param {string} decision - 'approved' or 'rejected'
   * @param {string} reason - Override reason
   * @returns {Object} Updated expense
   */
  async overrideApproval(expenseId, adminId, decision, reason) {
    try {
      const expense = await Expense.findById(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }
      
      const admin = await User.findById(adminId);
      if (!admin || admin.role !== 'admin') {
        throw new Error('Only admins can override approvals');
      }
      
      // Mark all pending approvals as overridden
      expense.approvalFlow.forEach(approval => {
        if (approval.status === 'pending') {
          approval.status = 'overridden';
          approval.comments = `Admin override: ${reason}`;
          approval.timestamp = new Date();
        }
      });
      
      // Add admin override entry
      expense.approvalFlow.push({
        approver: adminId,
        role: 'admin',
        status: decision,
        comments: `Admin override: ${reason}`,
        timestamp: new Date(),
        metadata: { isOverride: true }
      });
      
      expense.status = decision;
      if (decision === 'approved') {
        expense.approvedAt = new Date();
      } else {
        expense.rejectedAt = new Date();
      }
      
      await expense.save();
      
      await expense.populate('submittedBy', 'firstName lastName email');
      await expense.populate('approvalFlow.approver', 'firstName lastName email role');
      
      return expense;
      
    } catch (error) {
      console.error('Error overriding approval:', error);
      throw error;
    }
  }

  /**
   * Get approval statistics for a company
   * @param {string} companyId - Company ID
   * @param {Date} startDate - Start date for statistics
   * @param {Date} endDate - End date for statistics
   * @returns {Object} Approval statistics
   */
  async getApprovalStatistics(companyId, startDate, endDate) {
    try {
      const matchStage = {
        company: companyId,
        submittedAt: { $gte: startDate, $lte: endDate }
      };
      
      const stats = await Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            avgProcessingDays: {
              $avg: {
                $divide: [
                  { $subtract: ['$approvedAt', '$submittedAt'] },
                  86400000 // Convert to days
                ]
              }
            }
          }
        }
      ]);
      
      const approverStats = await Expense.aggregate([
        { $match: matchStage },
        { $unwind: '$approvalFlow' },
        {
          $group: {
            _id: '$approvalFlow.approver',
            approvedCount: {
              $sum: { $cond: [{ $eq: ['$approvalFlow.status', 'approved'] }, 1, 0] }
            },
            rejectedCount: {
              $sum: { $cond: [{ $eq: ['$approvalFlow.status', 'rejected'] }, 1, 0] }
            },
            pendingCount: {
              $sum: { $cond: [{ $eq: ['$approvalFlow.status', 'pending'] }, 1, 0] }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'approver'
          }
        }
      ]);
      
      return {
        statusDistribution: stats,
        approverPerformance: approverStats
      };
      
    } catch (error) {
      console.error('Error getting approval statistics:', error);
      throw error;
    }
  }
}

// Create singleton instance
const approvalService = new ApprovalService();

// Export the main functions
const createApprovalFlow = async (expense, company) => {
  return await approvalService.createApprovalFlow(expense, company);
};

const processApproval = async (expenseId, approverId, decision, comments, metadata) => {
  return await approvalService.processApproval(expenseId, approverId, decision, comments, metadata);
};

const overrideApproval = async (expenseId, adminId, decision, reason) => {
  return await approvalService.overrideApproval(expenseId, adminId, decision, reason);
};

const getApprovalStatistics = async (companyId, startDate, endDate) => {
  return await approvalService.getApprovalStatistics(companyId, startDate, endDate);
};

module.exports = {
  createApprovalFlow,
  processApproval,
  overrideApproval,
  getApprovalStatistics,
  ApprovalService
};