const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Expense:
 *       type: object
 *       required:
 *         - amount
 *         - date
 *         - category
 *         - description
 *         - submittedBy
 *         - company
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated expense ID
 *         expenseNumber:
 *           type: string
 *           description: Human-readable expense number
 *         amount:
 *           type: number
 *           description: Expense amount
 *         originalAmount:
 *           type: number
 *           description: Original amount before currency conversion
 *         currency:
 *           type: string
 *           description: Currency code (e.g., USD, EUR)
 *         originalCurrency:
 *           type: string
 *           description: Original currency before conversion
 *         exchangeRate:
 *           type: number
 *           description: Exchange rate used for conversion
 *         date:
 *           type: string
 *           format: date
 *           description: Expense date
 *         category:
 *           type: string
 *           description: Expense category
 *         subcategory:
 *           type: string
 *           description: Expense subcategory
 *         description:
 *           type: string
 *           description: Expense description
 *         vendor:
 *           type: string
 *           description: Vendor/merchant name
 *         location:
 *           type: object
 *           properties:
 *             address:
 *               type: string
 *             city:
 *               type: string
 *             country:
 *               type: string
 *             coordinates:
 *               type: object
 *               properties:
 *                 lat:
 *                   type: number
 *                 lng:
 *                   type: number
 *         receipts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *               originalName:
 *                 type: string
 *               url:
 *                 type: string
 *               size:
 *                 type: number
 *               mimeType:
 *                 type: string
 *               ocrData:
 *                 type: object
 *         status:
 *           type: string
 *           enum: [draft, submitted, approved, rejected, reimbursed]
 *           description: Expense status
 *         submittedBy:
 *           type: string
 *           description: Reference to user who submitted the expense
 *         company:
 *           type: string
 *           description: Reference to company ID
 *         approvalFlow:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               approver:
 *                 type: string
 *               role:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *               comments:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         isReimbursable:
 *           type: boolean
 *           description: Whether the expense is reimbursable
 *         isPersonal:
 *           type: boolean
 *           description: Whether the expense is personal
 *         projectCode:
 *           type: string
 *           description: Associated project code
 *         clientCode:
 *           type: string
 *           description: Associated client code
 *         submittedAt:
 *           type: string
 *           format: date-time
 *         approvedAt:
 *           type: string
 *           format: date-time
 *         reimbursedAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const expenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than 0']
  },
  originalAmount: {
    type: Number,
    default: function() { return this.amount; }
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    default: 'USD',
    match: [/^[A-Z]{3}$/, 'Currency must be a 3-letter code']
  },
  originalCurrency: {
    type: String,
    uppercase: true,
    default: function() { return this.currency; }
  },
  exchangeRate: {
    type: Number,
    default: 1,
    min: [0, 'Exchange rate must be positive']
  },
  date: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Expense date cannot be in the future'
    }
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  vendor: {
    type: String,
    trim: true,
    maxlength: 200
  },
  location: {
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    coordinates: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 }
    }
  },
  receipts: [{
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    ocrData: {
      extractedText: String,
      confidence: Number,
      parsedData: {
        amount: Number,
        date: Date,
        vendor: String,
        category: String,
        items: [{
          description: String,
          quantity: Number,
          unitPrice: Number,
          totalPrice: Number
        }]
      }
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected', 'reimbursed', 'cancelled'],
    default: 'draft'
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  approvalFlow: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['manager', 'finance', 'director', 'admin'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    comments: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      ipAddress: String,
      userAgent: String,
      deviceInfo: String
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isReimbursable: {
    type: Boolean,
    default: true
  },
  isPersonal: {
    type: Boolean,
    default: false
  },
  isBillable: {
    type: Boolean,
    default: false
  },
  projectCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  clientCode: {
    type: String,
    trim: true,
    uppercase: true
  },
  businessPurpose: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  attendees: [{
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    company: { type: String, trim: true },
    relationship: { 
      type: String, 
      enum: ['employee', 'client', 'vendor', 'partner', 'other'] 
    }
  }],
  mileage: {
    distance: { type: Number, min: 0 },
    unit: { type: String, enum: ['miles', 'kilometers'], default: 'miles' },
    rate: { type: Number, min: 0 },
    startLocation: String,
    endLocation: String,
    purpose: String
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'debit_card', 'company_card', 'bank_transfer', 'other'],
    default: 'credit_card'
  },
  cardDetails: {
    lastFourDigits: String,
    cardType: String
  },
  reimbursementDetails: {
    method: {
      type: String,
      enum: ['bank_transfer', 'check', 'payroll', 'corporate_card'],
      default: 'bank_transfer'
    },
    accountNumber: String,
    routingNumber: String,
    amount: Number,
    processedAt: Date,
    transactionId: String
  },
  anomalyFlags: [{
    type: {
      type: String,
      enum: ['duplicate', 'unusual_amount', 'suspicious_vendor', 'policy_violation', 'frequent_submission']
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical']
    },
    description: String,
    confidence: Number,
    detectedAt: { type: Date, default: Date.now },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    resolution: String
  }],
  submittedAt: {
    type: Date,
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  reimbursedAt: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for approval status
expenseSchema.virtual('approvalStatus').get(function() {
  if (this.status === 'draft') return 'Draft';
  if (this.status === 'submitted') {
    const pendingApprovals = this.approvalFlow.filter(a => a.status === 'pending');
    const approvedCount = this.approvalFlow.filter(a => a.status === 'approved').length;
    const totalRequired = this.approvalFlow.length;
    
    if (pendingApprovals.length === 0 && approvedCount === totalRequired) {
      return 'Fully Approved';
    }
    return `${approvedCount}/${totalRequired} Approved`;
  }
  return this.status.charAt(0).toUpperCase() + this.status.slice(1);
});

// Virtual for current approver
expenseSchema.virtual('currentApprover').get(function() {
  const pendingApproval = this.approvalFlow.find(a => a.status === 'pending');
  return pendingApproval ? pendingApproval.approver : null;
});

// Virtual for days since submission
expenseSchema.virtual('daysSinceSubmission').get(function() {
  if (!this.submittedAt) return null;
  const diffTime = Math.abs(new Date() - this.submittedAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Indexes for better performance (only non-unique indexes)
// Note: expenseNumber already has unique index
expenseSchema.index({ submittedBy: 1, status: 1 });
expenseSchema.index({ company: 1, status: 1 });
expenseSchema.index({ 'approvalFlow.approver': 1, 'approvalFlow.status': 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ amount: 1 });
expenseSchema.index({ createdAt: -1 });

// Generate expense number before saving
expenseSchema.pre('save', async function(next) {
  if (!this.expenseNumber && this.isNew) {
    const company = await mongoose.model('Company').findById(this.company);
    if (company) {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const count = await this.constructor.countDocuments({ 
        company: this.company,
        createdAt: { 
          $gte: new Date(year, new Date().getMonth(), 1),
          $lt: new Date(year, new Date().getMonth() + 1, 1)
        }
      });
      this.expenseNumber = `${company.code}-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }
  }
  next();
});

// Update timestamps when status changes
expenseSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    const now = new Date();
    switch (this.status) {
      case 'submitted':
        if (!this.submittedAt) this.submittedAt = now;
        break;
      case 'approved':
        if (!this.approvedAt) this.approvedAt = now;
        break;
      case 'rejected':
        if (!this.rejectedAt) this.rejectedAt = now;
        break;
      case 'reimbursed':
        if (!this.reimbursedAt) this.reimbursedAt = now;
        break;
    }
  }
  next();
});

// Static method to get expenses by status
expenseSchema.statics.findByStatus = function(status, companyId) {
  const query = { status };
  if (companyId) query.company = companyId;
  return this.find(query).populate('submittedBy', 'firstName lastName email');
};

// Static method to get pending approvals for a user
expenseSchema.statics.findPendingApprovals = function(userId) {
  return this.find({
    'approvalFlow.approver': userId,
    'approvalFlow.status': 'pending',
    status: 'submitted'
  }).populate('submittedBy', 'firstName lastName email');
};

// Static method to calculate total expenses by period
expenseSchema.statics.getTotalByPeriod = function(companyId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        company: mongoose.Types.ObjectId(companyId),
        date: { $gte: startDate, $lte: endDate },
        status: { $in: ['approved', 'reimbursed'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

module.exports = mongoose.model('Expense', expenseSchema);