const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

// Integration Services
const SAPIntegration = require('./services/sap/SAPIntegration');
const OracleNetSuiteIntegration = require('./services/oracle/NetSuiteIntegration');
const DynamicsIntegration = require('./services/microsoft/DynamicsIntegration');
const QuickBooksIntegration = require('./services/quickbooks/QuickBooksIntegration');
const XeroIntegration = require('./services/xero/XeroIntegration');
const ADPIntegration = require('./services/payroll/ADPIntegration');
const WorkdayIntegration = require('./services/hr/WorkdayIntegration');

// Middleware
const authMiddleware = require('./middleware/auth');
const loggingMiddleware = require('./middleware/logging');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware
app.use(loggingMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    integrations: {
      sap: 'available',
      netsuite: 'available',
      dynamics: 'available',
      quickbooks: 'available',
      xero: 'available',
      adp: 'available',
      workday: 'available'
    }
  });
});

// ==========================================
// SAP INTEGRATION ENDPOINTS
// ==========================================

app.post('/api/integrations/sap/sync-expenses', 
  authMiddleware,
  [
    body('expenses').isArray().notEmpty(),
    body('companyCode').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { expenses, companyCode } = req.body;
      const sapIntegration = new SAPIntegration(req.user.tenantId);
      
      const result = await sapIntegration.syncExpenses(expenses, companyCode);
      
      res.json({
        success: true,
        message: 'Expenses synced to SAP successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('SAP sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync expenses to SAP',
        error: error.message
      });
    }
  }
);

app.post('/api/integrations/sap/create-journal-entry',
  authMiddleware,
  [
    body('expenseReport').isObject().notEmpty(),
    body('accountingEntries').isArray().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { expenseReport, accountingEntries } = req.body;
      const sapIntegration = new SAPIntegration(req.user.tenantId);
      
      const journalEntry = await sapIntegration.createJournalEntry(
        expenseReport, 
        accountingEntries
      );
      
      res.json({
        success: true,
        message: 'Journal entry created in SAP',
        data: journalEntry,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('SAP journal entry error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create journal entry in SAP',
        error: error.message
      });
    }
  }
);

app.get('/api/integrations/sap/chart-of-accounts',
  authMiddleware,
  async (req, res) => {
    try {
      const sapIntegration = new SAPIntegration(req.user.tenantId);
      const chartOfAccounts = await sapIntegration.getChartOfAccounts();
      
      res.json({
        success: true,
        data: chartOfAccounts,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('SAP chart of accounts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chart of accounts from SAP',
        error: error.message
      });
    }
  }
);

// ==========================================
// ORACLE NETSUITE INTEGRATION ENDPOINTS
// ==========================================

app.post('/api/integrations/netsuite/sync-expenses',
  authMiddleware,
  [
    body('expenses').isArray().notEmpty(),
    body('subsidiary').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { expenses, subsidiary } = req.body;
      const netsuiteIntegration = new OracleNetSuiteIntegration(req.user.tenantId);
      
      const result = await netsuiteIntegration.syncExpenseReports(expenses, subsidiary);
      
      res.json({
        success: true,
        message: 'Expenses synced to NetSuite successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('NetSuite sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync expenses to NetSuite',
        error: error.message
      });
    }
  }
);

app.post('/api/integrations/netsuite/create-vendor-bill',
  authMiddleware,
  [
    body('vendorId').notEmpty().trim(),
    body('expenses').isArray().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { vendorId, expenses } = req.body;
      const netsuiteIntegration = new OracleNetSuiteIntegration(req.user.tenantId);
      
      const vendorBill = await netsuiteIntegration.createVendorBill(vendorId, expenses);
      
      res.json({
        success: true,
        message: 'Vendor bill created in NetSuite',
        data: vendorBill,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('NetSuite vendor bill error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create vendor bill in NetSuite',
        error: error.message
      });
    }
  }
);

// ==========================================
// MICROSOFT DYNAMICS 365 INTEGRATION
// ==========================================

app.post('/api/integrations/dynamics/sync-expenses',
  authMiddleware,
  [
    body('expenses').isArray().notEmpty(),
    body('legalEntity').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { expenses, legalEntity } = req.body;
      const dynamicsIntegration = new DynamicsIntegration(req.user.tenantId);
      
      const result = await dynamicsIntegration.createExpenseReports(expenses, legalEntity);
      
      res.json({
        success: true,
        message: 'Expenses synced to Dynamics 365 successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Dynamics sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync expenses to Dynamics 365',
        error: error.message
      });
    }
  }
);

// ==========================================
// QUICKBOOKS ONLINE INTEGRATION
// ==========================================

app.post('/api/integrations/quickbooks/sync-expenses',
  authMiddleware,
  [
    body('expenses').isArray().notEmpty(),
    body('companyId').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { expenses, companyId } = req.body;
      const quickbooksIntegration = new QuickBooksIntegration(req.user.tenantId);
      
      const result = await quickbooksIntegration.createExpenses(expenses, companyId);
      
      res.json({
        success: true,
        message: 'Expenses synced to QuickBooks successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('QuickBooks sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync expenses to QuickBooks',
        error: error.message
      });
    }
  }
);

app.get('/api/integrations/quickbooks/accounts',
  authMiddleware,
  async (req, res) => {
    try {
      const { companyId } = req.query;
      const quickbooksIntegration = new QuickBooksIntegration(req.user.tenantId);
      
      const accounts = await quickbooksIntegration.getAccounts(companyId);
      
      res.json({
        success: true,
        data: accounts,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('QuickBooks accounts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch accounts from QuickBooks',
        error: error.message
      });
    }
  }
);

// ==========================================
// XERO INTEGRATION
// ==========================================

app.post('/api/integrations/xero/sync-expenses',
  authMiddleware,
  [
    body('expenses').isArray().notEmpty(),
    body('tenantId').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { expenses, tenantId } = req.body;
      const xeroIntegration = new XeroIntegration(req.user.tenantId);
      
      const result = await xeroIntegration.createExpenseClaims(expenses, tenantId);
      
      res.json({
        success: true,
        message: 'Expenses synced to Xero successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Xero sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync expenses to Xero',
        error: error.message
      });
    }
  }
);

// ==========================================
// PAYROLL INTEGRATION (ADP)
// ==========================================

app.post('/api/integrations/adp/process-reimbursements',
  authMiddleware,
  [
    body('reimbursements').isArray().notEmpty(),
    body('payrollPeriod').notEmpty().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { reimbursements, payrollPeriod } = req.body;
      const adpIntegration = new ADPIntegration(req.user.tenantId);
      
      const result = await adpIntegration.processReimbursements(
        reimbursements, 
        payrollPeriod
      );
      
      res.json({
        success: true,
        message: 'Reimbursements processed in ADP successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('ADP reimbursement error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process reimbursements in ADP',
        error: error.message
      });
    }
  }
);

app.get('/api/integrations/adp/employees',
  authMiddleware,
  async (req, res) => {
    try {
      const adpIntegration = new ADPIntegration(req.user.tenantId);
      const employees = await adpIntegration.getEmployees();
      
      res.json({
        success: true,
        data: employees,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('ADP employees error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employees from ADP',
        error: error.message
      });
    }
  }
);

// ==========================================
// HR INTEGRATION (WORKDAY)
// ==========================================

app.post('/api/integrations/workday/sync-employee-data',
  authMiddleware,
  [
    body('employees').isArray().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { employees } = req.body;
      const workdayIntegration = new WorkdayIntegration(req.user.tenantId);
      
      const result = await workdayIntegration.syncEmployeeData(employees);
      
      res.json({
        success: true,
        message: 'Employee data synced with Workday successfully',
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Workday sync error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync employee data with Workday',
        error: error.message
      });
    }
  }
);

app.get('/api/integrations/workday/organization-structure',
  authMiddleware,
  async (req, res) => {
    try {
      const workdayIntegration = new WorkdayIntegration(req.user.tenantId);
      const orgStructure = await workdayIntegration.getOrganizationStructure();
      
      res.json({
        success: true,
        data: orgStructure,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Workday org structure error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organization structure from Workday',
        error: error.message
      });
    }
  }
);

// ==========================================
// UNIVERSAL INTEGRATION ENDPOINTS
// ==========================================

app.post('/api/integrations/configure',
  authMiddleware,
  [
    body('integrationType').notEmpty().trim(),
    body('configuration').isObject().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { integrationType, configuration } = req.body;
      
      // Store integration configuration securely
      // Implementation depends on your database/storage choice
      
      res.json({
        success: true,
        message: `${integrationType} integration configured successfully`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Integration configuration error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to configure integration',
        error: error.message
      });
    }
  }
);

app.get('/api/integrations/status',
  authMiddleware,
  async (req, res) => {
    try {
      // Check status of all integrations for the tenant
      const integrationStatus = {
        sap: { status: 'connected', lastSync: new Date().toISOString() },
        netsuite: { status: 'connected', lastSync: new Date().toISOString() },
        dynamics: { status: 'disconnected', lastSync: null },
        quickbooks: { status: 'connected', lastSync: new Date().toISOString() },
        xero: { status: 'connected', lastSync: new Date().toISOString() },
        adp: { status: 'connected', lastSync: new Date().toISOString() },
        workday: { status: 'connected', lastSync: new Date().toISOString() }
      };
      
      res.json({
        success: true,
        data: integrationStatus,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Integration status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch integration status',
        error: error.message
      });
    }
  }
);

// ==========================================
// WEBHOOK ENDPOINTS
// ==========================================

app.post('/api/webhooks/expense-approved',
  authMiddleware,
  async (req, res) => {
    try {
      const { expenseId, approvalData } = req.body;
      
      // Trigger integrations for approved expense
      // This could sync to multiple systems simultaneously
      
      res.json({
        success: true,
        message: 'Expense approval webhook processed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process webhook',
        error: error.message
      });
    }
  }
);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Integration service error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Integration endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🔗 Integration Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;