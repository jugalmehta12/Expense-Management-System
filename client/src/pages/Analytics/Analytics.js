import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  DatePicker,
  ToggleButton,
  ToggleButtonGroup,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Analytics as AnalyticsIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  Visibility as ViewIcon,
  Assessment as ReportIcon,
  Schedule as ClockIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';

const Analytics = () => {
  const { user } = useAuth();
  
  const [dateRange, setDateRange] = useState('30days');
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const [department, setDepartment] = useState('all');
  const [category, setCategory] = useState('all');
  const [viewType, setViewType] = useState('overview'); // overview, trends, categories, employees
  
  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['analytics', { dateRange, startDate, endDate, department, category }],
    queryFn: () => apiClient.analytics.getAnalytics({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      department: department !== 'all' ? department : undefined,
      category: category !== 'all' ? category : undefined
    })
  });

  // Fetch departments for filter
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiClient.users.getDepartments()
  });

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.expenses.getCategories()
  });

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    const now = new Date();
    
    switch (range) {
      case '7days':
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;
      case '30days':
        setStartDate(subDays(now, 30));
        setEndDate(now);
        break;
      case '90days':
        setStartDate(subDays(now, 90));
        setEndDate(now);
        break;
      case 'thisMonth':
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        setStartDate(startOfMonth(lastMonth));
        setEndDate(endOfMonth(lastMonth));
        break;
      default:
        break;
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const exportData = () => {
    // Implementation for exporting analytics data
    console.log('Exporting analytics data...');
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Analytics & Reports
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ExportIcon />}
          onClick={exportData}
        >
          Export Report
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filters
          </Typography>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <ToggleButtonGroup
                value={dateRange}
                exclusive
                onChange={(e, value) => value && handleDateRangeChange(value)}
                size="small"
                fullWidth
              >
                <ToggleButton value="7days">7 Days</ToggleButton>
                <ToggleButton value="30days">30 Days</ToggleButton>
                <ToggleButton value="90days">90 Days</ToggleButton>
              </ToggleButtonGroup>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <MuiDatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <MuiDatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  label="Department"
                >
                  <MenuItem value="all">All Departments</MenuItem>
                  {departments?.map((dept) => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories?.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* View Type Selector */}
      <ToggleButtonGroup
        value={viewType}
        exclusive
        onChange={(e, value) => value && setViewType(value)}
        sx={{ mb: 3 }}
      >
        <ToggleButton value="overview">Overview</ToggleButton>
        <ToggleButton value="trends">Trends</ToggleButton>
        <ToggleButton value="categories">Categories</ToggleButton>
        <ToggleButton value="employees">Employees</ToggleButton>
      </ToggleButtonGroup>

      {/* Overview Dashboard */}
      {viewType === 'overview' && (
        <Grid container spacing={3}>
          {/* Key Metrics */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MoneyIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Expenses</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {formatCurrency(analyticsData?.totalAmount || 0)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {analyticsData?.totalAmountChange >= 0 ? (
                    <TrendingUp color="success" fontSize="small" />
                  ) : (
                    <TrendingDown color="error" fontSize="small" />
                  )}
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {Math.abs(analyticsData?.totalAmountChange || 0)}% vs last period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ReceiptIcon color="secondary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Claims</Typography>
                </Box>
                <Typography variant="h4" color="secondary">
                  {analyticsData?.totalExpenses || 0}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  {analyticsData?.totalExpensesChange >= 0 ? (
                    <TrendingUp color="success" fontSize="small" />
                  ) : (
                    <TrendingDown color="error" fontSize="small" />
                  )}
                  <Typography variant="caption" sx={{ ml: 0.5 }}>
                    {Math.abs(analyticsData?.totalExpensesChange || 0)}% vs last period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <ClockIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6">Pending</Typography>
                </Box>
                <Typography variant="h4" color="warning.main">
                  {analyticsData?.pendingExpenses || 0}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {formatCurrency(analyticsData?.pendingAmount || 0)} pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PersonIcon color="info" sx={{ mr: 1 }} />
                  <Typography variant="h6">Avg per Employee</Typography>
                </Box>
                <Typography variant="h4" color="info.main">
                  {formatCurrency(analyticsData?.avgPerEmployee || 0)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {analyticsData?.activeEmployees || 0} active employees
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Expense Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData?.dailyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                      name="Amount"
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.6}
                      name="Count"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Category Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData?.categoryBreakdown || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="amount"
                    >
                      {(analyticsData?.categoryBreakdown || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Trends View */}
      {viewType === 'trends' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Trends
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData?.monthlyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Total Amount"
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#82ca9d"
                      strokeWidth={2}
                      name="Total Count"
                    />
                    <Line
                      type="monotone"
                      dataKey="avgProcessingTime"
                      stroke="#ffc658"
                      strokeWidth={2}
                      name="Avg Processing Time (days)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Categories View */}
      {viewType === 'categories' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Category Breakdown
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData?.categoryBreakdown || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="amount" fill="#8884d8" name="Amount" />
                    <Bar dataKey="count" fill="#82ca9d" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Category Details
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Avg</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(analyticsData?.categoryBreakdown || []).map((category) => (
                        <TableRow key={category.category}>
                          <TableCell>{category.category}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(category.amount)}
                          </TableCell>
                          <TableCell align="right">{category.count}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(category.amount / category.count)}
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
      )}

      {/* Employees View */}
      {viewType === 'employees' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Employee Expense Summary
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Department</TableCell>
                        <TableCell align="right">Total Amount</TableCell>
                        <TableCell align="right">Total Claims</TableCell>
                        <TableCell align="right">Avg per Claim</TableCell>
                        <TableCell align="right">Pending</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(analyticsData?.employeeBreakdown || []).map((employee) => (
                        <TableRow key={employee.employeeId} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                                {employee.firstName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2">
                                  {employee.firstName} {employee.lastName}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {employee.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{employee.department}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(employee.totalAmount)}
                          </TableCell>
                          <TableCell align="right">{employee.totalCount}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(employee.totalAmount / employee.totalCount)}
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={employee.pendingCount}
                              size="small"
                              color={employee.pendingCount > 0 ? 'warning' : 'default'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Employee Details">
                              <IconButton size="small">
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
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
      )}
    </Box>
  );
};

export default Analytics;