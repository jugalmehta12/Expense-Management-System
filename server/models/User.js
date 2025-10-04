const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated user ID
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: Hashed password
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         role:
 *           type: string
 *           enum: [employee, manager, finance, director, admin]
 *           description: User's role in the organization
 *         company:
 *           type: string
 *           description: Reference to company ID
 *         manager:
 *           type: string
 *           description: Reference to manager's user ID
 *         department:
 *           type: string
 *           description: User's department
 *         employeeId:
 *           type: string
 *           description: Unique employee identifier
 *         profileImage:
 *           type: string
 *           description: URL to profile image
 *         phone:
 *           type: string
 *           description: User's phone number
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
 *         bankDetails:
 *           type: object
 *           properties:
 *             accountNumber:
 *               type: string
 *             routingNumber:
 *               type: string
 *             bankName:
 *               type: string
 *             accountType:
 *               type: string
 *         preferences:
 *           type: object
 *           properties:
 *             notifications:
 *               type: object
 *               properties:
 *                 email:
 *                   type: boolean
 *                 push:
 *                   type: boolean
 *                 sms:
 *                   type: boolean
 *             currency:
 *               type: string
 *             language:
 *               type: string
 *         isActive:
 *           type: boolean
 *           description: Whether the user account is active
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  role: {
    type: String,
    enum: ['employee', 'manager', 'finance', 'director', 'admin'],
    default: 'employee',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  department: {
    type: String,
    trim: true,
    maxlength: 100
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  profileImage: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true }
  },
  bankDetails: {
    accountNumber: { type: String, trim: true },
    routingNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    accountType: { 
      type: String, 
      enum: ['checking', 'savings'], 
      default: 'checking' 
    }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    currency: { type: String, default: 'USD' },
    language: { type: String, default: 'en' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    default: null
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for subordinates (employees reporting to this user)
userSchema.virtual('subordinates', {
  ref: 'User',
  localField: '_id',
  foreignField: 'manager'
});

// Index for better query performance (only non-unique indexes)
// Note: email and employeeId already have unique indexes
userSchema.index({ company: 1, role: 1 });
userSchema.index({ manager: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Generate employee ID if not provided
userSchema.pre('save', async function(next) {
  if (!this.employeeId && this.isNew) {
    const company = await mongoose.model('Company').findById(this.company);
    if (company) {
      const count = await this.constructor.countDocuments({ company: this.company });
      this.employeeId = `${company.code}-${String(count + 1).padStart(4, '0')}`;
    }
  }
  next();
});

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.emailVerificationToken;
  delete user.twoFactorSecret;
  return user;
};

// Static method to find managers in a company
userSchema.statics.findManagers = function(companyId) {
  return this.find({ 
    company: companyId, 
    role: { $in: ['manager', 'director'] },
    isActive: true 
  });
};

// Static method to find users by role
userSchema.statics.findByRole = function(companyId, role) {
  return this.find({ 
    company: companyId, 
    role: role,
    isActive: true 
  });
};

module.exports = mongoose.model('User', userSchema);