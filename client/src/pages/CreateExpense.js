import React, { useState, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  useTheme,
  alpha,
  InputAdornment,
  AlertTitle,
} from '@mui/material';
import {
  CloudUpload,
  CameraAlt,
  Receipt,
  AutoAwesome,
  SmartToy,
  Delete,
  Save,
  Send,
  AttachFile,
  PhotoCamera,
  NavigateNext,
  Download,
  LocationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CreateExpense = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [activeStep, setActiveStep] = useState(0);
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [ocrResults, setOcrResults] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  
  const [expenseData, setExpenseData] = useState({
    // Basic Information
    title: '',
    description: '',
    amount: '',
    originalAmount: '',
    currency: 'USD',
    exchangeRate: 1.0,
    convertedAmount: '',
    category: '',
    subcategory: '',
    date: new Date().toISOString().split('T')[0],
    
    // Location & Business Details
    location: '',
    businessPurpose: '',
    projectCode: '',
    clientCode: '',
    
    // Advanced Details
    vendor: '',
    paymentMethod: '',
    receiptNumber: '',
    taxAmount: '',
    tipAmount: '',
    attendees: [],
    tags: [],
    
    // Compliance & Approval
    urgency: 'normal',
    requiresApproval: true,
    approver: '',
    notes: '',
    
    // AI & Automation
    aiVerified: false,
    confidenceScore: 0,
    riskScore: 0,
    complianceScore: 0,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [aiInsights, setAiInsights] = useState([]);

  // Mock data for dropdowns
  const categories = [
    { value: 'Travel', subcategories: ['Flights', 'Hotels', 'Ground Transportation', 'Car Rental'] },
    { value: 'Meals', subcategories: ['Client Entertainment', 'Business Meals', 'Conference Meals'] },
    { value: 'Office', subcategories: ['Supplies', 'Equipment', 'Software', 'Subscriptions'] },
    { value: 'Transportation', subcategories: ['Taxi/Uber', 'Public Transit', 'Parking', 'Tolls'] },
    { value: 'Accommodation', subcategories: ['Hotels', 'Airbnb', 'Extended Stay'] },
    { value: 'Conference', subcategories: ['Registration', 'Materials', 'Workshops'] },
    { value: 'Marketing', subcategories: ['Advertising', 'Events', 'Materials', 'Digital Marketing'] },
    { value: 'Equipment', subcategories: ['Hardware', 'Software', 'Maintenance', 'Licenses'] },
  ];

  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr.' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  ];

  const paymentMethods = ['Credit Card', 'Debit Card', 'Cash', 'Bank Transfer', 'Digital Wallet', 'Company Card', 'Personal - Reimbursable'];

  const urgencyLevels = [
    { value: 'low', label: 'Low Priority', color: 'info' },
    { value: 'normal', label: 'Normal', color: 'default' },
    { value: 'high', label: 'High Priority', color: 'warning' },
    { value: 'urgent', label: 'Urgent', color: 'error' },
  ];

  const steps = [
    'Receipt & Amount',
    'Details & Category',
    'Business Information',
    'Review & Submit'
  ];

  // File upload handling
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
      status: 'uploading',
      ocrResults: null
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Simulate OCR processing
    newFiles.forEach(fileObj => {
      processOCR(fileObj);
    });
  };

  // Simulate OCR processing
  const processOCR = async (fileObj) => {
    setIsOCRProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock OCR results
    const mockOCRResults = {
      vendor: 'Starbucks Coffee',
      amount: 12.45,
      date: '2025-10-04',
      category: 'Meals',
      subcategory: 'Business Meals',
      location: 'Seattle, WA',
      receiptNumber: 'R123456789',
      taxAmount: 1.12,
      tipAmount: 2.50,
      paymentMethod: 'Credit Card',
      confidence: 94,
      extractedText: 'STARBUCKS STORE #1234\n123 Main St, Seattle WA\nVenti Latte $5.95\nMuffin $4.50\nTax $1.12\nTip $2.50\nTotal $12.45\nVisa ****1234',
    };

    // Update file status and OCR results
    setUploadedFiles(prev => prev.map(file => 
      file.id === fileObj.id 
        ? { ...file, status: 'processed', ocrResults: mockOCRResults }
        : file
    ));

    // Auto-fill form if this is the first successful OCR
    if (!ocrResults) {
      setOcrResults(mockOCRResults);
      setExpenseData(prev => ({
        ...prev,
        vendor: mockOCRResults.vendor,
        amount: mockOCRResults.amount.toString(),
        originalAmount: mockOCRResults.amount.toString(),
        date: mockOCRResults.date,
        category: mockOCRResults.category,
        subcategory: mockOCRResults.subcategory,
        location: mockOCRResults.location,
        receiptNumber: mockOCRResults.receiptNumber,
        taxAmount: mockOCRResults.taxAmount?.toString() || '',
        tipAmount: mockOCRResults.tipAmount?.toString() || '',
        paymentMethod: mockOCRResults.paymentMethod,
        aiVerified: true,
        confidenceScore: mockOCRResults.confidence,
      }));

      // Generate AI suggestions
      generateAISuggestions(mockOCRResults);
    }
    
    setIsOCRProcessing(false);
  };

  // Generate AI suggestions based on OCR results
  const generateAISuggestions = (ocrData) => {
    const suggestions = [
      {
        type: 'category',
        title: 'Smart Category Suggestion',
        description: `Based on vendor "${ocrData.vendor}", this expense is likely a ${ocrData.category.toLowerCase()} expense.`,
        confidence: 92,
        action: 'Apply',
        severity: 'info'
      },
      {
        type: 'policy',
        title: 'Policy Compliance Check',
        description: 'Amount is within daily meal allowance limits ($15.00).',
        confidence: 100,
        action: 'Verified',
        severity: 'success'
      },
    ];
    
    setAiSuggestions(suggestions);
  };

  // Form validation
  const validateStep = (step) => {
    const errors = {};
    
    switch (step) {
      case 0: // Receipt & Amount
        if (!expenseData.amount) errors.amount = 'Amount is required';
        if (parseFloat(expenseData.amount) <= 0) errors.amount = 'Amount must be greater than 0';
        if (!expenseData.date) errors.date = 'Date is required';
        break;
      case 1: // Details & Category
        if (!expenseData.category) errors.category = 'Category is required';
        if (!expenseData.description) errors.description = 'Description is required';
        if (!expenseData.vendor) errors.vendor = 'Vendor is required';
        break;
      case 2: // Business Information
        if (!expenseData.businessPurpose) errors.businessPurpose = 'Business purpose is required';
        if (!expenseData.location) errors.location = 'Location is required';
        break;
      default:
        // No validation needed for other steps
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (validateStep(2)) {
      try {
        const submissionData = {
          ...expenseData,
          submittedAt: new Date().toISOString(),
          submittedBy: user?.id,
          files: uploadedFiles,
          ocrData: ocrResults,
          aiInsights: aiInsights,
        };

        console.log('Submitting expense:', submissionData);
        
        // Simulate API submission
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Success - navigate to expenses list
        navigate('/my-expenses', { 
          state: { 
            message: 'Expense submitted successfully!',
            expenseId: 'EXP-' + Math.random().toString(36).substr(2, 9).toUpperCase()
          }
        });
        
      } catch (error) {
        console.error('Error submitting expense:', error);
      }
    }
  };

  const renderReceiptUpload = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📸 Receipt Upload & OCR Processing
        </Typography>
        
        {/* Upload Area */}
        <Box
          sx={{
            border: 2,
            borderColor: 'grey.300',
            borderStyle: 'dashed',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: 'background.paper',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            }
          }}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag & drop receipts here or click to upload
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Supports JPG, PNG, PDF up to 10MB • AI-powered OCR extraction
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" startIcon={<AttachFile />}>
              Choose Files
            </Button>
            <Button variant="outlined" startIcon={<CameraAlt />} onClick={() => setShowWebcam(true)}>
              Take Photo
            </Button>
          </Box>
        </Box>

        {/* Processing Indicator */}
        {isOCRProcessing && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="body2" color="primary">
              🤖 AI is processing your receipt...
            </Typography>
            <LinearProgress sx={{ mt: 1 }} />
          </Box>
        )}

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Uploaded Files:
            </Typography>
            {uploadedFiles.map((fileObj) => (
              <Card key={fileObj.id} variant="outlined" sx={{ mb: 2 }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <Receipt />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {fileObj.file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      {fileObj.status === 'uploading' && <CircularProgress size={20} />}
                      {fileObj.status === 'processed' && (
                        <Chip
                          icon={<AutoAwesome />}
                          label={`OCR: ${fileObj.ocrResults?.confidence}%`}
                          color="success"
                          size="small"
                        />
                      )}
                    </Box>
                    <IconButton size="small" onClick={() => {
                      setUploadedFiles(prev => prev.filter(f => f.id !== fileObj.id));
                    }}>
                      <Delete />
                    </IconButton>
                  </Box>
                  
                  {fileObj.ocrResults && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="caption" fontWeight="bold" color="success.main">
                        ✨ AI EXTRACTED DATA:
                      </Typography>
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Vendor:</Typography>
                          <Typography variant="body2">{fileObj.ocrResults.vendor}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Amount:</Typography>
                          <Typography variant="body2">${fileObj.ocrResults.amount}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Date:</Typography>
                          <Typography variant="body2">{fileObj.ocrResults.date}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">Category:</Typography>
                          <Typography variant="body2">{fileObj.ocrResults.category}</Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* OCR Results Summary */}
        {ocrResults && (
          <Alert 
            severity="success" 
            sx={{ mt: 3 }}
            icon={<SmartToy />}
            action={
              <Button color="inherit" size="small" onClick={() => {
                // Auto-fill form with OCR data
                setExpenseData(prev => ({
                  ...prev,
                  ...ocrResults,
                  amount: ocrResults.amount.toString(),
                  originalAmount: ocrResults.amount.toString(),
                }));
              }}>
                Auto-Fill Form
              </Button>
            }
          >
            <AlertTitle>🎉 AI Successfully Processed Receipt!</AlertTitle>
            Extracted data with {ocrResults.confidence}% confidence. Review the auto-filled information below.
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderAmountDetails = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          💰 Amount & Currency Details
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={expenseData.amount}
              onChange={(e) => setExpenseData(prev => ({ 
                ...prev, 
                amount: e.target.value,
                originalAmount: e.target.value 
              }))}
              error={!!validationErrors.amount}
              helperText={validationErrors.amount}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Currency</InputLabel>
              <Select
                value={expenseData.currency}
                label="Currency"
                onChange={(e) => setExpenseData(prev => ({ ...prev, currency: e.target.value }))}
              >
                {currencies.map((currency) => (
                  <MenuItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={expenseData.date}
              onChange={(e) => setExpenseData(prev => ({ ...prev, date: e.target.value }))}
              error={!!validationErrors.date}
              helperText={validationErrors.date}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={expenseData.paymentMethod}
                label="Payment Method"
                onChange={(e) => setExpenseData(prev => ({ ...prev, paymentMethod: e.target.value }))}
              >
                {paymentMethods.map((method) => (
                  <MenuItem key={method} value={method}>
                    {method}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderDetailsAndCategory = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📝 Expense Details
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!validationErrors.category}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={expenseData.category}
                    label="Category"
                    onChange={(e) => {
                      setExpenseData(prev => ({ 
                        ...prev, 
                        category: e.target.value,
                        subcategory: ''
                      }));
                    }}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat.value} value={cat.value}>
                        {cat.value}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!expenseData.category}>
                  <InputLabel>Subcategory</InputLabel>
                  <Select
                    value={expenseData.subcategory}
                    label="Subcategory"
                    onChange={(e) => setExpenseData(prev => ({ ...prev, subcategory: e.target.value }))}
                  >
                    {expenseData.category && 
                      categories.find(cat => cat.value === expenseData.category)?.subcategories.map((subcat) => (
                        <MenuItem key={subcat} value={subcat}>
                          {subcat}
                        </MenuItem>
                      ))
                    }
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Expense Title"
                  value={expenseData.title}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Business lunch with client"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={expenseData.description}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                  error={!!validationErrors.description}
                  helperText={validationErrors.description || 'Detailed description of the expense'}
                  placeholder="Provide a detailed description of the expense and its business purpose"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Vendor/Merchant"
                  value={expenseData.vendor}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, vendor: e.target.value }))}
                  error={!!validationErrors.vendor}
                  helperText={validationErrors.vendor}
                  placeholder="e.g., Starbucks, Delta Airlines"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Urgency Level</InputLabel>
                  <Select
                    value={expenseData.urgency}
                    label="Urgency Level"
                    onChange={(e) => setExpenseData(prev => ({ ...prev, urgency: e.target.value }))}
                  >
                    {urgencyLevels.map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        <Chip label={level.label} color={level.color} size="small" sx={{ mr: 1 }} />
                        {level.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🤖 AI Suggestions
              </Typography>
              {aiSuggestions.map((suggestion, index) => (
                <Alert
                  key={index}
                  severity={suggestion.severity}
                  sx={{ mb: 2 }}
                  action={
                    <Button color="inherit" size="small">
                      {suggestion.action}
                    </Button>
                  }
                >
                  <Typography variant="body2" fontWeight="bold">
                    {suggestion.title}
                  </Typography>
                  <Typography variant="caption">
                    {suggestion.description}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={suggestion.confidence}
                    sx={{ mt: 1 }}
                    color={suggestion.severity}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {suggestion.confidence}% confidence
                  </Typography>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}
      </Grid>
    </Grid>
  );

  const renderBusinessInformation = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🏢 Business Information
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Business Purpose"
              multiline
              rows={3}
              value={expenseData.businessPurpose}
              onChange={(e) => setExpenseData(prev => ({ ...prev, businessPurpose: e.target.value }))}
              error={!!validationErrors.businessPurpose}
              helperText={validationErrors.businessPurpose || 'Explain how this expense relates to business activities'}
              placeholder="e.g., Client meeting to discuss Q4 partnership opportunities"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Location"
              value={expenseData.location}
              onChange={(e) => setExpenseData(prev => ({ ...prev, location: e.target.value }))}
              error={!!validationErrors.location}
              helperText={validationErrors.location}
              placeholder="e.g., Seattle, WA"
              InputProps={{
                startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Project Code (Optional)"
              value={expenseData.projectCode}
              onChange={(e) => setExpenseData(prev => ({ ...prev, projectCode: e.target.value }))}
              placeholder="e.g., PROJ-2025-001"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Additional Notes"
              multiline
              rows={2}
              value={expenseData.notes}
              onChange={(e) => setExpenseData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional information or special instructions..."
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderReviewSubmit = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Review Your Expense
            </Typography>
            
            {/* Expense Summary */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    💰 Financial Details
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Amount:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ${expenseData.amount} {expenseData.currency}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Category:</Typography>
                    <Typography variant="body2">{expenseData.category} - {expenseData.subcategory}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Date:</Typography>
                    <Typography variant="body2">{expenseData.date}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    🏢 Business Details
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Vendor:</Typography>
                    <Typography variant="body2">{expenseData.vendor}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Location:</Typography>
                    <Typography variant="body2">{expenseData.location}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Description:
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {expenseData.description}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Business Purpose:
                  </Typography>
                  <Typography variant="body2">
                    {expenseData.businessPurpose}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              ⚡ Submission Options
            </Typography>
            
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<Send />}
              onClick={handleSubmit}
              sx={{ mt: 2 }}
            >
              Submit Expense
            </Button>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<Save />}
              sx={{ mt: 2 }}
            >
              Save as Draft
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              {renderReceiptUpload()}
            </Grid>
            <Grid item xs={12} lg={6}>
              {renderAmountDetails()}
            </Grid>
          </Grid>
        );
      case 1:
        return renderDetailsAndCategory();
      case 2:
        return renderBusinessInformation();
      case 3:
        return renderReviewSubmit();
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Create New Expense 📝
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Submit your expense with AI-powered OCR and smart validation
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => navigate('/my-expenses')}
        >
          Cancel
        </Button>
      </Box>

      {/* Progress Stepper */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Box sx={{ mb: 4 }}>
        {getStepContent(activeStep)}
      </Box>

      {/* Navigation Buttons */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<NavigateNext sx={{ transform: 'rotate(180deg)' }} />}
            >
              Back
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<Save />}>
                Save Draft
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleSubmit}
                  size="large"
                >
                  Submit Expense
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<NavigateNext />}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Webcam Dialog */}
      <Dialog open={showWebcam} onClose={() => setShowWebcam(false)} maxWidth="md" fullWidth>
        <DialogTitle>📸 Capture Receipt</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Position your receipt in the camera view and click capture
            </Typography>
            {/* Webcam component would go here */}
            <Box
              sx={{
                width: '100%',
                height: 300,
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 1,
                borderColor: 'grey.300',
                borderRadius: 1
              }}
            >
              <CameraAlt sx={{ fontSize: 64, color: 'grey.400' }} />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWebcam(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<PhotoCamera />}>
            Capture
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CreateExpense;