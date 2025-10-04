const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'No authorization header provided'
      });
    }

    // Check if token starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use: Bearer <token>'
      });
    }

    // Extract token
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.userId)
      .populate('company', 'name code defaultCurrency settings')
      .populate('manager', 'firstName lastName email');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Add user to request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware to check specific roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Middleware to check if user belongs to the same company
const requireSameCompany = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Extract company ID from request parameters or body
  const companyId = req.params.companyId || req.body.company || req.query.company;

  if (companyId && companyId !== req.user.company._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Users can only access their own company data'
    });
  }

  next();
};

// Middleware to check if user can access specific user data
const requireSameUserOrManager = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const targetUserId = req.params.userId || req.params.id;
    
    // Allow access if:
    // 1. User is accessing their own data
    // 2. User is a manager/admin/finance/director
    // 3. User is the manager of the target user
    if (
      targetUserId === req.user._id.toString() ||
      ['admin', 'director', 'finance'].includes(req.user.role) ||
      (req.user.role === 'manager' && await isUserSubordinate(req.user._id, targetUserId))
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions'
    });

  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed'
    });
  }
};

// Helper function to check if a user is a subordinate
const isUserSubordinate = async (managerId, userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;
    
    // Check direct report
    if (user.manager && user.manager.toString() === managerId.toString()) {
      return true;
    }
    
    // Check indirect reports (recursive)
    if (user.manager) {
      return await isUserSubordinate(managerId, user.manager);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking subordinate relationship:', error);
    return false;
  }
};

// Middleware to log user activity
const logActivity = (action) => {
  return (req, res, next) => {
    // Add activity logging logic here
    req.activity = {
      action,
      userId: req.user ? req.user._id : null,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole,
  requireSameCompany,
  requireSameUserOrManager,
  logActivity
};