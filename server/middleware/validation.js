const mongoose = require('mongoose');

// Middleware to validate MongoDB ObjectId in request parameters
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: `Missing required parameter: ${paramName}`
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid ${paramName} format. Expected a valid MongoDB ObjectId`
      });
    }

    next();
  };
};

// Middleware to validate multiple ObjectIds in request parameters
const validateMultipleObjectIds = (paramNames = ['id']) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];
      
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: `Invalid ${paramName} format. Expected a valid MongoDB ObjectId`
        });
      }
    }

    next();
  };
};

// Middleware to validate pagination parameters
const validatePagination = (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      success: false,
      error: 'Page must be a positive integer'
    });
  }
  
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      error: 'Limit must be a positive integer between 1 and 100'
    });
  }
  
  req.pagination = {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum
  };
  
  next();
};

// Middleware to validate and sanitize search queries
const validateSearchQuery = (req, res, next) => {
  const { search } = req.query;
  
  if (search && typeof search === 'string') {
    // Remove potentially dangerous regex characters and limit length
    req.query.search = search
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special characters
      .trim()
      .substring(0, 100); // Limit to 100 characters
  }
  
  next();
};

// Middleware to validate date range queries
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid startDate format. Expected ISO date string'
      });
    }
    req.query.startDate = start;
  }
  
  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid endDate format. Expected ISO date string'
      });
    }
    req.query.endDate = end;
  }
  
  if (startDate && endDate && req.query.startDate > req.query.endDate) {
    return res.status(400).json({
      success: false,
      error: 'Start date must be before end date'
    });
  }
  
  next();
};

module.exports = {
  validateObjectId,
  validateMultipleObjectIds,
  validatePagination,
  validateSearchQuery,
  validateDateRange
};