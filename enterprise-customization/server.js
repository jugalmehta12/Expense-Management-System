const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// Services
const WorkflowEngine = require('./services/WorkflowEngine');
const BusinessRulesEngine = require('./services/BusinessRulesEngine');
const BrandingService = require('./services/BrandingService');
const CustomFieldsService = require('./services/CustomFieldsService');
const ReportingService = require('./services/ReportingService');
const PolicyEngine = require('./services/PolicyEngine');

// Middleware
const authMiddleware = require('./middleware/auth');
const tenantMiddleware = require('./middleware/tenant');
const adminMiddleware = require('./middleware/admin');

const app = express();
const PORT = process.env.PORT || 3002;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and certain file types
    const allowedTypes = /jpeg|jpg|png|gif|svg|pdf|ico/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(authMiddleware);
app.use(tenantMiddleware);

// ==========================================
// WORKFLOW CUSTOMIZATION ENDPOINTS
// ==========================================

app.post('/api/customization/workflows/create',
  adminMiddleware,
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('steps').isArray().notEmpty(),
    body('conditions').optional().isArray(),
    body('triggerType').isIn(['expense_submitted', 'amount_threshold', 'category_based', 'manual'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, steps, conditions, triggerType } = req.body;
      const tenantId = req.tenant.id;

      const workflowEngine = new WorkflowEngine(tenantId);
      const workflow = await workflowEngine.createWorkflow({
        name,
        description,
        steps,
        conditions,
        triggerType,
        createdBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Custom workflow created successfully',
        data: workflow,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Workflow creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create custom workflow',
        error: error.message
      });
    }
  }
);

app.put('/api/customization/workflows/:workflowId',
  adminMiddleware,
  [
    body('name').optional().notEmpty().trim(),
    body('description').optional().trim(),
    body('steps').optional().isArray(),
    body('conditions').optional().isArray(),
    body('isActive').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { workflowId } = req.params;
      const updateData = req.body;
      const tenantId = req.tenant.id;

      const workflowEngine = new WorkflowEngine(tenantId);
      const updatedWorkflow = await workflowEngine.updateWorkflow(workflowId, updateData);

      res.json({
        success: true,
        message: 'Workflow updated successfully',
        data: updatedWorkflow,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Workflow update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update workflow',
        error: error.message
      });
    }
  }
);

app.get('/api/customization/workflows',
  adminMiddleware,
  async (req, res) => {
    try {
      const tenantId = req.tenant.id;
      const { page = 1, limit = 10, isActive } = req.query;

      const workflowEngine = new WorkflowEngine(tenantId);
      const workflows = await workflowEngine.getWorkflows({
        page: parseInt(page),
        limit: parseInt(limit),
        isActive: isActive ? JSON.parse(isActive) : undefined
      });

      res.json({
        success: true,
        data: workflows,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Workflows fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch workflows',
        error: error.message
      });
    }
  }
);

app.post('/api/customization/workflows/:workflowId/test',
  adminMiddleware,
  [
    body('testData').isObject().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { workflowId } = req.params;
      const { testData } = req.body;
      const tenantId = req.tenant.id;

      const workflowEngine = new WorkflowEngine(tenantId);
      const testResult = await workflowEngine.testWorkflow(workflowId, testData);

      res.json({
        success: true,
        message: 'Workflow test completed',
        data: testResult,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Workflow test error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test workflow',
        error: error.message
      });
    }
  }
);

// ==========================================
// BUSINESS RULES ENGINE ENDPOINTS
// ==========================================

app.post('/api/customization/business-rules/create',
  adminMiddleware,
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('conditions').isArray().notEmpty(),
    body('actions').isArray().notEmpty(),
    body('priority').isInt({ min: 1, max: 100 }).optional(),
    body('isActive').isBoolean().optional()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const ruleData = req.body;
      const tenantId = req.tenant.id;

      const rulesEngine = new BusinessRulesEngine(tenantId);
      const rule = await rulesEngine.createRule({
        ...ruleData,
        tenantId,
        createdBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Business rule created successfully',
        data: rule,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Business rule creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create business rule',
        error: error.message
      });
    }
  }
);

app.post('/api/customization/business-rules/:ruleId/evaluate',
  [
    body('expenseData').isObject().notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { ruleId } = req.params;
      const { expenseData } = req.body;
      const tenantId = req.tenant.id;

      const rulesEngine = new BusinessRulesEngine(tenantId);
      const evaluation = await rulesEngine.evaluateRule(ruleId, expenseData);

      res.json({
        success: true,
        data: evaluation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Rule evaluation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to evaluate business rule',
        error: error.message
      });
    }
  }
);

app.get('/api/customization/business-rules',
  adminMiddleware,
  async (req, res) => {
    try {
      const tenantId = req.tenant.id;
      const { category, isActive } = req.query;

      const rulesEngine = new BusinessRulesEngine(tenantId);
      const rules = await rulesEngine.getRules({
        category,
        isActive: isActive ? JSON.parse(isActive) : undefined
      });

      res.json({
        success: true,
        data: rules,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Rules fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch business rules',
        error: error.message
      });
    }
  }
);

// ==========================================
// BRANDING & WHITE-LABEL ENDPOINTS
// ==========================================

app.post('/api/customization/branding/upload-logo',
  adminMiddleware,
  upload.single('logo'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No logo file provided'
        });
      }

      const tenantId = req.tenant.id;
      const brandingService = new BrandingService(tenantId);

      // Process image with Sharp
      const processedImage = await sharp(req.file.buffer)
        .resize(200, 200, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .png()
        .toBuffer();

      const logoUrl = await brandingService.uploadLogo(processedImage, req.file.originalname);

      res.json({
        success: true,
        message: 'Logo uploaded successfully',
        data: { logoUrl },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload logo',
        error: error.message
      });
    }
  }
);

app.post('/api/customization/branding/theme',
  adminMiddleware,
  [
    body('primaryColor').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    body('secondaryColor').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    body('accentColor').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
    body('fontFamily').optional().trim(),
    body('borderRadius').optional().isInt({ min: 0, max: 20 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const themeData = req.body;
      const tenantId = req.tenant.id;

      const brandingService = new BrandingService(tenantId);
      const theme = await brandingService.updateTheme(themeData);

      res.json({
        success: true,
        message: 'Theme updated successfully',
        data: theme,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Theme update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update theme',
        error: error.message
      });
    }
  }
);

app.get('/api/customization/branding',
  async (req, res) => {
    try {
      const tenantId = req.tenant.id;
      const brandingService = new BrandingService(tenantId);
      
      const branding = await brandingService.getBrandingSettings();

      res.json({
        success: true,
        data: branding,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Branding fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch branding settings',
        error: error.message
      });
    }
  }
);

app.post('/api/customization/branding/email-templates',
  adminMiddleware,
  [
    body('templateType').isIn(['approval_request', 'expense_approved', 'expense_rejected', 'reminder']),
    body('subject').notEmpty().trim(),
    body('htmlContent').notEmpty().trim(),
    body('textContent').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const templateData = req.body;
      const tenantId = req.tenant.id;

      const brandingService = new BrandingService(tenantId);
      const template = await brandingService.updateEmailTemplate(templateData);

      res.json({
        success: true,
        message: 'Email template updated successfully',
        data: template,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Email template update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update email template',
        error: error.message
      });
    }
  }
);

// ==========================================
// CUSTOM FIELDS ENDPOINTS
// ==========================================

app.post('/api/customization/custom-fields/create',
  adminMiddleware,
  [
    body('name').notEmpty().trim(),
    body('label').notEmpty().trim(),
    body('type').isIn(['text', 'number', 'date', 'dropdown', 'checkbox', 'textarea', 'file']),
    body('isRequired').isBoolean().optional(),
    body('options').optional().isArray(),
    body('validationRules').optional().isObject(),
    body('scope').isIn(['expense', 'user', 'company'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const fieldData = req.body;
      const tenantId = req.tenant.id;

      const customFieldsService = new CustomFieldsService(tenantId);
      const field = await customFieldsService.createField({
        ...fieldData,
        tenantId,
        createdBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Custom field created successfully',
        data: field,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Custom field creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create custom field',
        error: error.message
      });
    }
  }
);

app.get('/api/customization/custom-fields',
  async (req, res) => {
    try {
      const tenantId = req.tenant.id;
      const { scope } = req.query;

      const customFieldsService = new CustomFieldsService(tenantId);
      const fields = await customFieldsService.getFields({ scope });

      res.json({
        success: true,
        data: fields,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Custom fields fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch custom fields',
        error: error.message
      });
    }
  }
);

app.put('/api/customization/custom-fields/:fieldId',
  adminMiddleware,
  async (req, res) => {
    try {
      const { fieldId } = req.params;
      const updateData = req.body;
      const tenantId = req.tenant.id;

      const customFieldsService = new CustomFieldsService(tenantId);
      const updatedField = await customFieldsService.updateField(fieldId, updateData);

      res.json({
        success: true,
        message: 'Custom field updated successfully',
        data: updatedField,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Custom field update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update custom field',
        error: error.message
      });
    }
  }
);

// ==========================================
// CUSTOM REPORTING ENDPOINTS
// ==========================================

app.post('/api/customization/reports/create',
  adminMiddleware,
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('dataSource').isIn(['expenses', 'users', 'approvals', 'analytics']),
    body('fields').isArray().notEmpty(),
    body('filters').optional().isArray(),
    body('groupBy').optional().isArray(),
    body('chartType').optional().isIn(['bar', 'line', 'pie', 'table'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const reportData = req.body;
      const tenantId = req.tenant.id;

      const reportingService = new ReportingService(tenantId);
      const report = await reportingService.createCustomReport({
        ...reportData,
        tenantId,
        createdBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Custom report created successfully',
        data: report,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Custom report creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create custom report',
        error: error.message
      });
    }
  }
);

app.post('/api/customization/reports/:reportId/generate',
  [
    body('parameters').optional().isObject()
  ],
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const { parameters = {} } = req.body;
      const tenantId = req.tenant.id;

      const reportingService = new ReportingService(tenantId);
      const reportData = await reportingService.generateReport(reportId, parameters);

      res.json({
        success: true,
        data: reportData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate report',
        error: error.message
      });
    }
  }
);

app.get('/api/customization/reports',
  async (req, res) => {
    try {
      const tenantId = req.tenant.id;
      const { category } = req.query;

      const reportingService = new ReportingService(tenantId);
      const reports = await reportingService.getCustomReports({ category });

      res.json({
        success: true,
        data: reports,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Reports fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch custom reports',
        error: error.message
      });
    }
  }
);

// ==========================================
// POLICY ENGINE ENDPOINTS
// ==========================================

app.post('/api/customization/policies/create',
  adminMiddleware,
  [
    body('name').notEmpty().trim(),
    body('description').optional().trim(),
    body('rules').isArray().notEmpty(),
    body('violations').isArray().notEmpty(),
    body('enforceLevel').isIn(['warning', 'block', 'review']),
    body('categories').optional().isArray()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const policyData = req.body;
      const tenantId = req.tenant.id;

      const policyEngine = new PolicyEngine(tenantId);
      const policy = await policyEngine.createPolicy({
        ...policyData,
        tenantId,
        createdBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Policy created successfully',
        data: policy,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Policy creation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create policy',
        error: error.message
      });
    }
  }
);

app.post('/api/customization/policies/validate',
  [
    body('expenseData').isObject().notEmpty(),
    body('policyIds').optional().isArray()
  ],
  async (req, res) => {
    try {
      const { expenseData, policyIds } = req.body;
      const tenantId = req.tenant.id;

      const policyEngine = new PolicyEngine(tenantId);
      const violations = await policyEngine.validateExpense(expenseData, policyIds);

      res.json({
        success: true,
        data: violations,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Policy validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate against policies',
        error: error.message
      });
    }
  }
);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      workflow_engine: 'active',
      business_rules: 'active',
      branding: 'active',
      custom_fields: 'active',
      reporting: 'active',
      policy_engine: 'active'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Enterprise customization error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🏢 Enterprise Customization Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎨 Customization API ready for enterprise clients`);
});

module.exports = app;