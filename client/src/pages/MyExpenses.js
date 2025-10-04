import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Alert,
  AlertTitle,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  useTheme,
  alpha,
  Divider,
  Stack,
  Menu,
  Fab,
} from '@mui/material';
import {
  Add,
  Receipt,
  Search,
  FilterList,
  GetApp,
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Schedule,
  PendingActions,
  Warning,
  CloudUpload,
  CameraAlt,
  AttachFile,
  MonetizationOn,
  DateRange,
  Category,
  Person,
  Timeline,
  AutoAwesome,
  SmartToy,
  ExpandMore,
  Comment,
  History,
  TrendingUp,
  Assessment,
  NavigateNext,
  MoreVert,
  Refresh,
  Download,
  Share,
  Flag,
  Info,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MyExpenses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [activeTab, setActiveTab] = useState(0);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Mock expense data - in real implementation, this would come from API
  const [expenses, setExpenses] = useState([
    {
      id: 'EXP-001',
      title: 'Business Lunch - Client Meeting',
      description: 'Lunch meeting with potential client at The Plaza Restaurant to discuss Q4 partnership opportunities',
      amount: 125.50,
      originalAmount: 125.50,
      currency: 'USD',
      exchangeRate: 1.0,
      category: 'Meals',
      subcategory: 'Client Entertainment',
      date: '2025-10-03',
      submittedDate: '2025-10-03T14:30:00Z',
      status: 'pending',
      approvalStage: 'manager',
      approver: 'Sarah Connor',
      approverEmail: 'sarah.connor@company.com',
      receipt: {
        hasReceipt: true,
        filename: 'receipt_plaza_restaurant.jpg',
        ocrProcessed: true,
        ocrConfidence: 96,
        extractedData: {
          vendor: 'The Plaza Restaurant',
          amount: 125.50,
          date: '2025-10-03',
          taxAmount: 11.25,
          tipAmount: 23.00
        }
      },
      location: 'New York, NY',
      attendees: ['John Doe', 'Jane Smith', 'Michael Johnson'],
      businessPurpose: 'Discuss Q4 partnership and contract terms',
      tags: ['client-meeting', 'partnership', 'high-priority'],
      aiFlags: [
        {
          type: 'info',
          message: 'Receipt data matches submitted information',
          confidence: 96
        }
      ],
      comments: [
        {
          author: 'Sarah Connor',
          role: 'Manager',
          date: '2025-10-03T16:00:00Z',
          message: 'Please provide attendee list for this client meeting.',
          type: 'request'
        }
      ],
      timeline: [
        { date: '2025-10-03T14:30:00Z', action: 'Submitted', user: 'John Doe' },
        { date: '2025-10-03T14:35:00Z', action: 'OCR Processed', user: 'System', details: '96% confidence' },
        { date: '2025-10-03T16:00:00Z', action: 'Manager Review', user: 'Sarah Connor', status: 'pending' }
      ],
      estimatedApprovalTime: '1-2 days',
      complianceScore: 95,
      policyViolations: []
    },
    {
      id: 'EXP-002',
      title: 'Hotel Stay - Boston Conference',
      description: 'Accommodation for attending TechCon 2025 conference in Boston',
      amount: 450.00,
      originalAmount: 450.00,
      currency: 'USD',
      exchangeRate: 1.0,
      category: 'Accommodation',
      subcategory: 'Conference Travel',
      date: '2025-10-02',
      submittedDate: '2025-10-02T09:15:00Z',
      status: 'approved',
      approvalStage: 'complete',
      approver: 'Mike Johnson',
      approverEmail: 'mike.johnson@company.com',
      receipt: {
        hasReceipt: true,
        filename: 'hotel_boston_receipt.pdf',
        ocrProcessed: true,
        ocrConfidence: 98,
        extractedData: {
          vendor: 'Boston Harbor Hotel',
          amount: 450.00,
          date: '2025-10-02',
          checkIn: '2025-10-01',
          checkOut: '2025-10-03',
          nights: 2
        }
      },
      location: 'Boston, MA',
      businessPurpose: 'Attend TechCon 2025 conference for professional development',
      tags: ['conference', 'professional-development', 'approved'],
      aiFlags: [
        {
          type: 'success',
          message: 'Hotel rate within company policy limits',
          confidence: 100
        }
      ],
      comments: [
        {
          author: 'Mike Johnson',
          role: 'Finance Manager',
          date: '2025-10-02T11:30:00Z',
          message: 'Approved - within conference travel budget',
          type: 'approval'
        }
      ],
      timeline: [
        { date: '2025-10-02T09:15:00Z', action: 'Submitted', user: 'John Doe' },
        { date: '2025-10-02T09:20:00Z', action: 'OCR Processed', user: 'System', details: '98% confidence' },
        { date: '2025-10-02T10:45:00Z', action: 'Manager Approved', user: 'Sarah Connor' },
        { date: '2025-10-02T11:30:00Z', action: 'Finance Approved', user: 'Mike Johnson' },
        { date: '2025-10-02T11:35:00Z', action: 'Final Approval', user: 'System', status: 'approved' }
      ],
      estimatedApprovalTime: 'Completed',
      complianceScore: 100,
      policyViolations: [],
      reimbursementAmount: 450.00,
      reimbursementDate: '2025-10-05',
      reimbursementStatus: 'processed'
    },
    {
      id: 'EXP-003',
      title: 'Taxi to Airport',
      description: 'Transportation to JFK Airport for business trip',
      amount: 45.75,
      originalAmount: 45.75,
      currency: 'USD',
      exchangeRate: 1.0,
      category: 'Transportation',
      subcategory: 'Ground Transportation',
      date: '2025-10-01',
      submittedDate: '2025-10-01T18:45:00Z',
      status: 'processing',
      approvalStage: 'finance',
      approver: 'Mike Johnson',
      approverEmail: 'mike.johnson@company.com',
      receipt: {
        hasReceipt: true,
        filename: 'taxi_receipt.jpg',
        ocrProcessed: false,
        ocrConfidence: null,
        processingStatus: 'queued'
      },
      location: 'New York, NY',
      businessPurpose: 'Transportation for business trip to client site',
      tags: ['transportation', 'business-trip'],
      aiFlags: [
        {
          type: 'warning',
          message: 'OCR processing in queue - manual review recommended',
          confidence: null
        }
      ],
      comments: [],
      timeline: [
        { date: '2025-10-01T18:45:00Z', action: 'Submitted', user: 'John Doe' },
        { date: '2025-10-01T19:00:00Z', action: 'Manager Approved', user: 'Sarah Connor' },
        { date: '2025-10-01T19:05:00Z', action: 'Finance Review Started', user: 'Mike Johnson', status: 'processing' }
      ],
      estimatedApprovalTime: '1 day',
      complianceScore: 88,
      policyViolations: []
    },
    {
      id: 'EXP-004',
      title: 'Office Supplies',
      description: 'Notebooks and pens for team meeting preparation',
      amount: 89.25,
      originalAmount: 89.25,
      currency: 'USD',
      exchangeRate: 1.0,
      category: 'Office',
      subcategory: 'Supplies',
      date: '2025-09-30',
      submittedDate: '2025-09-30T11:20:00Z',
      status: 'flagged',
      approvalStage: 'ai-review',
      approver: 'AI System',
      receipt: {
        hasReceipt: false,
        filename: null,
        ocrProcessed: false,
        ocrConfidence: null
      },
      location: 'New York, NY',
      businessPurpose: 'Office supplies for team productivity',
      tags: ['office-supplies', 'flagged'],
      aiFlags: [
        {
          type: 'error',
          message: 'Duplicate vendor pattern detected - similar expense submitted 2 days ago',
          confidence: 87
        },
        {
          type: 'warning',
          message: 'No receipt provided for expense over $50',
          confidence: 100
        }
      ],
      comments: [
        {
          author: 'AI System',
          role: 'Fraud Detection',
          date: '2025-09-30T11:25:00Z',
          message: 'This expense has been flagged for review due to duplicate vendor pattern.',
          type: 'system-flag'
        }
      ],
      timeline: [
        { date: '2025-09-30T11:20:00Z', action: 'Submitted', user: 'John Doe' },
        { date: '2025-09-30T11:25:00Z', action: 'AI Flagged', user: 'System', status: 'flagged' }
      ],
      estimatedApprovalTime: 'Requires manual review',
      complianceScore: 45,
      policyViolations: [
        'Missing receipt for expense over $50',
        'Possible duplicate submission'
      ]
    }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'flagged': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      case 'pending': return <Schedule />;
      case 'processing': return <PendingActions />;
      case 'flagged': return <Warning />;
      default: return <Schedule />;
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleViewDetails = (expense) => {
    setSelectedExpense(expense);
    setOpenDetailsDialog(true);
  };

  const ExpenseDetailsDialog = () => (
    <Dialog 
      open={openDetailsDialog} 
      onClose={() => setOpenDetailsDialog(false)} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      {selectedExpense && (
        <>
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6">{selectedExpense.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedExpense.id} • Submitted {new Date(selectedExpense.submittedDate).toLocaleDateString()}
                </Typography>
              </Box>
              <Chip
                icon={getStatusIcon(selectedExpense.status)}
                label={selectedExpense.status.toUpperCase()}
                color={getStatusColor(selectedExpense.status)}
              />
            </Box>
          </DialogTitle>
          
          <DialogContent>
            <Grid container spacing={3}>
              {/* Expense Details */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      💰 Expense Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Amount:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ${selectedExpense.amount} {selectedExpense.currency}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Category:</Typography>
                        <Chip label={selectedExpense.category} size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Date:</Typography>
                        <Typography variant="body2">{selectedExpense.date}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Location:</Typography>
                        <Typography variant="body2">{selectedExpense.location}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Compliance Score:</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={selectedExpense.complianceScore}
                            sx={{ width: 60, height: 6 }}
                            color={selectedExpense.complianceScore > 80 ? 'success' : 
                                   selectedExpense.complianceScore > 60 ? 'warning' : 'error'}
                          />
                          <Typography variant="body2">{selectedExpense.complianceScore}%</Typography>
                        </Box>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Business Purpose:
                    </Typography>
                    <Typography variant="body2">{selectedExpense.businessPurpose}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* AI & OCR Analysis */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🤖 AI Analysis
                    </Typography>
                    
                    {selectedExpense.receipt.hasReceipt && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Receipt color="primary" />
                          <Typography variant="body2" fontWeight="bold">Receipt Analysis</Typography>
                        </Box>
                        {selectedExpense.receipt.ocrProcessed ? (
                          <Alert severity="success" icon={<AutoAwesome />}>
                            <AlertTitle>OCR Processed Successfully</AlertTitle>
                            Confidence: {selectedExpense.receipt.ocrConfidence}%
                          </Alert>
                        ) : (
                          <Alert severity="info">
                            <AlertTitle>OCR Processing</AlertTitle>
                            {selectedExpense.receipt.processingStatus === 'queued' ? 
                              'Receipt processing queued...' : 'Processing receipt...'}
                          </Alert>
                        )}
                      </Box>
                    )}

                    <Typography variant="body2" fontWeight="bold" gutterBottom>
                      AI Insights:
                    </Typography>
                    {selectedExpense.aiFlags.map((flag, index) => (
                      <Alert 
                        key={index} 
                        severity={flag.type} 
                        sx={{ mb: 1 }}
                        icon={flag.type === 'success' ? <CheckCircle /> : 
                              flag.type === 'warning' ? <Warning /> : 
                              flag.type === 'error' ? <Cancel /> : <Info />}
                      >
                        {flag.message}
                        {flag.confidence && (
                          <Typography variant="caption" display="block">
                            Confidence: {flag.confidence}%
                          </Typography>
                        )}
                      </Alert>
                    ))}

                    {selectedExpense.policyViolations.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" fontWeight="bold" color="error" gutterBottom>
                          Policy Violations:
                        </Typography>
                        {selectedExpense.policyViolations.map((violation, index) => (
                          <Typography key={index} variant="body2" color="error" sx={{ ml: 1 }}>
                            • {violation}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Approval Timeline */}
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📋 Approval Timeline
                    </Typography>
                    <Stepper orientation="vertical">
                      {selectedExpense.timeline.map((step, index) => (
                        <Step key={index} active={true} completed={index < selectedExpense.timeline.length - 1}>
                          <StepLabel
                            StepIconComponent={() => (
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                {index + 1}
                              </Avatar>
                            )}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {step.action}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(step.date).toLocaleString()} • {step.user}
                              </Typography>
                              {step.details && (
                                <Typography variant="caption" display="block" color="primary">
                                  {step.details}
                                </Typography>
                              )}
                            </Box>
                          </StepLabel>
                        </Step>
                      ))}
                    </Stepper>
                    
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Estimated completion:</strong> {selectedExpense.estimatedApprovalTime}
                      </Typography>
                      {selectedExpense.status === 'pending' && (
                        <Typography variant="body2" color="text.secondary">
                          <strong>Current approver:</strong> {selectedExpense.approver}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Comments & Communication */}
              {selectedExpense.comments.length > 0 && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        💬 Comments & Communication
                      </Typography>
                      {selectedExpense.comments.map((comment, index) => (
                        <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                {comment.author.charAt(0)}
                              </Avatar>
                              <Typography variant="body2" fontWeight="bold">
                                {comment.author}
                              </Typography>
                              <Chip label={comment.role} size="small" variant="outlined" />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(comment.date).toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography variant="body2">{comment.message}</Typography>
                          <Chip 
                            label={comment.type} 
                            size="small" 
                            sx={{ mt: 1 }}
                            color={comment.type === 'approval' ? 'success' : 
                                   comment.type === 'request' ? 'warning' : 'default'}
                          />
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Receipt Preview */}
              {selectedExpense.receipt.hasReceipt && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          📄 Receipt & Documents
                        </Typography>
                        <Button startIcon={<Download />} size="small">
                          Download
                        </Button>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 2, 
                        p: 2, 
                        bgcolor: 'background.paper', 
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'divider'
                      }}>
                        <Receipt color="primary" sx={{ fontSize: 40 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {selectedExpense.receipt.filename}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Uploaded with expense submission
                          </Typography>
                          {selectedExpense.receipt.ocrProcessed && (
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                icon={<AutoAwesome />}
                                label={`OCR Processed (${selectedExpense.receipt.ocrConfidence}% confidence)`}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            </Box>
                          )}
                        </Box>
                        <Button variant="outlined" startIcon={<Visibility />}>
                          Preview
                        </Button>
                      </Box>

                      {selectedExpense.receipt.extractedData && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            Extracted Information:
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Vendor:</Typography>
                              <Typography variant="body2">{selectedExpense.receipt.extractedData.vendor}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Amount:</Typography>
                              <Typography variant="body2">${selectedExpense.receipt.extractedData.amount}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Date:</Typography>
                              <Typography variant="body2">{selectedExpense.receipt.extractedData.date}</Typography>
                            </Grid>
                            {selectedExpense.receipt.extractedData.taxAmount && (
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Tax:</Typography>
                                <Typography variant="body2">${selectedExpense.receipt.extractedData.taxAmount}</Typography>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpenDetailsDialog(false)}>
              Close
            </Button>
            <Button variant="outlined" startIcon={<Edit />}>
              Edit Expense
            </Button>
            <Button variant="outlined" startIcon={<Comment />}>
              Add Comment
            </Button>
            {selectedExpense.status === 'flagged' && (
              <Button variant="contained" color="warning" startIcon={<Flag />}>
                Request Review
              </Button>
            )}
          </DialogActions>
        </>
      )}
    </Dialog>
  );

  const ExpenseCard = ({ expense }) => (
    <Card 
      sx={{ 
        mb: 2, 
        transition: 'all 0.2s',
        '&:hover': { 
          transform: 'translateY(-2px)', 
          boxShadow: theme.shadows[4] 
        },
        border: expense.status === 'flagged' ? `2px solid ${theme.palette.error.main}` : 'none'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              {expense.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {expense.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Chip label={expense.category} size="small" variant="outlined" />
              {expense.receipt.hasReceipt && (
                <Chip
                  icon={<Receipt />}
                  label={expense.receipt.ocrProcessed ? `OCR: ${expense.receipt.ocrConfidence}%` : 'Receipt'}
                  size="small"
                  color={expense.receipt.ocrProcessed ? 'success' : 'default'}
                />
              )}
              {expense.aiFlags.some(flag => flag.type === 'error') && (
                <Chip
                  icon={<SmartToy />}
                  label="AI Flagged"
                  size="small"
                  color="error"
                />
              )}
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" fontWeight="bold">
              ${expense.amount}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {expense.date}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                icon={getStatusIcon(expense.status)}
                label={expense.status.toUpperCase()}
                color={getStatusColor(expense.status)}
                size="small"
              />
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={expense.complianceScore}
              sx={{ width: 80, height: 4 }}
              color={expense.complianceScore > 80 ? 'success' : 
                     expense.complianceScore > 60 ? 'warning' : 'error'}
            />
            <Typography variant="caption" color="text.secondary">
              {expense.complianceScore}% compliant
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="View Details">
              <IconButton size="small" onClick={() => handleViewDetails(expense)}>
                <Visibility />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small">
                <Edit />
              </IconButton>
            </Tooltip>
            <Tooltip title="More Actions">
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {expense.aiFlags.length > 0 && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="caption" fontWeight="bold" color="text.secondary" gutterBottom>
              AI INSIGHTS:
            </Typography>
            {expense.aiFlags.slice(0, 2).map((flag, index) => (
              <Typography key={index} variant="caption" display="block" color={
                flag.type === 'error' ? 'error.main' : 
                flag.type === 'warning' ? 'warning.main' : 'success.main'
              }>
                • {flag.message}
              </Typography>
            ))}
            {expense.aiFlags.length > 2 && (
              <Typography variant="caption" color="text.secondary">
                +{expense.aiFlags.length - 2} more insights
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            My Expenses 📊
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track, manage, and analyze your expense submissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/create-expense')}
        >
          New Expense
        </Button>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search color="action" />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="processing">Processing</MenuItem>
                  <MenuItem value="flagged">Flagged</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  <MenuItem value="Travel">Travel</MenuItem>
                  <MenuItem value="Meals">Meals</MenuItem>
                  <MenuItem value="Accommodation">Accommodation</MenuItem>
                  <MenuItem value="Transportation">Transportation</MenuItem>
                  <MenuItem value="Office">Office</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={dateFilter}
                  label="Date Range"
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="quarter">This Quarter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button startIcon={<GetApp />} variant="outlined" size="small">
                  Export
                </Button>
                <IconButton>
                  <Refresh />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Expense Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                ${expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Expenses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">
                {expenses.filter(exp => exp.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Approval
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {expenses.filter(exp => exp.status === 'approved').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">
                {expenses.filter(exp => exp.status === 'flagged').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Flagged/Issues
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Expenses List */}
      <Box>
        {filteredExpenses.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Receipt sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No expenses found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Try adjusting your filters or search terms'
                  : 'Start by creating your first expense submission'
                }
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/create-expense')}
              >
                Create First Expense
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {filteredExpenses.map((expense) => (
              <Grid item xs={12} lg={6} key={expense.id}>
                <ExpenseCard expense={expense} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => navigate('/create-expense')}
      >
        <Add />
      </Fab>

      {/* Expense Details Dialog */}
      <ExpenseDetailsDialog />
    </Container>
  );
};

export default MyExpenses;