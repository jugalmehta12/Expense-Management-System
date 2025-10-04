import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
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
  useTheme,
  alpha,
  Checkbox,
  Fab,
  Collapse,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  PendingActions,
  Warning,
  Visibility,
  FilterList,
  Search,
  GetApp,
  Refresh,
  Receipt,
  AutoAwesome,
  SmartToy,
  VerifiedUser,
  Group,
  Settings,
  Assignment,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Approvals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [openApprovalDialog, setOpenApprovalDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);
  const [approvalDecision, setApprovalDecision] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [amountFilter, setAmountFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Mock approval data - in real implementation, this would come from API
  const [pendingApprovals, setPendingApprovals] = useState([
    {
      id: 'EXP-001',
      title: 'Business Lunch - Client Meeting',
      description: 'Lunch meeting with potential client at The Plaza Restaurant to discuss Q4 partnership opportunities',
      amount: 125.50,
      currency: 'USD',
      category: 'Meals',
      subcategory: 'Client Entertainment',
      date: '2025-01-03',
      submittedDate: '2025-01-03T14:30:00Z',
      submittedBy: {
        id: 'user-001',
        name: 'John Doe',
        email: 'john.doe@company.com',
        department: 'Sales',
        role: 'Senior Sales Manager',
        avatar: 'JD',
        trustScore: 95,
        historyCount: 47
      },
      status: 'pending_manager',
      currentApprover: 'manager',
      approvalStage: 1,
      totalStages: 3,
      urgency: 'normal',
      location: 'New York, NY',
      businessPurpose: 'Discuss Q4 partnership and contract terms with ABC Corp',
      attendees: ['John Doe', 'Jane Smith', 'Michael Johnson'],
      receipt: {
        hasReceipt: true,
        filename: 'receipt_plaza_restaurant.jpg',
        ocrProcessed: true,
        ocrConfidence: 96,
        extractedData: {
          vendor: 'The Plaza Restaurant',
          amount: 125.50,
          date: '2025-01-03',
          taxAmount: 11.25,
          tipAmount: 23.00
        }
      },
      tags: ['client-meeting', 'partnership', 'high-priority'],
      aiAnalysis: {
        riskScore: 15,
        complianceScore: 95,
        flags: [],
        suggestions: [
          'Amount within policy limits',
          'Receipt verification successful',
          'Business purpose clearly documented'
        ],
        duplicateCheck: false,
        fraudCheck: 'clean',
        policyCompliance: {
          passed: true,
          violations: [],
          warnings: []
        }
      },
      approvalFlow: {
        current: 'manager',
        rules: [
          { stage: 'manager', approver: 'Sarah Connor', status: 'pending', required: true },
          { stage: 'finance', approver: 'Mike Johnson', status: 'waiting', required: true },
          { stage: 'director', approver: 'David Wilson', status: 'waiting', required: false }
        ],
        estimatedCompletion: '2025-01-05T17:00:00Z'
      },
      timeline: [
        { date: '2025-01-03T14:30:00Z', action: 'Submitted', user: 'John Doe' },
        { date: '2025-01-03T14:35:00Z', action: 'OCR Processed', user: 'System', details: '96% confidence' },
        { date: '2025-01-03T14:40:00Z', action: 'AI Analysis Complete', user: 'System', details: 'Low risk, high compliance' },
        { date: '2025-01-03T14:45:00Z', action: 'Sent for Manager Approval', user: 'System' }
      ],
      comments: [],
      relatedExpenses: [],
      companyPolicy: {
        dailyMealLimit: 75,
        clientEntertainmentLimit: 200,
        receiptRequired: true,
        preApprovalRequired: false
      }
    },
    {
      id: 'EXP-002',
      title: 'Conference Registration - TechCon 2025',
      description: 'Registration fee for attending TechCon 2025 technology conference',
      amount: 1250.00,
      currency: 'USD',
      category: 'Conference',
      subcategory: 'Registration',
      date: '2025-01-02',
      submittedDate: '2025-01-02T09:15:00Z',
      submittedBy: {
        id: 'user-002',
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        department: 'Engineering',
        role: 'Senior Developer',
        avatar: 'JS',
        trustScore: 88,
        historyCount: 23
      },
      status: 'pending_finance',
      currentApprover: 'finance',
      approvalStage: 2,
      totalStages: 3,
      urgency: 'high',
      location: 'San Francisco, CA',
      businessPurpose: 'Professional development and networking to stay current with latest technology trends',
      receipt: {
        hasReceipt: true,
        filename: 'techcon_registration.pdf',
        ocrProcessed: true,
        ocrConfidence: 98,
        extractedData: {
          vendor: 'TechCon Events LLC',
          amount: 1250.00,
          date: '2025-01-02',
          eventDate: '2025-02-15',
          description: 'Early Bird Registration - TechCon 2025'
        }
      },
      tags: ['conference', 'professional-development', 'high-value'],
      aiAnalysis: {
        riskScore: 25,
        complianceScore: 90,
        flags: [
          {
            type: 'warning',
            message: 'High-value expense requires finance approval',
            severity: 'medium'
          }
        ],
        suggestions: [
          'Consider budget impact for Q1',
          'Verify training budget allocation',
          'Document learning objectives'
        ],
        duplicateCheck: false,
        fraudCheck: 'clean',
        policyCompliance: {
          passed: true,
          violations: [],
          warnings: ['High-value expense']
        }
      },
      approvalFlow: {
        current: 'finance',
        rules: [
          { stage: 'manager', approver: 'Sarah Connor', status: 'approved', required: true, completedAt: '2025-01-02T11:30:00Z' },
          { stage: 'finance', approver: 'Mike Johnson', status: 'pending', required: true },
          { stage: 'director', approver: 'David Wilson', status: 'waiting', required: true }
        ],
        estimatedCompletion: '2025-01-06T17:00:00Z'
      },
      timeline: [
        { date: '2025-01-02T09:15:00Z', action: 'Submitted', user: 'Jane Smith' },
        { date: '2025-01-02T09:20:00Z', action: 'OCR Processed', user: 'System', details: '98% confidence' },
        { date: '2025-01-02T10:00:00Z', action: 'Manager Approved', user: 'Sarah Connor', comment: 'Professional development approved' },
        { date: '2025-01-02T10:05:00Z', action: 'Sent for Finance Review', user: 'System' }
      ],
      comments: [
        {
          author: 'Sarah Connor',
          role: 'Manager',
          date: '2025-01-02T10:00:00Z',
          message: 'Approved for professional development. Please ensure ROI documentation post-conference.',
          type: 'approval'
        }
      ],
      relatedExpenses: [],
      companyPolicy: {
        trainingBudgetLimit: 2000,
        conferenceBudgetLimit: 1500,
        receiptRequired: true,
        preApprovalRequired: true
      }
    },
    {
      id: 'EXP-003',
      title: 'Office Supplies - Team Productivity',
      description: 'Notebooks, pens, and whiteboards for team collaboration improvements',
      amount: 89.25,
      currency: 'USD',
      category: 'Office',
      subcategory: 'Supplies',
      date: '2024-12-30',
      submittedDate: '2024-12-30T11:20:00Z',
      submittedBy: {
        id: 'user-003',
        name: 'Bob Wilson',
        email: 'bob.wilson@company.com',
        department: 'Operations',
        role: 'Operations Manager',
        avatar: 'BW',
        trustScore: 72,
        historyCount: 12
      },
      status: 'flagged',
      currentApprover: 'manager',
      approvalStage: 1,
      totalStages: 2,
      urgency: 'low',
      location: 'Chicago, IL',
      businessPurpose: 'Improve team productivity and collaboration through better office supplies',
      receipt: {
        hasReceipt: false,
        filename: null,
        ocrProcessed: false,
        ocrConfidence: null
      },
      tags: ['office-supplies', 'team-productivity'],
      aiAnalysis: {
        riskScore: 65,
        complianceScore: 45,
        flags: [
          {
            type: 'error',
            message: 'No receipt provided for expense over $50',
            severity: 'high'
          },
          {
            type: 'warning',
            message: 'Similar expense pattern detected in last 30 days',
            severity: 'medium'
          },
          {
            type: 'info',
            message: 'Employee has lower trust score (72%)',
            severity: 'low'
          }
        ],
        suggestions: [
          'Request receipt before approval',
          'Verify business necessity',
          'Consider setting office supply budget limits'
        ],
        duplicateCheck: true,
        fraudCheck: 'review_required',
        policyCompliance: {
          passed: false,
          violations: ['Missing receipt for expense over $50'],
          warnings: ['Duplicate spending pattern']
        }
      },
      approvalFlow: {
        current: 'manager',
        rules: [
          { stage: 'manager', approver: 'Sarah Connor', status: 'pending', required: true },
          { stage: 'finance', approver: 'Mike Johnson', status: 'waiting', required: false }
        ],
        estimatedCompletion: '2025-01-07T17:00:00Z'
      },
      timeline: [
        { date: '2024-12-30T11:20:00Z', action: 'Submitted', user: 'Bob Wilson' },
        { date: '2024-12-30T11:25:00Z', action: 'AI Flagged', user: 'System', details: 'Multiple compliance issues detected' },
        { date: '2024-12-30T11:30:00Z', action: 'Manual Review Required', user: 'System' }
      ],
      comments: [],
      relatedExpenses: [
        {
          id: 'EXP-087',
          description: 'Office Supplies - Stationery',
          amount: 75.50,
          date: '2024-12-15',
          vendor: 'OfficeMax'
        }
      ],
      companyPolicy: {
        officeSupplyLimit: 100,
        receiptRequired: true,
        monthlySupplyBudget: 200
      }
    },
    {
      id: 'EXP-004',
      title: 'Client Dinner - Strategic Partnership',
      description: 'Dinner with Fortune 500 client to finalize strategic partnership agreement',
      amount: 285.75,
      currency: 'USD',
      category: 'Meals',
      subcategory: 'Client Entertainment',
      date: '2025-01-01',
      submittedDate: '2025-01-01T20:45:00Z',
      submittedBy: {
        id: 'user-004',
        name: 'Alice Brown',
        email: 'alice.brown@company.com',
        department: 'Business Development',
        role: 'VP Business Development',
        avatar: 'AB',
        trustScore: 98,
        historyCount: 156
      },
      status: 'pending_director',
      currentApprover: 'director',
      approvalStage: 3,
      totalStages: 3,
      urgency: 'urgent',
      location: 'Manhattan, NY',
      businessPurpose: 'Finalize $2M strategic partnership agreement with TechGlobal Inc',
      attendees: ['Alice Brown', 'CEO TechGlobal', 'CTO TechGlobal', 'Legal Counsel'],
      receipt: {
        hasReceipt: true,
        filename: 'steakhouse_receipt.jpg',
        ocrProcessed: true,
        ocrConfidence: 99,
        extractedData: {
          vendor: 'The Capital Grille',
          amount: 285.75,
          date: '2025-01-01',
          taxAmount: 25.75,
          tipAmount: 55.00,
          itemCount: 8
        }
      },
      tags: ['strategic-partnership', 'high-value-client', 'urgent'],
      aiAnalysis: {
        riskScore: 35,
        complianceScore: 85,
        flags: [
          {
            type: 'warning',
            message: 'Amount exceeds standard meal allowance',
            severity: 'medium'
          },
          {
            type: 'info',
            message: 'High-trust employee with excellent history',
            severity: 'low'
          }
        ],
        suggestions: [
          'Client entertainment within reasonable limits',
          'Strategic value justifies expense',
          'Document partnership outcomes'
        ],
        duplicateCheck: false,
        fraudCheck: 'clean',
        policyCompliance: {
          passed: true,
          violations: [],
          warnings: ['Exceeds standard meal allowance but within client entertainment limits']
        }
      },
      approvalFlow: {
        current: 'director',
        rules: [
          { stage: 'manager', approver: 'Sarah Connor', status: 'approved', required: true, completedAt: '2025-01-01T22:00:00Z' },
          { stage: 'finance', approver: 'Mike Johnson', status: 'approved', required: true, completedAt: '2025-01-02T09:30:00Z' },
          { stage: 'director', approver: 'David Wilson', status: 'pending', required: true }
        ],
        estimatedCompletion: '2025-01-04T17:00:00Z'
      },
      timeline: [
        { date: '2025-01-01T20:45:00Z', action: 'Submitted', user: 'Alice Brown' },
        { date: '2025-01-01T20:50:00Z', action: 'OCR Processed', user: 'System', details: '99% confidence' },
        { date: '2025-01-01T22:00:00Z', action: 'Manager Approved', user: 'Sarah Connor' },
        { date: '2025-01-02T09:30:00Z', action: 'Finance Approved', user: 'Mike Johnson' },
        { date: '2025-01-02T09:35:00Z', action: 'Sent for Director Approval', user: 'System' }
      ],
      comments: [
        {
          author: 'Sarah Connor',
          role: 'Manager',
          date: '2025-01-01T22:00:00Z',
          message: 'Strategic partnership justifies client entertainment expense. Approved.',
          type: 'approval'
        },
        {
          author: 'Mike Johnson',
          role: 'Finance Manager',
          date: '2025-01-02T09:30:00Z',
          message: 'Within client entertainment budget. ROI from $2M partnership is excellent.',
          type: 'approval'
        }
      ],
      relatedExpenses: [],
      companyPolicy: {
        dailyMealLimit: 75,
        clientEntertainmentLimit: 300,
        receiptRequired: true,
        preApprovalRequired: false
      }
    }
  ]);

  const [approvalStats] = useState({
    pending: 24,
    approved: 156,
    rejected: 8,
    flagged: 3,
    avgProcessingTime: 2.3,
    complianceRate: 94,
    autoApprovalRate: 67,
    totalValue: 45780.25
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_manager':
      case 'pending_finance':
      case 'pending_director':
        return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'flagged': return 'error';
      case 'auto_approved': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_manager':
      case 'pending_finance':
      case 'pending_director':
        return <PendingActions />;
      case 'approved': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      case 'flagged': return <Warning />;
      case 'auto_approved': return <AutoAwesome />;
      default: return <Schedule />;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const handleApprovalDecision = async (decision) => {
    if (!selectedExpense) return;

    try {
      const approvalData = {
        expenseId: selectedExpense.id,
        decision,
        comment: approvalComment,
        approver: user?.id,
        timestamp: new Date().toISOString()
      };

      console.log('Processing approval:', approvalData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update expense status
      setPendingApprovals(prev => prev.map(expense => 
        expense.id === selectedExpense.id 
          ? { 
              ...expense, 
              status: decision === 'approve' ? 'approved' : 'rejected',
              comments: [...expense.comments, {
                author: user?.firstName + ' ' + user?.lastName,
                role: user?.role,
                date: new Date().toISOString(),
                message: approvalComment || `${decision === 'approve' ? 'Approved' : 'Rejected'} by ${user?.role}`,
                type: decision === 'approve' ? 'approval' : 'rejection'
              }]
            }
          : expense
      ));

      setOpenApprovalDialog(false);
      setApprovalComment('');
      setSelectedExpense(null);

    } catch (error) {
      console.error('Error processing approval:', error);
    }
  };

  const handleBulkApproval = async (decision) => {
    try {
      const bulkData = {
        expenseIds: selectedExpenses,
        decision,
        comment: approvalComment,
        approver: user?.id,
        timestamp: new Date().toISOString()
      };

      console.log('Processing bulk approval:', bulkData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update multiple expenses
      setPendingApprovals(prev => prev.map(expense => 
        selectedExpenses.includes(expense.id)
          ? { 
              ...expense, 
              status: decision === 'approve' ? 'approved' : 'rejected',
              comments: [...expense.comments, {
                author: user?.firstName + ' ' + user?.lastName,
                role: user?.role,
                date: new Date().toISOString(),
                message: approvalComment || `Bulk ${decision === 'approve' ? 'approved' : 'rejected'} by ${user?.role}`,
                type: decision === 'approve' ? 'approval' : 'rejection'
              }]
            }
          : expense
      ));

      setOpenBulkDialog(false);
      setApprovalComment('');
      setSelectedExpenses([]);

    } catch (error) {
      console.error('Error processing bulk approval:', error);
    }
  };

  const filteredApprovals = pendingApprovals.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.submittedBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'pending' && expense.status.includes('pending')) ||
                         expense.status === statusFilter;
    
    const matchesAmount = amountFilter === 'all' ||
                         (amountFilter === 'low' && expense.amount <= 100) ||
                         (amountFilter === 'medium' && expense.amount > 100 && expense.amount <= 500) ||
                         (amountFilter === 'high' && expense.amount > 500);
    
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const matchesUrgency = urgencyFilter === 'all' || expense.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesAmount && matchesCategory && matchesUrgency;
  });

  const ExpenseApprovalCard = ({ expense }) => (
    <Card 
      sx={{ 
        mb: 2, 
        transition: 'all 0.2s',
        '&:hover': { 
          transform: 'translateY(-2px)', 
          boxShadow: theme.shadows[4] 
        },
        border: expense.status === 'flagged' ? `2px solid ${theme.palette.error.main}` : 
                selectedExpenses.includes(expense.id) ? `2px solid ${theme.palette.primary.main}` : 'none'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Checkbox
                checked={selectedExpenses.includes(expense.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedExpenses(prev => [...prev, expense.id]);
                  } else {
                    setSelectedExpenses(prev => prev.filter(id => id !== expense.id));
                  }
                }}
              />
              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                {expense.title}
              </Typography>
              <Chip
                icon={getStatusIcon(expense.status)}
                label={expense.status.replace('_', ' ').toUpperCase()}
                color={getStatusColor(expense.status)}
                size="small"
              />
              <Chip
                label={expense.urgency.toUpperCase()}
                color={getUrgencyColor(expense.urgency)}
                size="small"
                variant="outlined"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {expense.description}
            </Typography>

            {/* Submitter Info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                {expense.submittedBy.avatar}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {expense.submittedBy.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {expense.submittedBy.department} • {expense.submittedBy.role}
                </Typography>
              </Box>
              <Chip
                label={`Trust: ${expense.submittedBy.trustScore}%`}
                size="small"
                color={expense.submittedBy.trustScore > 90 ? 'success' : 
                       expense.submittedBy.trustScore > 70 ? 'warning' : 'error'}
                variant="outlined"
              />
            </Box>

            {/* Expense Details */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Amount</Typography>
                <Typography variant="body2" fontWeight="bold">
                  ${expense.amount} {expense.currency}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Category</Typography>
                <Typography variant="body2">
                  {expense.category} - {expense.subcategory}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Date</Typography>
                <Typography variant="body2">{expense.date}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Location</Typography>
                <Typography variant="body2">{expense.location}</Typography>
              </Grid>
            </Grid>

            {/* AI Analysis */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToy color="primary" fontSize="small" />
                <Typography variant="caption">Risk: {expense.aiAnalysis.riskScore}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={expense.aiAnalysis.riskScore}
                  sx={{ width: 60, height: 4 }}
                  color={expense.aiAnalysis.riskScore < 30 ? 'success' : 
                         expense.aiAnalysis.riskScore < 60 ? 'warning' : 'error'}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUser color="primary" fontSize="small" />
                <Typography variant="caption">Compliance: {expense.aiAnalysis.complianceScore}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={expense.aiAnalysis.complianceScore}
                  sx={{ width: 60, height: 4 }}
                  color={expense.aiAnalysis.complianceScore > 80 ? 'success' : 
                         expense.aiAnalysis.complianceScore > 60 ? 'warning' : 'error'}
                />
              </Box>
              {expense.receipt.hasReceipt && (
                <Chip
                  icon={<Receipt />}
                  label={expense.receipt.ocrProcessed ? `OCR: ${expense.receipt.ocrConfidence}%` : 'Receipt'}
                  size="small"
                  color={expense.receipt.ocrProcessed ? 'success' : 'default'}
                  variant="outlined"
                />
              )}
            </Box>

            {/* AI Flags */}
            {expense.aiAnalysis.flags.length > 0 && (
              <Box sx={{ mb: 2 }}>
                {expense.aiAnalysis.flags.slice(0, 2).map((flag, index) => (
                  <Alert
                    key={index}
                    severity={flag.type}
                    size="small"
                    sx={{ mb: 1 }}
                  >
                    {flag.message}
                  </Alert>
                ))}
                {expense.aiAnalysis.flags.length > 2 && (
                  <Typography variant="caption" color="text.secondary">
                    +{expense.aiAnalysis.flags.length - 2} more issues
                  </Typography>
                )}
              </Box>
            )}

            {/* Approval Progress */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Approval Progress ({expense.approvalStage}/{expense.totalStages}):
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(expense.approvalStage / expense.totalStages) * 100}
                sx={{ height: 6, borderRadius: 3 }}
              />
              <Typography variant="caption" color="text.secondary">
                Current: {expense.approvalFlow.current} • 
                ETA: {new Date(expense.approvalFlow.estimatedCompletion).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<CheckCircle />}
              onClick={() => {
                setSelectedExpense(expense);
                setApprovalDecision('approve');
                setOpenApprovalDialog(true);
              }}
              disabled={expense.status === 'approved' || expense.status === 'rejected'}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<Cancel />}
              onClick={() => {
                setSelectedExpense(expense);
                setApprovalDecision('reject');
                setOpenApprovalDialog(true);
              }}
              disabled={expense.status === 'approved' || expense.status === 'rejected'}
            >
              Reject
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Visibility />}
              onClick={() => navigate(`/expense/${expense.id}`)}
            >
              Details
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const ApprovalDialog = () => (
    <Dialog open={openApprovalDialog} onClose={() => setOpenApprovalDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {approvalDecision === 'approve' ? '✅ Approve Expense' : '❌ Reject Expense'}
      </DialogTitle>
      <DialogContent>
        {selectedExpense && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {selectedExpense.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              ${selectedExpense.amount} by {selectedExpense.submittedBy.name}
            </Typography>
            
            {approvalDecision === 'reject' && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Please provide a clear reason for rejection to help the employee understand and resubmit correctly.
              </Alert>
            )}

            <TextField
              fullWidth
              label={approvalDecision === 'approve' ? 'Approval Comments (Optional)' : 'Rejection Reason (Required)'}
              multiline
              rows={4}
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder={
                approvalDecision === 'approve' 
                  ? 'Add any comments or conditions for this approval...'
                  : 'Specify why this expense is being rejected and what needs to be corrected...'
              }
              sx={{ mt: 2 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenApprovalDialog(false)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={approvalDecision === 'approve' ? 'success' : 'error'}
          onClick={() => handleApprovalDecision(approvalDecision)}
          disabled={approvalDecision === 'reject' && !approvalComment.trim()}
        >
          {approvalDecision === 'approve' ? 'Approve Expense' : 'Reject Expense'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  const BulkApprovalDialog = () => (
    <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Bulk Approval Actions</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          Selected {selectedExpenses.length} expenses for bulk action.
        </Typography>
        
        <TextField
          fullWidth
          label="Bulk Action Comments"
          multiline
          rows={3}
          value={approvalComment}
          onChange={(e) => setApprovalComment(e.target.value)}
          placeholder="Add comments for all selected expenses..."
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenBulkDialog(false)}>
          Cancel
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => handleBulkApproval('reject')}
        >
          Bulk Reject
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={() => handleBulkApproval('approve')}
        >
          Bulk Approve
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Expense Approvals ⚡
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review, approve, and manage expense submissions with AI insights
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {selectedExpenses.length > 0 && (
            <Button
              variant="contained"
              startIcon={<Group />}
              onClick={() => setOpenBulkDialog(true)}
            >
              Bulk Actions ({selectedExpenses.length})
            </Button>
          )}
          <Button variant="outlined" startIcon={<Settings />}>
            Approval Settings
          </Button>
        </Box>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" gutterBottom>
                {approvalStats.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Approvals
              </Typography>
              <Typography variant="caption" color="success.main">
                Avg: {approvalStats.avgProcessingTime} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                {approvalStats.approved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved This Month
              </Typography>
              <Typography variant="caption" color="info.main">
                {approvalStats.autoApprovalRate}% auto-approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" gutterBottom>
                {approvalStats.rejected + approvalStats.flagged}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Issues & Rejections
              </Typography>
              <Typography variant="caption" color="primary.main">
                {approvalStats.complianceRate}% compliance rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" gutterBottom>
                ${approvalStats.totalValue.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Value
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
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
                  <MenuItem value="pending_manager">Manager Review</MenuItem>
                  <MenuItem value="pending_finance">Finance Review</MenuItem>
                  <MenuItem value="pending_director">Director Review</MenuItem>
                  <MenuItem value="flagged">Flagged</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Amount</InputLabel>
                <Select
                  value={amountFilter}
                  label="Amount"
                  onChange={(e) => setAmountFilter(e.target.value)}
                >
                  <MenuItem value="all">All Amounts</MenuItem>
                  <MenuItem value="low">Under $100</MenuItem>
                  <MenuItem value="medium">$100 - $500</MenuItem>
                  <MenuItem value="high">Over $500</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Urgency</InputLabel>
                <Select
                  value={urgencyFilter}
                  label="Urgency"
                  onChange={(e) => setUrgencyFilter(e.target.value)}
                >
                  <MenuItem value="all">All Urgency</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<FilterList />}
                  variant="outlined"
                  size="small"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  Advanced
                </Button>
                <Button startIcon={<GetApp />} variant="outlined" size="small">
                  Export
                </Button>
                <IconButton>
                  <Refresh />
                </IconButton>
              </Box>
            </Grid>
          </Grid>

          {/* Advanced Filters */}
          <Collapse in={showAdvancedFilters}>
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
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
                      <MenuItem value="Office">Office</MenuItem>
                      <MenuItem value="Conference">Conference</MenuItem>
                      <MenuItem value="Transportation">Transportation</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Date Range</InputLabel>
                    <Select
                      value={dateRangeFilter}
                      label="Date Range"
                      onChange={(e) => setDateRangeFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Time</MenuItem>
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="week">This Week</MenuItem>
                      <MenuItem value="month">This Month</MenuItem>
                      <MenuItem value="quarter">This Quarter</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Assignee</InputLabel>
                    <Select
                      value={assigneeFilter}
                      label="Assignee"
                      onChange={(e) => setAssigneeFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Assignees</MenuItem>
                      <MenuItem value="me">Assigned to Me</MenuItem>
                      <MenuItem value="team">My Team</MenuItem>
                      <MenuItem value="unassigned">Unassigned</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button variant="outlined" size="small" fullWidth>
                    Clear All Filters
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Approval Items */}
      <Box>
        {filteredApprovals.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Assignment sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No pending approvals
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm || statusFilter !== 'pending' || categoryFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results'
                  : 'All caught up! No expenses waiting for your approval.'
                }
              </Typography>
              <Button variant="outlined" onClick={() => {
                setSearchTerm('');
                setStatusFilter('pending');
                setCategoryFilter('all');
                setUrgencyFilter('all');
              }}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box>
            <Typography variant="h6" gutterBottom>
              {filteredApprovals.length} expenses awaiting approval
            </Typography>
            {filteredApprovals.map((expense) => (
              <ExpenseApprovalCard key={expense.id} expense={expense} />
            ))}
          </Box>
        )}
      </Box>

      {/* Approval Dialog */}
      <ApprovalDialog />

      {/* Bulk Approval Dialog */}
      <BulkApprovalDialog />

      {/* Floating Action Button for Settings */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => navigate('/approval-settings')}
      >
        <Settings />
      </Fab>
    </Container>
  );
};

export default Approvals;