import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  CircularProgress,
  Backdrop,
} from '@mui/material';
import {
  TrendingUp,
  Assessment,
  AccountBalance,
  Receipt,
  PendingActions,
  CheckCircle,
  Cancel,
  Warning,
  Add,
  Search,
  FilterList,
  GetApp,
  Analytics,
  AutoAwesome,
  Visibility,
  Edit,
  Schedule,
  CameraAlt,
  SmartToy,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [openSubmitDialog, setOpenSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quickExpenseData, setQuickExpenseData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard statistics
      const [statsResponse, expensesResponse, analyticsResponse] = await Promise.all([
        apiClient.get('/api/dashboard/stats'),
        apiClient.get('/api/expenses/recent?limit=10'),
        apiClient.get('/api/dashboard/analytics')
      ]);

      setDashboardData({
        stats: statsResponse.data,
        recentExpenses: expensesResponse.data.expenses || [],
        monthlyTrends: analyticsResponse.data.monthlyTrends || [],
        categoryBreakdown: analyticsResponse.data.categoryBreakdown || [],
        aiInsights: analyticsResponse.data.aiInsights || [],
        approvalWorkflow: analyticsResponse.data.approvalWorkflow || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fall back to mock data if API fails
      setDashboardData(getMockDashboardData());
    } finally {
      setLoading(false);
    }
  };

  const getMockDashboardData = () => ({
    stats: {
      totalExpenses: 12450.75,
      pendingApprovals: 8,
      thisMonth: 3280.50,
      approved: 42,
      rejected: 3,
      avgProcessingTime: '2.5 days',
      complianceScore: 94,
      savings: 1200.25
    },
    recentExpenses: [
      {
        id: 'EXP-001',
        description: 'Business Lunch - Client Meeting',
        amount: 125.50,
        currency: 'USD',
        category: 'Meals',
        date: '2025-10-03',
        status: 'pending',
        submittedBy: 'John Doe',
        approver: 'Sarah Connor',
        receipt: true,
        ocrProcessed: true,
        confidence: 96
      },
      {
        id: 'EXP-002',
        description: 'Hotel Stay - Boston Conference',
        amount: 450.00,
        currency: 'USD',
        category: 'Accommodation',
        date: '2025-10-02',
        status: 'approved',
        submittedBy: 'Jane Smith',
        approver: 'Mike Johnson',
        receipt: true,
        ocrProcessed: true,
        confidence: 98
      },
      {
        id: 'EXP-003',
        description: 'Taxi to Airport',
        amount: 45.75,
        currency: 'USD',
        category: 'Transportation',
        date: '2025-10-01',
        status: 'processing',
        submittedBy: 'Bob Wilson',
        approver: 'Sarah Connor',
        receipt: true,
        ocrProcessed: false,
        confidence: null
      },
      {
        id: 'EXP-004',
        description: 'Office Supplies',
        amount: 89.25,
        currency: 'USD',
        category: 'Office',
        date: '2025-09-30',
        status: 'flagged',
        submittedBy: 'Alice Brown',
        approver: 'Mike Johnson',
        receipt: false,
        ocrProcessed: false,
        confidence: null,
        flagReason: 'Duplicate vendor pattern detected'
      },
    ],
    monthlyTrends: [
      { month: 'Jun', amount: 2400, approved: 38, pending: 5 },
      { month: 'Jul', amount: 2800, approved: 42, pending: 3 },
      { month: 'Aug', amount: 3200, approved: 48, pending: 7 },
      { month: 'Sep', amount: 2950, approved: 45, pending: 4 },
      { month: 'Oct', amount: 3280, approved: 42, pending: 8 },
    ],
    categoryBreakdown: [
      { name: 'Travel', value: 45, amount: 5620.75, color: '#8884d8' },
      { name: 'Meals', value: 25, amount: 3125.50, color: '#82ca9d' },
      { name: 'Office', value: 15, amount: 1875.25, color: '#ffc658' },
      { name: 'Equipment', value: 10, amount: 1250.00, color: '#ff7300' },
      { name: 'Other', value: 5, amount: 625.25, color: '#00ff00' },
    ],
    aiInsights: [
      {
        type: 'anomaly',
        title: 'Unusual Spending Pattern Detected',
        description: 'Travel expenses increased 35% compared to last month',
        action: 'Review travel policy compliance',
        severity: 'medium'
      },
      {
        type: 'optimization',
        title: 'Cost Saving Opportunity',
        description: 'Switch to preferred hotel chain could save $200/month',
        action: 'Update travel guidelines',
        severity: 'low'
      },
      {
        type: 'compliance',
        title: 'Missing Receipts',
        description: '3 expenses over $50 without receipts',
        action: 'Follow up with employees',
        severity: 'high'
      }
    ],
    approvalWorkflow: [
      { step: 'Manager Review', completed: 65, pending: 8, avgTime: '1.2 days' },
      { step: 'Finance Review', completed: 58, pending: 7, avgTime: '0.8 days' },
      { step: 'Director Approval', completed: 55, pending: 3, avgTime: '0.5 days' },
    ]
  });

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

  const handleQuickSubmit = async () => {
    try {
      setSubmitting(true);
      const expenseData = {
        amount: parseFloat(quickExpenseData.amount),
        category: quickExpenseData.category,
        description: quickExpenseData.description,
        date: quickExpenseData.date,
        currency: 'USD'
      };

      await apiClient.post('/api/expenses/create', expenseData);
      
      // Reset form and close dialog
      setQuickExpenseData({
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setOpenSubmitDialog(false);
      
      // Refresh dashboard data
      fetchDashboardData();
    } catch (error) {
      console.error('Error submitting expense:', error);
      // You could show an error toast here
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={40} />
      </Container>
    );
  }

  // No data state
  if (!dashboardData) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">
          Failed to load dashboard data. Please refresh the page.
        </Alert>
      </Container>
    );
  }

  const stats = [
    {
      title: 'Total Expenses',
      value: `$${dashboardData.stats.totalExpenses.toLocaleString()}`,
      change: '+12%',
      icon: AccountBalance,
      color: 'primary',
      subtitle: 'This quarter'
    },
    {
      title: 'Pending Approvals',
      value: dashboardData.stats.pendingApprovals.toString(),
      change: '-5%',
      icon: PendingActions,
      color: 'warning',
      subtitle: 'Awaiting review'
    },
    {
      title: 'This Month',
      value: `$${dashboardData.stats.thisMonth.toLocaleString()}`,
      change: '+8%',
      icon: TrendingUp,
      color: 'success',
      subtitle: 'Current spending'
    },
    {
      title: 'AI Insights',
      value: dashboardData.aiInsights.length.toString(),
      change: 'NEW',
      icon: SmartToy,
      color: 'info',
      subtitle: 'Smart recommendations'
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.firstName || 'User'}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your expense management hub - {user?.company?.name || 'Enterprise Dashboard'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            startIcon={<CameraAlt />}
            onClick={() => navigate('/create-expense')}
            sx={{ height: 'fit-content' }}
          >
            Quick Scan Receipt
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Add />}
            onClick={() => setOpenSubmitDialog(true)}
            sx={{ height: 'fit-content' }}
          >
            New Expense
          </Button>
        </Box>
      </Box>

      {/* AI Insights Alert */}
      {dashboardData.aiInsights.some(insight => insight.severity === 'high') && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small">
              Review
            </Button>
          }
        >
          <strong>AI Alert:</strong> {dashboardData.aiInsights.find(i => i.severity === 'high')?.description}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette[stat.color].main, 0.1)}, ${alpha(theme.palette[stat.color].main, 0.05)})`,
                border: `1px solid ${alpha(theme.palette[stat.color].main, 0.2)}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.subtitle}
                    </Typography>
                    <Chip
                      label={stat.change}
                      size="small"
                      color={stat.change.startsWith('+') ? 'success' : stat.change === 'NEW' ? 'info' : 'error'}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}.main`,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <stat.icon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Expense Trends Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Expense Trends & Analytics
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" startIcon={<Analytics />}>
                    Detailed Analytics
                  </Button>
                  <IconButton>
                    <GetApp />
                  </IconButton>
                </Box>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke={theme.palette.primary.main} 
                    fill={alpha(theme.palette.primary.main, 0.3)}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Breakdown */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: 400 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expense Categories
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dashboardData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({name, value}) => `${name}: ${value}%`}
                  >
                    {dashboardData.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Expenses Table */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Recent Expenses
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" startIcon={<Search />}>
                    Search
                  </Button>
                  <Button size="small" startIcon={<FilterList />}>
                    Filter
                  </Button>
                  <Button size="small" onClick={() => navigate('/my-expenses')}>
                    View All
                  </Button>
                </Box>
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Expense ID</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>AI/OCR</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.recentExpenses.map((expense) => (
                      <TableRow key={expense.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {expense.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {expense.date}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {expense.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            by {expense.submittedBy}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            ${expense.amount}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {expense.currency}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={expense.category} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(expense.status)}
                            label={expense.status.toUpperCase()}
                            color={getStatusColor(expense.status)}
                            size="small"
                          />
                          {expense.status === 'flagged' && (
                            <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                              {expense.flagReason}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {expense.receipt && <Receipt fontSize="small" color="primary" />}
                            {expense.ocrProcessed && (
                              <Chip
                                label={`${expense.confidence}%`}
                                size="small"
                                color="success"
                                icon={<AutoAwesome />}
                              />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => navigate(`/expense/${expense.id}`)}>
                            <Visibility />
                          </IconButton>
                          <IconButton size="small">
                            <Edit />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Insights & Workflow Status */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={2}>
            {/* AI Insights */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🤖 AI Insights
                  </Typography>
                  <List dense>
                    {dashboardData.aiInsights.map((insight, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32,
                              bgcolor: insight.severity === 'high' ? 'error.main' : 
                                       insight.severity === 'medium' ? 'warning.main' : 'info.main'
                            }}
                          >
                            {insight.type === 'anomaly' ? <Warning /> : 
                             insight.type === 'optimization' ? <TrendingUp /> : <Assessment />}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={insight.title}
                          secondary={insight.description}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 'bold' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Approval Workflow Status */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Approval Workflow
                  </Typography>
                  {dashboardData.approvalWorkflow.map((step, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{step.step}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {step.avgTime} avg
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(step.completed / (step.completed + step.pending)) * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {step.completed} completed, {step.pending} pending
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Quick Expense Submit Dialog */}
      <Dialog open={openSubmitDialog} onClose={() => setOpenSubmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Quick Expense Submission</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={quickExpenseData.amount}
                onChange={(e) => setQuickExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                InputProps={{
                  startAdornment: '$'
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={quickExpenseData.category}
                  label="Category"
                  onChange={(e) => setQuickExpenseData(prev => ({ ...prev, category: e.target.value }))}
                >
                  <MenuItem value="Travel">Travel</MenuItem>
                  <MenuItem value="Meals">Meals</MenuItem>
                  <MenuItem value="Office">Office Supplies</MenuItem>
                  <MenuItem value="Equipment">Equipment</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={quickExpenseData.description}
                onChange={(e) => setQuickExpenseData(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={quickExpenseData.date}
                onChange={(e) => setQuickExpenseData(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSubmitDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleQuickSubmit}
            disabled={submitting || !quickExpenseData.amount || !quickExpenseData.category}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Submitting...' : 'Submit Expense'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;