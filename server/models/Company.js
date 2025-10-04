const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Company:
 *       type: object
 *       required:
 *         - name
 *         - country
 *         - defaultCurrency
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated company ID
 *         name:
 *           type: string
 *           description: Company name
 *         code:
 *           type: string
 *           description: Unique company code
 *         country:
 *           type: string
 *           description: Company's country
 *         defaultCurrency:
 *           type: string
 *           description: Default currency code (e.g., USD, EUR)
 *         industry:
 *           type: string
 *           description: Company's industry
 *         size:
 *           type: string
 *           enum: [startup, small, medium, large, enterprise]
 *           description: Company size
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             zipCode:
 *               type: string
 *         logo:
 *           type: string
 *           description: URL to company logo
 *         website:
 *           type: string
 *           description: Company website URL
 *         phone:
 *           type: string
 *           description: Company phone number
 *         email:
 *           type: string
 *           description: Company contact email
 *         settings:
 *           type: object
 *           properties:
 *             expenseCategories:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   icon:
 *                     type: string
 *                   maxAmount:
 *                     type: number
 *                   requiresReceipt:
 *                     type: boolean
 *             approvalRules:
 *               type: object
 *               properties:
 *                 defaultFlow:
 *                   type: array
 *                   items:
 *                     type: string
 *                 amountThresholds:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: number
 *                       approvers:
 *                         type: array
 *                         items:
 *                           type: string
 *             fiscalYear:
 *               type: object
 *               properties:
 *                 startMonth:
 *                   type: number
 *                 endMonth:
 *                   type: number
 *         isActive:
 *           type: boolean
 *           description: Whether the company is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  code: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 10
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  defaultCurrency: {
    type: String,
    required: true,
    uppercase: true,
    default: 'USD',
    match: [/^[A-Z]{3}$/, 'Currency must be a 3-letter code']
  },
  industry: {
    type: String,
    trim: true,
    maxlength: 100
  },
  size: {
    type: String,
    enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
    default: 'small'
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true }
  },
  logo: {
    type: String,
    default: null
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  settings: {
    expenseCategories: [{
      name: { type: String, required: true },
      icon: { type: String, default: 'receipt' },
      maxAmount: { type: Number, default: null },
      requiresReceipt: { type: Boolean, default: true },
      isActive: { type: Boolean, default: true }
    }],
    approvalRules: {
      defaultFlow: [{
        type: String,
        enum: ['manager', 'finance', 'director', 'admin']
      }],
      amountThresholds: [{
        amount: { type: Number, required: true },
        approvers: [{
          type: String,
          enum: ['manager', 'finance', 'director', 'admin']
        }],
        rule: {
          type: String,
          enum: ['all', 'any', 'percentage'],
          default: 'all'
        },
        percentage: { type: Number, min: 1, max: 100 }
      }]
    },
    fiscalYear: {
      startMonth: { type: Number, min: 1, max: 12, default: 1 },
      endMonth: { type: Number, min: 1, max: 12, default: 12 }
    },
    currency: {
      allowMultiple: { type: Boolean, default: true },
      supportedCurrencies: [{ type: String, uppercase: true }]
    },
    notifications: {
      emailTemplates: {
        expenseSubmitted: { type: String },
        expenseApproved: { type: String },
        expenseRejected: { type: String }
      },
      autoReminders: {
        enabled: { type: Boolean, default: true },
        intervalDays: { type: Number, default: 3 }
      }
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'professional', 'enterprise'],
      default: 'free'
    },
    features: [{
      name: String,
      enabled: Boolean
    }],
    limits: {
      users: { type: Number, default: 10 },
      storage: { type: Number, default: 1000 }, // MB
      expenses: { type: Number, default: 100 } // per month
    },
    billing: {
      cycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
      nextBillingDate: Date,
      amount: Number
    }
  },
  integrations: {
    payroll: {
      enabled: { type: Boolean, default: false },
      provider: String,
      settings: mongoose.Schema.Types.Mixed
    },
    accounting: {
      enabled: { type: Boolean, default: false },
      provider: String,
      settings: mongoose.Schema.Types.Mixed
    },
    banking: {
      enabled: { type: Boolean, default: false },
      provider: String,
      settings: mongoose.Schema.Types.Mixed
    }
  },
  analytics: {
    monthlyBudget: { type: Number, default: null },
    expenseTracking: {
      enabled: { type: Boolean, default: true },
      categories: [String]
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for employee count
companySchema.virtual('employeeCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'company',
  count: true
});

// Virtual for active expenses count
companySchema.virtual('activeExpensesCount', {
  ref: 'Expense',
  localField: '_id',
  foreignField: 'company',
  count: true,
  match: { status: { $in: ['pending', 'approved'] } }
});

// Index for better performance (only non-unique indexes)
// Note: code already has unique index
companySchema.index({ country: 1 });
companySchema.index({ isActive: 1 });

// Generate company code before saving
companySchema.pre('save', async function(next) {
  if (!this.code && this.isNew) {
    // Generate code from company name
    const baseCode = this.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 6)
      .toUpperCase();
    
    let code = baseCode;
    let counter = 1;
    
    // Ensure uniqueness
    while (await this.constructor.findOne({ code })) {
      code = `${baseCode}${counter}`;
      counter++;
    }
    
    this.code = code;
  }
  next();
});

// Set default expense categories
companySchema.pre('save', function(next) {
  if (this.isNew && (!this.settings.expenseCategories || this.settings.expenseCategories.length === 0)) {
    this.settings.expenseCategories = [
      { name: 'Travel', icon: 'plane', requiresReceipt: true },
      { name: 'Meals', icon: 'utensils', requiresReceipt: true },
      { name: 'Transportation', icon: 'car', requiresReceipt: true },
      { name: 'Accommodation', icon: 'bed', requiresReceipt: true },
      { name: 'Office Supplies', icon: 'paperclip', requiresReceipt: true },
      { name: 'Software', icon: 'laptop', requiresReceipt: true },
      { name: 'Training', icon: 'graduation-cap', requiresReceipt: true },
      { name: 'Marketing', icon: 'bullhorn', requiresReceipt: true },
      { name: 'Client Entertainment', icon: 'glass-cheers', requiresReceipt: true },
      { name: 'Other', icon: 'file-invoice', requiresReceipt: true }
    ];
  }
  next();
});

// Set default approval rules
companySchema.pre('save', function(next) {
  if (this.isNew && (!this.settings.approvalRules || !this.settings.approvalRules.defaultFlow)) {
    this.settings.approvalRules = {
      defaultFlow: ['manager', 'finance'],
      amountThresholds: [
        {
          amount: 100,
          approvers: ['manager'],
          rule: 'all'
        },
        {
          amount: 1000,
          approvers: ['manager', 'finance'],
          rule: 'all'
        },
        {
          amount: 5000,
          approvers: ['manager', 'finance', 'director'],
          rule: 'percentage',
          percentage: 60
        }
      ]
    };
  }
  next();
});

// Static method to get country currency mapping
companySchema.statics.getCountryCurrency = function() {
  return {
    'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'EU': 'EUR',
    'AU': 'AUD', 'JP': 'JPY', 'IN': 'INR', 'CN': 'CNY',
    'SG': 'SGD', 'HK': 'HKD', 'CH': 'CHF', 'NO': 'NOK',
    'SE': 'SEK', 'DK': 'DKK', 'NZ': 'NZD', 'KR': 'KRW'
  };
};

module.exports = mongoose.model('Company', companySchema);