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
  useTheme,
  alpha,
  Divider,
  Stack,
  Menu,
  Fab,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  Checkbox,
  ListItemButton,
  Collapse,
  AppBar,
  Toolbar,
  AvatarGroup,
  ButtonGroup,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Schedule,
  PendingActions,
  Warning,
  Visibility,
  Edit,
  Delete,
  MoreVert,
  FilterList,
  Search,
  GetApp,
  Refresh,
  Comment,
  History,
  TrendingUp,
  Assessment,
  Receipt,
  AutoAwesome,
  SmartToy,
  Person,
  Business,
  MonetizationOn,
  DateRange,
  Category,
  Flag,
  Info,
  Speed,
  Timer,
  Psychology,
  Gavel,
  ThumbUp,
  ThumbDown,
  QuestionMark,
  ExpandLess,
  ExpandMore,
  Group,
  Analytics,
  NotificationImportant,
  Email,
  Phone,
  LocationOn,
  AttachMoney,
  CreditCard,
  LocalAtm,
  AccountBalance,
  BugReport,
  Security,
  VerifiedUser,
  Assignment,
  Build,
  Settings,
  FlashOn,
  AccessTime,
  Notifications,
  TrendingDown,
  Dashboard,
  People,
  PieChart,
  BarChart,
  Timeline,
  ViewList,
  ViewModule,
  CalendarMonth,
  Insights,
  CompareArrows,
  SupervisorAccount,
  ManageAccounts,
  PersonAdd,
  PersonSearch,
  LeaderboardOutlined,
  TrendingUpOutlined,
  FileDownload,
  Print,
  Share,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
  ComposedChart,
} from 'recharts';

const TeamExpenses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [openMemberDialog, setOpenMemberDialog] = useState(false);
  const [openExpenseDialog, setOpenExpenseDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('thisMonth');
  const [viewMode, setViewMode] = useState('overview'); // overview, members, expenses, analytics
  const [sortBy, setSortBy] = useState('amount');
  const [sortOrder, setSortOrder] = useState('desc');

  // Mock team data - in real implementation, this would come from API
  const [teamMembers, setTeamMembers] = useState([
    {
      id: 'user-001',
      name: 'John Doe',
      email: 'john.doe@company.com',
      role: 'Senior Sales Manager',
      department: 'Sales',
      avatar: 'JD',
      trustScore: 95,
      totalExpenses: 24,
      totalAmount: 5420.75,
      pendingAmount: 285.50,
      approvedAmount: 5135.25,
      rejectedAmount: 0,
      avgExpenseAmount: 225.86,
      complianceRate: 98,
      reimbursementPending: 285.50,
      lastExpenseDate: '2025-01-03',
      topCategories: ['Meals', 'Travel', 'Transportation'],
      riskLevel: 'low',
      monthlyTrend: 'up',
      budgetUtilization: 67,
      receiptsCompliance: 96,
      policyViolations: 0,
      employeeLevel: 'senior',
      manager: 'Sarah Connor',
      expenseHistory: [
        { month: 'Sep', amount: 2100 },
        { month: 'Oct', amount: 1800 },
        { month: 'Nov', amount: 2200 },
        { month: 'Dec', amount: 1950 },
        { month: 'Jan', amount: 2420 }
      ]
    },
    {
      id: 'user-002',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      role: 'Senior Developer',
      department: 'Engineering',
      avatar: 'JS',
      trustScore: 88,
      totalExpenses: 18,
      totalAmount: 3240.80,
      pendingAmount: 1250.00,
      approvedAmount: 1990.80,
      rejectedAmount: 0,
      avgExpenseAmount: 180.04,
      complianceRate: 94,
      reimbursementPending: 1250.00,
      lastExpenseDate: '2025-01-02',
      topCategories: ['Conference', 'Office', 'Software'],
      riskLevel: 'low',
      monthlyTrend: 'stable',
      budgetUtilization: 43,
      receiptsCompliance: 89,
      policyViolations: 0,
      employeeLevel: 'senior',
      manager: 'Sarah Connor',
      expenseHistory: [
        { month: 'Sep', amount: 1200 },
        { month: 'Oct', amount: 800 },
        { month: 'Nov', amount: 1100 },
        { month: 'Dec', amount: 900 },
        { month: 'Jan', amount: 1350 }
      ]
    },
    {
      id: 'user-003',
      name: 'Bob Wilson',
      email: 'bob.wilson@company.com',
      role: 'Operations Manager',
      department: 'Operations',
      avatar: 'BW',
      trustScore: 72,
      totalExpenses: 31,
      totalAmount: 2145.60,
      pendingAmount: 89.25,
      approvedAmount: 1856.35,
      rejectedAmount: 200.00,
      avgExpenseAmount: 69.21,
      complianceRate: 78,
      reimbursementPending: 89.25,
      lastExpenseDate: '2024-12-30',
      topCategories: ['Office', 'Transportation', 'Supplies'],
      riskLevel: 'medium',
      monthlyTrend: 'down',
      budgetUtilization: 28,
      receiptsCompliance: 74,
      policyViolations: 3,
      employeeLevel: 'mid',
      manager: 'Sarah Connor',
      expenseHistory: [
        { month: 'Sep', amount: 850 },
        { month: 'Oct', amount: 920 },
        { month: 'Nov', amount: 710 },
        { month: 'Dec', amount: 580 },
        { month: 'Jan', amount: 695 }
      ]
    },
    {
      id: 'user-004',
      name: 'Alice Brown',
      email: 'alice.brown@company.com',
      role: 'VP Business Development',
      department: 'Business Development',
      avatar: 'AB',
      trustScore: 98,
      totalExpenses: 42,
      totalAmount: 8975.25,
      pendingAmount: 285.75,
      approvedAmount: 8689.50,
      rejectedAmount: 0,
      avgExpenseAmount: 213.70,
      complianceRate: 99,
      reimbursementPending: 285.75,
      lastExpenseDate: '2025-01-01',
      topCategories: ['Client Entertainment', 'Travel', 'Meals'],
      riskLevel: 'low',
      monthlyTrend: 'up',
      budgetUtilization: 89,
      receiptsCompliance: 98,
      policyViolations: 0,
      employeeLevel: 'executive',
      manager: 'David Wilson',
      expenseHistory: [
        { month: 'Sep', amount: 3200 },
        { month: 'Oct', amount: 2800 },
        { month: 'Nov', amount: 3100 },
        { month: 'Dec', amount: 2950 },
        { month: 'Jan', amount: 3425 }
      ]
    },
    {
      id: 'user-005',
      name: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      role: 'Finance Manager',
      department: 'Finance',
      avatar: 'MJ',
      trustScore: 92,
      totalExpenses: 15,
      totalAmount: 1820.40,
      pendingAmount: 0,
      approvedAmount: 1820.40,
      rejectedAmount: 0,
      avgExpenseAmount: 121.36,
      complianceRate: 100,
      reimbursementPending: 0,
      lastExpenseDate: '2024-12-28',
      topCategories: ['Professional Services', 'Software', 'Office'],
      riskLevel: 'low',
      monthlyTrend: 'stable',
      budgetUtilization: 24,
      receiptsCompliance: 100,
      policyViolations: 0,
      employeeLevel: 'senior',
      manager: 'David Wilson',
      expenseHistory: [
        { month: 'Sep', amount: 450 },
        { month: 'Oct', amount: 380 },
        { month: 'Nov', amount: 520 },
        { month: 'Dec', amount: 410 },
        { month: 'Jan', amount: 485 }
      ]
    }
  ]);

  const [teamExpenses, setTeamExpenses] = useState([
    {
      id: 'EXP-001',
      title: 'Business Lunch - Client Meeting',
      amount: 125.50,
      currency: 'USD',
      category: 'Meals',
      date: '2025-01-03',
      status: 'pending_manager',
      submittedBy: 'John Doe',
      submitterId: 'user-001',
      urgency: 'normal',
      complianceScore: 95,
      riskScore: 15,
      hasReceipt: true,
      location: 'New York, NY'
    },
    {
      id: 'EXP-002',
      title: 'Conference Registration - TechCon 2025',
      amount: 1250.00,
      currency: 'USD',
      category: 'Conference',
      date: '2025-01-02',
      status: 'pending_finance',
      submittedBy: 'Jane Smith',
      submitterId: 'user-002',
      urgency: 'high',
      complianceScore: 90,
      riskScore: 25,
      hasReceipt: true,
      location: 'San Francisco, CA'
    },
    {
      id: 'EXP-003',
      title: 'Office Supplies - Team Productivity',
      amount: 89.25,
      currency: 'USD',
      category: 'Office',
      date: '2024-12-30',
      status: 'flagged',
      submittedBy: 'Bob Wilson',
      submitterId: 'user-003',
      urgency: 'low',
      complianceScore: 45,
      riskScore: 65,
      hasReceipt: false,
      location: 'Chicago, IL'
    },
    {
      id: 'EXP-004',
      title: 'Client Dinner - Strategic Partnership',
      amount: 285.75,
      currency: 'USD',
      category: 'Meals',
      date: '2025-01-01',
      status: 'pending_director',
      submittedBy: 'Alice Brown',
      submitterId: 'user-004',
      urgency: 'urgent',
      complianceScore: 85,
      riskScore: 35,
      hasReceipt: true,
      location: 'Manhattan, NY'
    }
  ]);

  const [teamStats, setTeamStats] = useState({
    totalMembers: 5,
    totalExpenses: 130,
    totalAmount: 21602.80,
    pendingAmount: 1910.50,
    approvedAmount: 19492.30,
    rejectedAmount: 200.00,
    avgComplianceRate: 91.8,
    avgTrustScore: 89.0,
    monthlyBudget: 25000,
    budgetUtilization: 86.4,
    topSpender: 'Alice Brown',
    riskyCases: 1,
    policViolations: 3,
    reimbursementBacklog: 1625.50
  });

  // Mock chart data
  const expenseTrendData = [
    { month: 'Sep', total: 8800, approved: 8200, pending: 600 },
    { month: 'Oct', total: 7680, approved: 7400, pending: 280 },
    { month: 'Nov', total: 8630, approved: 8100, pending: 530 },
    { month: 'Dec', total: 7790, approved: 7300, pending: 490 },
    { month: 'Jan', total: 9375, approved: 8500, pending: 875 }
  ];

  const categoryData = [
    { name: 'Meals', value: 6200, count: 45, color: '#FF6B6B' },
    { name: 'Travel', value: 4800, count: 28, color: '#4ECDC4' },
    { name: 'Conference', value: 3200, count: 12, color: '#45B7D1' },
    { name: 'Office', value: 2100, count: 38, color: '#96CEB4' },
    { name: 'Transportation', value: 1800, count: 22, color: '#FFEAA7' },
    { name: 'Software', value: 1500, count: 15, color: '#DDA0DD' }
  ];

  const riskDistribution = [
    { name: 'Low Risk', value: 85, color: '#4CAF50' },
    { name: 'Medium Risk', value: 12, color: '#FF9800' },
    { name: 'High Risk', value: 3, color: '#F44336' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_manager':
      case 'pending_finance':
      case 'pending_director':
        return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'flagged': return 'error';
      default: return 'default';
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getTrustScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'warning';
    return 'error';
  };

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMember = memberFilter === 'all' || member.id === memberFilter;
    
    return matchesSearch && matchesMember;
  });

  const filteredExpenses = teamExpenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    const matchesMember = memberFilter === 'all' || expense.submitterId === memberFilter;
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesMember && matchesCategory;
  });

  const MemberCard = ({ member }) => (
    <Card 
      sx={{ 
        mb: 2, 
        transition: 'all 0.2s',
        '&:hover': { 
          transform: 'translateY(-2px)', 
          boxShadow: theme.shadows[4] 
        },
        cursor: 'pointer'
      }}
      onClick={() => {
        setSelectedMember(member);
        setOpenMemberDialog(true);
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2, width: 48, height: 48 }}>
            {member.avatar}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
              {member.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {member.role} • {member.department}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Chip
              label={`Trust: ${member.trustScore}%`}
              color={getTrustScoreColor(member.trustScore)}
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" display="block" color="text.secondary">
              {member.totalExpenses} expenses
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Total Amount</Typography>
            <Typography variant="body2" fontWeight="bold">
              ${member.totalAmount.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Pending</Typography>
            <Typography variant="body2" color="warning.main" fontWeight="bold">
              ${member.pendingAmount.toLocaleString()}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Compliance</Typography>
            <Typography variant="body2" fontWeight="bold">
              {member.complianceRate}%
            </Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Risk Level</Typography>
            <Chip
              label={member.riskLevel.toUpperCase()}
              color={getRiskColor(member.riskLevel)}
              size="small"
            />
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {member.topCategories.slice(0, 3).map((category) => (
            <Chip
              key={category}
              label={category}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Budget Utilization
            </Typography>
            <LinearProgress
              variant="determinate"
              value={member.budgetUtilization}
              sx={{ height: 6, borderRadius: 3 }}
              color={member.budgetUtilization > 80 ? 'warning' : 'primary'}
            />
            <Typography variant="caption" color="text.secondary">
              {member.budgetUtilization}%
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Visibility />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/team/member/${member.id}`);
            }}
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                {expense.title}
              </Typography>
              <Chip
                label={expense.status.replace('_', ' ').toUpperCase()}
                color={getStatusColor(expense.status)}
                size="small"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Submitted by {expense.submittedBy} • {expense.date}
            </Typography>

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
                  {expense.category}
                </Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Location</Typography>
                <Typography variant="body2">{expense.location}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Receipt</Typography>
                <Chip
                  icon={<Receipt />}
                  label={expense.hasReceipt ? 'Available' : 'Missing'}
                  size="small"
                  color={expense.hasReceipt ? 'success' : 'error'}
                  variant="outlined"
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToy color="primary" fontSize="small" />
                <Typography variant="caption">Risk: {expense.riskScore}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={expense.riskScore}
                  sx={{ width: 60, height: 4 }}
                  color={expense.riskScore < 30 ? 'success' : 
                         expense.riskScore < 60 ? 'warning' : 'error'}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VerifiedUser color="primary" fontSize="small" />
                <Typography variant="caption">Compliance: {expense.complianceScore}%</Typography>
                <LinearProgress
                  variant="determinate"
                  value={expense.complianceScore}
                  sx={{ width: 60, height: 4 }}
                  color={expense.complianceScore > 80 ? 'success' : 
                         expense.complianceScore > 60 ? 'warning' : 'error'}
                />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Visibility />}
              onClick={() => navigate(`/expense/${expense.id}`)}
            >
              View
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Edit />}
              onClick={() => navigate(`/approvals`)}
            >
              Approve
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const MemberDetailsDialog = () => (
    <Dialog 
      open={openMemberDialog} 
      onClose={() => setOpenMemberDialog(false)} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>
        {selectedMember && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              {selectedMember.avatar}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedMember.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedMember.role} • {selectedMember.department}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogTitle>
      <DialogContent>
        {selectedMember && (
          <Box>
            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="primary.main">
                      {selectedMember.totalExpenses}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Expenses
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="success.main">
                      ${selectedMember.totalAmount.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color="warning.main">
                      {selectedMember.complianceRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Compliance Rate
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" color={getTrustScoreColor(selectedMember.trustScore) + '.main'}>
                      {selectedMember.trustScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Trust Score
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Monthly Trend Chart */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Expense Trend
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={selectedMember.expenseHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#1976d2" 
                      strokeWidth={2}
                      dot={{ fill: '#1976d2' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Key Metrics
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Average Expense Amount" 
                      secondary={`$${selectedMember.avgExpenseAmount}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Budget Utilization" 
                      secondary={`${selectedMember.budgetUtilization}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Receipts Compliance" 
                      secondary={`${selectedMember.receiptsCompliance}%`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Policy Violations" 
                      secondary={selectedMember.policyViolations}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Top Categories
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedMember.topCategories.map((category, index) => (
                    <Chip
                      key={category}
                      label={`#${index + 1} ${category}`}
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenMemberDialog(false)}>
          Close
        </Button>
        <Button 
          variant="contained" 
          onClick={() => {
            setOpenMemberDialog(false);
            navigate(`/team/member/${selectedMember?.id}`);
          }}
        >
          View Full Profile
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
            Team Expenses 👥
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor and manage your team's expense submissions and spending patterns
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ButtonGroup>
            <Button
              variant={viewMode === 'overview' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('overview')}
              startIcon={<Dashboard />}
            >
              Overview
            </Button>
            <Button
              variant={viewMode === 'members' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('members')}
              startIcon={<People />}
            >
              Members
            </Button>
            <Button
              variant={viewMode === 'expenses' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('expenses')}
              startIcon={<Receipt />}
            >
              Expenses
            </Button>
            <Button
              variant={viewMode === 'analytics' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('analytics')}
              startIcon={<Analytics />}
            >
              Analytics
            </Button>
          </ButtonGroup>
          <Button variant="outlined" startIcon={<GetApp />}>
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Team Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" gutterBottom>
                {teamStats.totalMembers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Team Members
              </Typography>
              <Typography variant="caption" color="info.main">
                Active this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" gutterBottom>
                ${teamStats.totalAmount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Expenses
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {teamStats.totalExpenses} submissions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" gutterBottom>
                ${teamStats.pendingAmount.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Approval
              </Typography>
              <Typography variant="caption" color="warning.main">
                Needs attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" gutterBottom>
                {teamStats.budgetUtilization}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Budget Utilized
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ${teamStats.monthlyBudget.toLocaleString()} budget
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* View Mode Content */}
      {viewMode === 'overview' && (
        <Grid container spacing={3}>
          {/* Expense Trend Chart */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Expense Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={expenseTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip formatter={(value) => [`$${value}`, '']} />
                    <Legend />
                    <Bar dataKey="approved" fill="#4CAF50" name="Approved" />
                    <Bar dataKey="pending" fill="#FF9800" name="Pending" />
                    <Line type="monotone" dataKey="total" stroke="#1976d2" strokeWidth={2} name="Total" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Risk Distribution */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Risk Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Performers */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Performers
                </Typography>
                <List>
                  {teamMembers
                    .sort((a, b) => b.complianceRate - a.complianceRate)
                    .slice(0, 3)
                    .map((member, index) => (
                      <ListItem key={member.id}>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {member.avatar}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={member.name}
                          secondary={`${member.complianceRate}% compliance • Trust: ${member.trustScore}%`}
                        />
                        <Chip
                          label={`#${index + 1}`}
                          color="primary"
                          size="small"
                        />
                      </ListItem>
                    ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activities */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activities
                </Typography>
                <List>
                  {teamExpenses.slice(0, 4).map((expense) => (
                    <ListItem key={expense.id}>
                      <ListItemText
                        primary={expense.title}
                        secondary={`${expense.submittedBy} • $${expense.amount} • ${expense.date}`}
                      />
                      <Chip
                        label={expense.status.replace('_', ' ')}
                        color={getStatusColor(expense.status)}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {viewMode === 'members' && (
        <Box>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search team members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search color="action" />
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort By"
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <MenuItem value="amount">Total Amount</MenuItem>
                      <MenuItem value="expenses">Total Expenses</MenuItem>
                      <MenuItem value="compliance">Compliance Rate</MenuItem>
                      <MenuItem value="trust">Trust Score</MenuItem>
                      <MenuItem value="risk">Risk Level</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    startIcon={sortOrder === 'asc' ? <TrendingUp /> : <TrendingDown />}
                  >
                    {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  </Button>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button startIcon={<PersonAdd />} variant="outlined" size="small">
                      Add Member
                    </Button>
                    <Button startIcon={<ManageAccounts />} variant="outlined" size="small">
                      Manage Team
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Typography variant="h6" gutterBottom>
            Team Members ({filteredMembers.length})
          </Typography>
          {filteredMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </Box>
      )}

      {viewMode === 'expenses' && (
        <Box>
          {/* Filters */}
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
                    <InputLabel>Member</InputLabel>
                    <Select
                      value={memberFilter}
                      label="Member"
                      onChange={(e) => setMemberFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Members</MenuItem>
                      {teamMembers.map((member) => (
                        <MenuItem key={member.id} value={member.id}>
                          {member.name}
                        </MenuItem>
                      ))}
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
                      <MenuItem value="Meals">Meals</MenuItem>
                      <MenuItem value="Travel">Travel</MenuItem>
                      <MenuItem value="Office">Office</MenuItem>
                      <MenuItem value="Conference">Conference</MenuItem>
                      <MenuItem value="Transportation">Transportation</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
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

          {/* Expenses List */}
          <Typography variant="h6" gutterBottom>
            Team Expenses ({filteredExpenses.length})
          </Typography>
          {filteredExpenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))}
        </Box>
      )}

      {viewMode === 'analytics' && (
        <Grid container spacing={3}>
          {/* Category Breakdown */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Expense Categories
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: $${value}`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`$${value}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Team Performance */}
          <Grid item xs={12} lg={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Performance Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main">
                        {teamStats.avgComplianceRate}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Compliance Rate
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {teamStats.avgTrustScore}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg Trust Score
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {teamStats.riskyCases}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        High Risk Cases
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main">
                        {teamStats.policViolations}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Policy Violations
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Additional Analytics Cards */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Budget Status
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Used: ${teamStats.totalAmount.toLocaleString()} / ${teamStats.monthlyBudget.toLocaleString()}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={teamStats.budgetUtilization}
                    sx={{ height: 8, borderRadius: 4, mt: 1 }}
                    color={teamStats.budgetUtilization > 90 ? 'error' : 
                           teamStats.budgetUtilization > 75 ? 'warning' : 'primary'}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {teamStats.budgetUtilization}% utilized
                  </Typography>
                </Box>
                <Alert 
                  severity={teamStats.budgetUtilization > 90 ? 'error' : 
                           teamStats.budgetUtilization > 75 ? 'warning' : 'info'}
                >
                  {teamStats.budgetUtilization > 90 
                    ? 'Budget almost exhausted - monitor spending closely'
                    : teamStats.budgetUtilization > 75
                    ? 'Approaching budget limit - consider restrictions'
                    : 'Budget utilization is healthy'
                  }
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Reimbursement Status
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Pending Reimbursements"
                      secondary={`$${teamStats.reimbursementBacklog.toLocaleString()}`}
                    />
                    <Chip label="Action Required" color="warning" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Average Processing Time"
                      secondary="2.3 days"
                    />
                    <Chip label="Good" color="success" size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Top Spender"
                      secondary={teamStats.topSpender}
                    />
                    <Button size="small" startIcon={<Visibility />}>
                      View
                    </Button>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Member Details Dialog */}
      <MemberDetailsDialog />

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => navigate('/team/settings')}
      >
        <Settings />
      </Fab>
    </Container>
  );
};

export default TeamExpenses;