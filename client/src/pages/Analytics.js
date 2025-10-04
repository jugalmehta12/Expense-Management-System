import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  alpha,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  ShowChart,
  GetApp,
  DateRange
} from '@mui/icons-material';
import apiClient from '../utils/apiClient';

const Analytics = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dateRange, setDateRange] = useState('last30days');
  const [chartType, setChartType] = useState('bar');

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/analytics/dashboard?period=${dateRange}`);
      setAnalyticsData(response.data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching analytics:', error);
      // Mock data for demo
      setAnalyticsData(getMockAnalyticsData());
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const getMockAnalyticsData = () => ({
    summary: {
      totalSpent: 12450.75,
      totalExpenses: 48,
      avgExpenseAmount: 259.39,
      pendingAmount: 850.00,
      approvedAmount: 11600.75,
      rejectedAmount: 0,
      topCategory: 'Travel',
      spendingTrend: 12.5,
      avgApprovalTime: '2.3 days'
    },
    monthlyTrends: [
      { month: 'Jan', amount: 2400, expenses: 12, approved: 10, pending: 2 },
      { month: 'Feb', amount: 1800, expenses: 8, approved: 7, pending: 1 },
      { month: 'Mar', amount: 3200, expenses: 15, approved: 14, pending: 1 },
      { month: 'Apr', amount: 2950, expenses: 11, approved: 10, pending: 1 },
      { month: 'May', amount: 3100, expenses: 13, approved: 12, pending: 1 },
      { month: 'Jun', amount: 2800, expenses: 10, approved: 9, pending: 1 }
    ],
    categoryBreakdown: [
      { name: 'Travel', amount: 4200, percentage: 35, count: 8, color: '#8884d8' },
      { name: 'Meals', amount: 2400, percentage: 20, count: 15, color: '#82ca9d' },
      { name: 'Office Supplies', amount: 1800, percentage: 15, count: 12, color: '#ffc658' },
      { name: 'Equipment', amount: 1500, percentage: 12, count: 5, color: '#ff7300' },
      { name: 'Transportation', amount: 1200, percentage: 10, count: 10, color: '#00ff00' },
      { name: 'Other', amount: 950, percentage: 8, count: 8, color: '#ff69b4' }
    ],
    approvalStats: [
      { status: 'Approved', count: 42, percentage: 87.5, amount: 11600.75 },
      { status: 'Pending', count: 5, percentage: 10.4, amount: 850.00 },
      { status: 'Rejected', count: 1, percentage: 2.1, amount: 125.50 }
    ],
    topExpenses: [
      { id: 'EXP-001', description: 'Conference Registration - Tech Summit', amount: 899.00, category: 'Travel', date: '2024-09-15' },
      { id: 'EXP-002', description: 'Flight to New York - Client Meeting', amount: 650.00, category: 'Travel', date: '2024-09-28' },
      { id: 'EXP-003', description: 'Hotel Stay - Boston Conference', amount: 450.00, category: 'Accommodation', date: '2024-10-02' },
      { id: 'EXP-004', description: 'Team Dinner - Project Completion', amount: 320.00, category: 'Meals', date: '2024-09-25' },
      { id: 'EXP-005', description: 'Laptop Repair - Hardware Issue', amount: 180.00, category: 'Equipment', date: '2024-09-20' }
    ],
    departmentComparison: [
      { department: 'Engineering', amount: 4500, budget: 5000, variance: -500 },
      { department: 'Sales', amount: 3200, budget: 3000, variance: 200 },
      { department: 'Marketing', amount: 2800, budget: 3500, variance: -700 },
      { department: 'HR', amount: 1200, budget: 1500, variance: -300 }
    ]
  });

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) => (
    <Card sx={{ height: '100%', background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)}, ${alpha(theme.palette[color].main, 0.05)})` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? <TrendingUp color="success" /> : <TrendingDown color="error" />}
                <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'} sx={{ ml: 0.5 }}>
                  {Math.abs(trend)}% vs last period
                </Typography>
              </Box>
            )}
          </Box>
          <Icon sx={{ fontSize: 40, color: `${color}.main`, opacity: 0.7 }} />
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={40} />
      </Container>
    );
  }

  if (!analyticsData) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">Failed to load analytics data. Please refresh the page.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            📊 Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Comprehensive expense analytics and insights
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Period</InputLabel>
            <Select
              value={dateRange}
              label="Time Period"
              onChange={(e) => setDateRange(e.target.value)}
              startAdornment={<DateRange sx={{ mr: 1 }} />}
            >
              <MenuItem value="last7days">Last 7 Days</MenuItem>
              <MenuItem value="last30days">Last 30 Days</MenuItem>
              <MenuItem value="last90days">Last 90 Days</MenuItem>
              <MenuItem value="last12months">Last 12 Months</MenuItem>
              <MenuItem value="ytd">Year to Date</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<GetApp />}>
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Spent"
            value={`$${analyticsData.summary.totalSpent.toLocaleString()}`}
            subtitle={`${analyticsData.summary.totalExpenses} expenses`}
            icon={Assessment}
            trend={analyticsData.summary.spendingTrend}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Amount"
            value={`$${analyticsData.summary.avgExpenseAmount}`}
            subtitle="Per expense"
            icon={ShowChart}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Amount"
            value={`$${analyticsData.summary.pendingAmount.toLocaleString()}`}
            subtitle="Awaiting approval"
            icon={PieChartIcon}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Top Category"
            value={analyticsData.summary.topCategory}
            subtitle={`Avg approval: ${analyticsData.summary.avgApprovalTime}`}
            icon={BarChartIcon}
            color="success"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Monthly Trends */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Monthly Spending Trends</Typography>
                <FormControl size="small">
                  <Select value={chartType} onChange={(e) => setChartType(e.target.value)}>
                    <MenuItem value="bar">Bar Chart</MenuItem>
                    <MenuItem value="line">Line Chart</MenuItem>
                    <MenuItem value="area">Area Chart</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                {chartType === 'bar' && (
                  <BarChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Bar dataKey="amount" fill={theme.palette.primary.main} />
                  </BarChart>
                )}
                {chartType === 'line' && (
                  <LineChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Line type="monotone" dataKey="amount" stroke={theme.palette.primary.main} strokeWidth={3} />
                  </LineChart>
                )}
                {chartType === 'area' && (
                  <AreaChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Area type="monotone" dataKey="amount" stroke={theme.palette.primary.main} fill={alpha(theme.palette.primary.main, 0.3)} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Breakdown */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Category Breakdown</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analyticsData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="amount"
                    label={({name, percentage}) => `${name}: ${percentage}%`}
                  >
                    {analyticsData.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approval Statistics & Top Expenses */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Approval Statistics</Typography>
              <Box sx={{ mt: 2 }}>
                {analyticsData.approvalStats.map((stat, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{stat.status}</Typography>
                      <Typography variant="body2">{stat.count} ({stat.percentage}%)</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ flexGrow: 1, height: 8, bgcolor: 'grey.200', borderRadius: 4 }}>
                        <Box
                          sx={{
                            height: '100%',
                            width: `${stat.percentage}%`,
                            bgcolor: stat.status === 'Approved' ? 'success.main' : 
                                    stat.status === 'Pending' ? 'warning.main' : 'error.main',
                            borderRadius: 4
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        ${stat.amount.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Expenses</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Category</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.topExpenses.map((expense, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2" noWrap>
                            {expense.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {expense.date}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            ${expense.amount}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={expense.category} size="small" variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Department Comparison */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Department Budget Comparison</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Department</TableCell>
                    <TableCell align="right">Spent</TableCell>
                    <TableCell align="right">Budget</TableCell>
                    <TableCell align="right">Variance</TableCell>
                    <TableCell align="right">Utilization</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analyticsData.departmentComparison.map((dept, index) => {
                    const utilization = (dept.amount / dept.budget) * 100;
                    return (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          <Typography variant="body2" fontWeight="bold">
                            {dept.department}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">${dept.amount.toLocaleString()}</TableCell>
                        <TableCell align="right">${dept.budget.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            color={dept.variance >= 0 ? 'error.main' : 'success.main'}
                          >
                            {dept.variance >= 0 ? '+' : ''}${dept.variance.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 60, height: 8, bgcolor: 'grey.200', borderRadius: 4 }}>
                              <Box
                                sx={{
                                  height: '100%',
                                  width: `${Math.min(utilization, 100)}%`,
                                  bgcolor: utilization > 100 ? 'error.main' : 
                                          utilization > 80 ? 'warning.main' : 'success.main',
                                  borderRadius: 4
                                }}
                              />
                            </Box>
                            <Typography variant="body2">
                              {utilization.toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Container>
  );
};

export default Analytics;