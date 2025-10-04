const Expense = require('../models/Expense');
const User = require('../models/User');
const Company = require('../models/Company');

/**
 * Anomaly Detection Service for identifying suspicious or unusual expense patterns
 * Uses rule-based and statistical methods to flag potential issues
 */

class AnomalyDetectionService {
  constructor() {
    this.thresholds = {
      unusualAmount: {
        multiplier: 3, // Flag if amount is 3x user's average
        absoluteHigh: 10000, // Flag if amount > $10,000
        absoluteLow: 0.01 // Flag if amount < $0.01
      },
      duplicateTimeWindow: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      frequentSubmission: {
        maxPerDay: 10,
        maxPerWeek: 30
      },
      suspiciousVendors: [
        'cash', 'personal', 'myself', 'friend', 'family', 'unknown'
      ],
      policyViolations: {
        weekendSubmissions: true,
        lateSubmissions: 30 // days
      }
    };
  }

  /**
   * Detect anomalies in an expense
   * @param {Object} expense - Expense document
   * @param {Object} user - User who submitted the expense
   * @returns {Array} Array of detected anomalies
   */
  async detectAnomalies(expense, user) {
    try {
      const anomalies = [];

      // Run all anomaly detection checks in parallel
      const checks = await Promise.allSettled([
        this.checkDuplicates(expense, user),
        this.checkUnusualAmount(expense, user),
        this.checkSuspiciousVendor(expense),
        this.checkFrequentSubmissions(expense, user),
        this.checkPolicyViolations(expense, user),
        this.checkGeographicAnomalies(expense, user),
        this.checkReceiptAnomalies(expense),
        this.checkCategoryConsistency(expense, user)
      ]);

      // Collect results from all checks
      for (const check of checks) {
        if (check.status === 'fulfilled' && check.value) {
          if (Array.isArray(check.value)) {
            anomalies.push(...check.value);
          } else {
            anomalies.push(check.value);
          }
        }
      }

      // Sort by severity (critical > high > medium > low)
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      anomalies.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

      return anomalies;

    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return [];
    }
  }

  /**
   * Check for duplicate expenses
   * @param {Object} expense - Current expense
   * @param {Object} user - User who submitted
   * @returns {Object|null} Anomaly object or null
   */
  async checkDuplicates(expense, user) {
    try {
      const timeWindow = new Date(expense.date.getTime() - this.thresholds.duplicateTimeWindow);
      
      const similarExpenses = await Expense.find({
        submittedBy: user._id,
        _id: { $ne: expense._id },
        date: { 
          $gte: timeWindow,
          $lte: new Date(expense.date.getTime() + this.thresholds.duplicateTimeWindow)
        },
        $or: [
          // Exact amount match
          { amount: expense.amount },
          // Same vendor and similar amount (±10%)
          {
            vendor: expense.vendor,
            amount: {
              $gte: expense.amount * 0.9,
              $lte: expense.amount * 1.1
            }
          },
          // Same category, amount, and date
          {
            category: expense.category,
            amount: expense.amount,
            date: expense.date
          }
        ]
      });

      if (similarExpenses.length > 0) {
        let severity = 'medium';
        let confidence = 60;

        // Increase severity for exact matches
        const exactMatches = similarExpenses.filter(e => 
          e.amount === expense.amount && 
          e.vendor === expense.vendor &&
          Math.abs(e.date - expense.date) < 60000 // Within 1 minute
        );

        if (exactMatches.length > 0) {
          severity = 'high';
          confidence = 90;
        }

        return {
          type: 'duplicate',
          severity,
          confidence,
          description: `Potential duplicate expense found. ${similarExpenses.length} similar expense(s) within 24 hours.`,
          metadata: {
            similarExpenseIds: similarExpenses.map(e => e._id),
            exactMatches: exactMatches.length
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Duplicate check failed:', error);
      return null;
    }
  }

  /**
   * Check for unusual amounts based on user's spending patterns
   * @param {Object} expense - Current expense
   * @param {Object} user - User who submitted
   * @returns {Object|null} Anomaly object or null
   */
  async checkUnusualAmount(expense, user) {
    try {
      // Check absolute thresholds first
      if (expense.amount > this.thresholds.unusualAmount.absoluteHigh) {
        return {
          type: 'unusual_amount',
          severity: 'high',
          confidence: 85,
          description: `Unusually high amount: $${expense.amount.toFixed(2)} exceeds $${this.thresholds.unusualAmount.absoluteHigh} threshold.`,
          metadata: { amountThreshold: 'absolute_high' }
        };
      }

      if (expense.amount < this.thresholds.unusualAmount.absoluteLow) {
        return {
          type: 'unusual_amount',
          severity: 'medium',
          confidence: 70,
          description: `Unusually low amount: $${expense.amount.toFixed(2)}`,
          metadata: { amountThreshold: 'absolute_low' }
        };
      }

      // Get user's historical spending patterns
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const historicalExpenses = await Expense.find({
        submittedBy: user._id,
        _id: { $ne: expense._id },
        date: { $gte: thirtyDaysAgo },
        status: { $in: ['submitted', 'approved', 'reimbursed'] }
      });

      if (historicalExpenses.length < 5) {
        // Not enough data for pattern analysis
        return null;
      }

      // Calculate statistics
      const amounts = historicalExpenses.map(e => e.amount);
      const avgAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const median = this.calculateMedian(amounts);
      const stdDev = this.calculateStandardDeviation(amounts, avgAmount);

      // Check if current amount is significantly higher than average
      const deviationFromAvg = (expense.amount - avgAmount) / avgAmount;
      const zScore = stdDev > 0 ? (expense.amount - avgAmount) / stdDev : 0;

      if (zScore > 3 || deviationFromAvg > 2) {
        return {
          type: 'unusual_amount',
          severity: zScore > 4 ? 'high' : 'medium',
          confidence: Math.min(90, 60 + Math.abs(zScore) * 10),
          description: `Amount significantly higher than user's typical spending. Average: $${avgAmount.toFixed(2)}, Current: $${expense.amount.toFixed(2)}`,
          metadata: {
            userAverage: avgAmount,
            userMedian: median,
            zScore: zScore,
            deviationPercentage: deviationFromAvg * 100
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Unusual amount check failed:', error);
      return null;
    }
  }

  /**
   * Check for suspicious vendor names
   * @param {Object} expense - Current expense
   * @returns {Object|null} Anomaly object or null
   */
  async checkSuspiciousVendor(expense) {
    try {
      if (!expense.vendor) return null;

      const vendorLower = expense.vendor.toLowerCase();
      const suspiciousTerms = this.thresholds.suspiciousVendors;

      for (const term of suspiciousTerms) {
        if (vendorLower.includes(term)) {
          return {
            type: 'suspicious_vendor',
            severity: 'medium',
            confidence: 75,
            description: `Vendor name contains suspicious term: "${term}"`,
            metadata: { 
              vendor: expense.vendor,
              suspiciousTerm: term 
            }
          };
        }
      }

      // Check for very short or generic vendor names
      if (expense.vendor.length < 3) {
        return {
          type: 'suspicious_vendor',
          severity: 'low',
          confidence: 60,
          description: 'Vendor name is unusually short',
          metadata: { vendor: expense.vendor }
        };
      }

      // Check for vendors with only numbers or special characters
      if (!/[a-zA-Z]/.test(expense.vendor)) {
        return {
          type: 'suspicious_vendor',
          severity: 'medium',
          confidence: 70,
          description: 'Vendor name contains no letters',
          metadata: { vendor: expense.vendor }
        };
      }

      return null;
    } catch (error) {
      console.error('Suspicious vendor check failed:', error);
      return null;
    }
  }

  /**
   * Check for frequent submissions pattern
   * @param {Object} expense - Current expense
   * @param {Object} user - User who submitted
   * @returns {Object|null} Anomaly object or null
   */
  async checkFrequentSubmissions(expense, user) {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Count submissions in the last 24 hours
      const dailySubmissions = await Expense.countDocuments({
        submittedBy: user._id,
        createdAt: { $gte: oneDayAgo }
      });

      // Count submissions in the last week
      const weeklySubmissions = await Expense.countDocuments({
        submittedBy: user._id,
        createdAt: { $gte: oneWeekAgo }
      });

      const anomalies = [];

      if (dailySubmissions > this.thresholds.frequentSubmission.maxPerDay) {
        anomalies.push({
          type: 'frequent_submission',
          severity: 'high',
          confidence: 85,
          description: `Excessive daily submissions: ${dailySubmissions} expenses in 24 hours`,
          metadata: { 
            dailyCount: dailySubmissions,
            threshold: this.thresholds.frequentSubmission.maxPerDay
          }
        });
      }

      if (weeklySubmissions > this.thresholds.frequentSubmission.maxPerWeek) {
        anomalies.push({
          type: 'frequent_submission',
          severity: 'medium',
          confidence: 75,
          description: `High weekly submission volume: ${weeklySubmissions} expenses in 7 days`,
          metadata: { 
            weeklyCount: weeklySubmissions,
            threshold: this.thresholds.frequentSubmission.maxPerWeek
          }
        });
      }

      return anomalies.length > 0 ? anomalies : null;
    } catch (error) {
      console.error('Frequent submissions check failed:', error);
      return null;
    }
  }

  /**
   * Check for policy violations
   * @param {Object} expense - Current expense
   * @param {Object} user - User who submitted
   * @returns {Array} Array of policy violation anomalies
   */
  async checkPolicyViolations(expense, user) {
    try {
      const anomalies = [];
      
      // Check late submission
      const daysSinceExpense = Math.floor((Date.now() - expense.date.getTime()) / (24 * 60 * 60 * 1000));
      if (daysSinceExpense > this.thresholds.policyViolations.lateSubmissions) {
        anomalies.push({
          type: 'policy_violation',
          severity: 'medium',
          confidence: 90,
          description: `Late submission: Expense is ${daysSinceExpense} days old`,
          metadata: { 
            violationType: 'late_submission',
            daysLate: daysSinceExpense,
            threshold: this.thresholds.policyViolations.lateSubmissions
          }
        });
      }

      // Check weekend submission for business expenses
      if (this.thresholds.policyViolations.weekendSubmissions) {
        const expenseDay = expense.date.getDay();
        if ((expenseDay === 0 || expenseDay === 6) && !expense.isPersonal) {
          anomalies.push({
            type: 'policy_violation',
            severity: 'low',
            confidence: 60,
            description: 'Business expense incurred on weekend',
            metadata: { 
              violationType: 'weekend_business_expense',
              expenseDate: expense.date.toISOString().split('T')[0]
            }
          });
        }
      }

      // Check missing receipt for categories that require it
      const company = await Company.findById(user.company);
      if (company) {
        const categoryConfig = company.settings.expenseCategories.find(cat => cat.name === expense.category);
        if (categoryConfig && categoryConfig.requiresReceipt && (!expense.receipts || expense.receipts.length === 0)) {
          anomalies.push({
            type: 'policy_violation',
            severity: 'high',
            confidence: 95,
            description: `Missing receipt for ${expense.category} category`,
            metadata: { 
              violationType: 'missing_receipt',
              category: expense.category
            }
          });
        }

        // Check amount limits for category
        if (categoryConfig && categoryConfig.maxAmount && expense.amount > categoryConfig.maxAmount) {
          anomalies.push({
            type: 'policy_violation',
            severity: 'high',
            confidence: 95,
            description: `Amount exceeds category limit: $${expense.amount} > $${categoryConfig.maxAmount}`,
            metadata: { 
              violationType: 'category_limit_exceeded',
              amount: expense.amount,
              limit: categoryConfig.maxAmount,
              category: expense.category
            }
          });
        }
      }

      return anomalies;
    } catch (error) {
      console.error('Policy violations check failed:', error);
      return [];
    }
  }

  /**
   * Check for geographic anomalies
   * @param {Object} expense - Current expense
   * @param {Object} user - User who submitted
   * @returns {Object|null} Anomaly object or null
   */
  async checkGeographicAnomalies(expense, user) {
    try {
      if (!expense.location || !expense.location.coordinates) {
        return null;
      }

      // Get user's typical locations from recent expenses
      const recentExpenses = await Expense.find({
        submittedBy: user._id,
        _id: { $ne: expense._id },
        'location.coordinates': { $exists: true },
        date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      if (recentExpenses.length < 3) {
        return null; // Not enough data
      }

      // Calculate average location
      const totalLat = recentExpenses.reduce((sum, exp) => sum + exp.location.coordinates.lat, 0);
      const totalLng = recentExpenses.reduce((sum, exp) => sum + exp.location.coordinates.lng, 0);
      const avgLat = totalLat / recentExpenses.length;
      const avgLng = totalLng / recentExpenses.length;

      // Calculate distance from average location
      const distance = this.calculateDistance(
        expense.location.coordinates.lat,
        expense.location.coordinates.lng,
        avgLat,
        avgLng
      );

      // Flag if more than 100km from usual area
      if (distance > 100) {
        return {
          type: 'geographic_anomaly',
          severity: distance > 500 ? 'high' : 'medium',
          confidence: Math.min(90, 50 + distance / 10),
          description: `Expense location is ${distance.toFixed(1)}km from user's typical area`,
          metadata: {
            distance: distance,
            expenseLocation: expense.location.coordinates,
            userAverageLocation: { lat: avgLat, lng: avgLng }
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Geographic anomalies check failed:', error);
      return null;
    }
  }

  /**
   * Check receipt anomalies using OCR data
   * @param {Object} expense - Current expense
   * @returns {Array} Array of receipt anomalies
   */
  async checkReceiptAnomalies(expense) {
    try {
      const anomalies = [];

      if (!expense.receipts || expense.receipts.length === 0) {
        return anomalies;
      }

      for (const receipt of expense.receipts) {
        if (receipt.ocrData && receipt.ocrData.parsedData) {
          const ocrData = receipt.ocrData.parsedData;

          // Check amount discrepancy
          if (ocrData.amount && Math.abs(ocrData.amount - expense.amount) > 0.01) {
            const discrepancy = Math.abs(ocrData.amount - expense.amount);
            const discrepancyPercent = (discrepancy / expense.amount) * 100;

            anomalies.push({
              type: 'receipt_anomaly',
              severity: discrepancyPercent > 10 ? 'high' : 'medium',
              confidence: 80,
              description: `Amount mismatch between receipt ($${ocrData.amount}) and entered amount ($${expense.amount})`,
              metadata: {
                receiptAmount: ocrData.amount,
                enteredAmount: expense.amount,
                discrepancy: discrepancy,
                discrepancyPercent: discrepancyPercent
              }
            });
          }

          // Check date discrepancy
          if (ocrData.date) {
            const ocrDate = new Date(ocrData.date);
            const expenseDate = new Date(expense.date);
            const daysDiff = Math.abs((ocrDate - expenseDate) / (24 * 60 * 60 * 1000));

            if (daysDiff > 1) {
              anomalies.push({
                type: 'receipt_anomaly',
                severity: daysDiff > 7 ? 'high' : 'medium',
                confidence: 75,
                description: `Date mismatch between receipt and entered date (${daysDiff.toFixed(1)} days difference)`,
                metadata: {
                  receiptDate: ocrDate.toISOString().split('T')[0],
                  enteredDate: expenseDate.toISOString().split('T')[0],
                  daysDifference: daysDiff
                }
              });
            }
          }

          // Check vendor name discrepancy
          if (ocrData.vendor && expense.vendor) {
            const similarity = this.calculateStringSimilarity(ocrData.vendor, expense.vendor);
            if (similarity < 0.6) {
              anomalies.push({
                type: 'receipt_anomaly',
                severity: 'medium',
                confidence: 70,
                description: `Vendor name mismatch between receipt and entered data`,
                metadata: {
                  receiptVendor: ocrData.vendor,
                  enteredVendor: expense.vendor,
                  similarity: similarity
                }
              });
            }
          }
        }

        // Check if receipt confidence is too low
        if (receipt.ocrData && receipt.ocrData.confidence < 50) {
          anomalies.push({
            type: 'receipt_anomaly',
            severity: 'low',
            confidence: 60,
            description: `Poor receipt quality detected (OCR confidence: ${receipt.ocrData.confidence}%)`,
            metadata: {
              ocrConfidence: receipt.ocrData.confidence,
              receiptFile: receipt.filename
            }
          });
        }
      }

      return anomalies;
    } catch (error) {
      console.error('Receipt anomalies check failed:', error);
      return [];
    }
  }

  /**
   * Check category consistency with user's historical patterns
   * @param {Object} expense - Current expense
   * @param {Object} user - User who submitted
   * @returns {Object|null} Anomaly object or null
   */
  async checkCategoryConsistency(expense, user) {
    try {
      if (!expense.vendor) return null;

      // Find other expenses with the same vendor
      const vendorExpenses = await Expense.find({
        submittedBy: user._id,
        vendor: expense.vendor,
        _id: { $ne: expense._id },
        status: { $in: ['submitted', 'approved', 'reimbursed'] }
      });

      if (vendorExpenses.length < 2) {
        return null; // Not enough data
      }

      // Check if user consistently uses different category for this vendor
      const categoryUsage = {};
      vendorExpenses.forEach(exp => {
        categoryUsage[exp.category] = (categoryUsage[exp.category] || 0) + 1;
      });

      const mostUsedCategory = Object.keys(categoryUsage).reduce((a, b) => 
        categoryUsage[a] > categoryUsage[b] ? a : b
      );

      const consistencyRate = categoryUsage[mostUsedCategory] / vendorExpenses.length;

      if (consistencyRate > 0.7 && expense.category !== mostUsedCategory) {
        return {
          type: 'category_inconsistency',
          severity: 'low',
          confidence: Math.min(85, consistencyRate * 100),
          description: `Category inconsistent with historical pattern for vendor "${expense.vendor}"`,
          metadata: {
            vendor: expense.vendor,
            currentCategory: expense.category,
            expectedCategory: mostUsedCategory,
            consistencyRate: consistencyRate,
            historicalUsage: categoryUsage
          }
        };
      }

      return null;
    } catch (error) {
      console.error('Category consistency check failed:', error);
      return null;
    }
  }

  /**
   * Calculate median of an array of numbers
   * @param {Array} numbers - Array of numbers
   * @returns {number} Median value
   */
  calculateMedian(numbers) {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculate standard deviation
   * @param {Array} numbers - Array of numbers
   * @param {number} mean - Mean value
   * @returns {number} Standard deviation
   */
  calculateStandardDeviation(numbers, mean) {
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   * @param {number} lat1 - Latitude 1
   * @param {number} lng1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lng2 - Longitude 2
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   * @param {string} str1 - String 1
   * @param {string} str2 - String 2
   * @returns {number} Similarity ratio (0-1)
   */
  calculateStringSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} str1 - String 1
   * @param {string} str2 - String 2
   * @returns {number} Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// Create singleton instance
const anomalyDetectionService = new AnomalyDetectionService();

// Export the main function
const detectAnomalies = async (expense, user) => {
  return await anomalyDetectionService.detectAnomalies(expense, user);
};

module.exports = {
  detectAnomalies,
  AnomalyDetectionService
};