import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Avatar,
  LinearProgress,
  useTheme
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Pending as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', dateRange],
    queryFn: () => apiClient.analytics.getDashboard({
      startDate: dateRange.start,
      endDate: dateRange.end
    })
  });

  // Fetch recent expenses
  const { data: recentExpenses } = useQuery({
    queryKey: ['recent-expenses'],
    queryFn: () => apiClient.expenses.getExpenses({ 
      limit: 5, 
      sort: '-createdAt' 
    })
  });

  // Fetch pending approvals (for managers)
  const { data: pendingApprovals } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => apiClient.approvals.getPendingApprovals(),
    enabled: ['manager', 'finance', 'director', 'admin'].includes(user?.role)
  });

  const statsCards = [
    {
      title: 'Total Expenses',
      value: dashboardData?.totalExpenses || 0,
      format: 'currency',
      icon: <MoneyIcon />,
      color: theme.palette.primary.main,
      trend: dashboardData?.expensesTrend || 0
    },
    {
      title: 'Pending Expenses',
      value: dashboardData?.pendingExpenses || 0,
      format: 'number',
      icon: <PendingIcon />,
      color: theme.palette.warning.main,
      trend: dashboardData?.pendingTrend || 0
    },
    {
      title: 'Approved This Month',
      value: dashboardData?.approvedExpenses || 0,
      format: 'number',
      icon: <ApprovedIcon />,
      color: theme.palette.success.main,
      trend: dashboardData?.approvedTrend || 0
    },
    {
      title: 'Average Processing Time',
      value: dashboardData?.avgProcessingTime || 0,
      format: 'days',
      icon: <CalendarIcon />,
      color: theme.palette.info.main,
      trend: dashboardData?.processingTimeTrend || 0
    }
  ];

  const formatValue = (value, format) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: user?.company?.defaultCurrency || 'USD'
        }).format(value);
      case 'number':
        return value.toLocaleString();
      case 'days':
        return `${value} days`;
      default:
        return value;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      case 'submitted':
        return 'info';
      default:
        return 'default';
    }
  };

  const chartColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
    theme.palette.info.main
  ];

  if (isLoading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName}! 👋
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here's what's happening with your expenses today.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{
                      backgroundColor: stat.color,
                      mr: 2,
                      width: 48,
                      height: 48
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {formatValue(stat.value, stat.format)}
                    </Typography>
                  </Box>
                </Box>
                {stat.trend !== undefined && (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon
                      sx={{
                        fontSize: 16,
                        color: stat.trend >= 0 ? 'success.main' : 'error.main',
                        mr: 0.5
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: stat.trend >= 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      {stat.trend >= 0 ? '+' : ''}{stat.trend}% from last month
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Charts Section */}
        <Grid item xs={12} md={8}>
          {/* Monthly Trends */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Monthly Expense Trends
              </Typography>
              {dashboardData?.monthlyTrends && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [formatValue(value, 'currency'), 'Amount']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke={theme.palette.primary.main}
                      strokeWidth={3}
                      dot={{ fill: theme.palette.primary.main, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expense Categories
              </Typography>
              {dashboardData?.categoryBreakdown && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [formatValue(value, 'currency'), 'Amount']}
                    />
                    <Legend />
                    <Bar 
                      dataKey="amount" 
                      fill={theme.palette.primary.main}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Quick Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/expenses/create')}
                  fullWidth
                >
                  Create New Expense
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ReceiptIcon />}
                  onClick={() => navigate('/expenses')}
                  fullWidth
                >
                  View All Expenses
                </Button>
                {['manager', 'finance', 'director', 'admin'].includes(user?.role) && (
                  <Button
                    variant="outlined"
                    startIcon={<PendingIcon />}
                    onClick={() => navigate('/approvals')}
                    fullWidth
                  >
                    Pending Approvals ({pendingApprovals?.length || 0})
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Recent Expenses */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                  Recent Expenses
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => navigate('/expenses')}
                >
                  View All
                </Button>
              </Box>
              <List dense>
                {recentExpenses?.data?.slice(0, 5).map((expense) => (
                  <ListItem 
                    key={expense._id}
                    sx={{ 
                      px: 0,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' }
                    }}
                    onClick={() => navigate(`/expenses/${expense._id}`)}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <ReceiptIcon fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={expense.description}
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption">
                            {format(new Date(expense.date), 'MMM dd, yyyy')}
                          </Typography>
                          <Chip
                            label={expense.status}
                            size="small"
                            color={getStatusColor(expense.status)}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        </Box>
                      }
                    />
                    <Typography variant="body2" fontWeight="bold">
                      {formatValue(expense.amount, 'currency')}
                    </Typography>
                  </ListItem>
                ))}
                {(!recentExpenses?.data || recentExpenses.data.length === 0) && (
                  <ListItem>
                    <ListItemText
                      primary="No recent expenses"
                      secondary="Create your first expense to get started"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Status Distribution Pie Chart */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expense Status
              </Typography>
              {dashboardData?.statusDistribution && (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dashboardData.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.statusDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={chartColors[index % chartColors.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;