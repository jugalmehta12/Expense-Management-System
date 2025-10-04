import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Stack,
  Avatar,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp,
  TrendingDown,
  Assessment,
  PieChart,
  TableChart,
  Schedule,
  Person,
  Business,
  Category
} from '@mui/icons-material';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const sampleChartData = {
  monthlyTrends: [
    { month: 'Jan', expenses: 45000, approved: 42000, rejected: 3000 },
    { month: 'Feb', expenses: 52000, approved: 48000, rejected: 4000 },
    { month: 'Mar', expenses: 48000, approved: 45000, rejected: 3000 },
    { month: 'Apr', expenses: 61000, approved: 58000, rejected: 3000 },
    { month: 'May', expenses: 55000, approved: 52000, rejected: 3000 },
    { month: 'Jun', expenses: 67000, approved: 63000, rejected: 4000 }
  ],
  categoryBreakdown: [
    { name: 'Travel', value: 35, amount: 125000, color: '#8884d8' },
    { name: 'Meals', value: 25, amount: 89000, color: '#82ca9d' },
    { name: 'Office Supplies', value: 15, amount: 53000, color: '#ffc658' },
    { name: 'Software', value: 12, amount: 42000, color: '#ff7300' },
    { name: 'Training', value: 8, amount: 28000, color: '#00ff00' },
    { name: 'Other', value: 5, amount: 18000, color: '#ff0000' }
  ],
  departmentData: [
    { department: 'Engineering', totalExpenses: 125000, avgExpense: 850, employeeCount: 45 },
    { department: 'Sales', totalExpenses: 98000, avgExpense: 720, employeeCount: 32 },
    { department: 'Marketing', totalExpenses: 76000, avgExpense: 920, employeeCount: 18 },
    { department: 'HR', totalExpenses: 45000, avgExpense: 650, employeeCount: 12 },
    { department: 'Finance', totalExpenses: 38000, avgExpense: 580, employeeCount: 8 }
  ]
};

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('expense-summary');
  const [dateRange, setDateRange] = useState({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  });
  const [filters, setFilters] = useState({
    department: '',
    status: '',
    category: '',
    user: ''
  });
  const [reportData, setReportData] = useState(null);
  const [summaryStats, setSummaryStats] = useState({
    totalExpenses: 0,
    approvedAmount: 0,
    pendingAmount: 0,
    rejectedAmount: 0,
    avgProcessingTime: 0,
    topSpender: null,
    mostCommonCategory: null
  });

  const reportTypes = [
    { value: 'expense-summary', label: 'Expense Summary', icon: <Assessment /> },
    { value: 'department-analysis', label: 'Department Analysis', icon: <Business /> },
    { value: 'user-activity', label: 'User Activity Report', icon: <Person /> },
    { value: 'category-breakdown', label: 'Category Breakdown', icon: <Category /> },
    { value: 'trend-analysis', label: 'Trend Analysis', icon: <TrendingUp /> },
    { value: 'compliance-report', label: 'Compliance Report', icon: <TableChart /> },
    { value: 'budget-variance', label: 'Budget Variance', icon: <PieChart /> },
    { value: 'processing-time', label: 'Processing Time Analysis', icon: <Schedule /> }
  ];

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data based on report type
      switch (reportType) {
        case 'expense-summary':
          setReportData({
            summary: {
              totalExpenses: 355000,
              totalCount: 1247,
              approvedAmount: 325000,
              pendingAmount: 25000,
              rejectedAmount: 5000,
              avgExpenseAmount: 285
            },
            recentExpenses: [
              { id: 1, user: 'John Smith', amount: 1250, category: 'Travel', date: new Date(), status: 'approved' },
              { id: 2, user: 'Sarah Johnson', amount: 450, category: 'Meals', date: new Date(), status: 'pending' },
              { id: 3, user: 'Mike Brown', amount: 320, category: 'Office Supplies', date: new Date(), status: 'approved' }
            ]
          });
          break;
        case 'department-analysis':
          setReportData({ departments: sampleChartData.departmentData });
          break;
        default:
          setReportData({ message: 'Report data will be available here' });
      }

      setSummaryStats({
        totalExpenses: 1247,
        approvedAmount: 325000,
        pendingAmount: 25000,
        rejectedAmount: 5000,
        avgProcessingTime: 2.5,
        topSpender: 'Engineering Dept',
        mostCommonCategory: 'Travel'
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  }, [reportType]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExportReport = (format) => {
    // Implement export functionality
    console.log(`Exporting report in ${format} format`);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleEmailReport = () => {
    // Implement email functionality
    console.log('Sending report via email');
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const renderReportContent = () => {
    switch (reportType) {
      case 'expense-summary':
        return (
          <Grid container spacing={3}>
            {/* Summary Cards */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Total Expenses</Typography>
                  <Typography variant="h5">{reportData?.summary?.totalCount || 0}</Typography>
                  <Typography variant="body2" color="success.main">
                    <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                    +12% from last month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Total Amount</Typography>
                  <Typography variant="h5">${reportData?.summary?.totalExpenses?.toLocaleString() || 0}</Typography>
                  <Typography variant="body2" color="success.main">
                    <TrendingUp sx={{ fontSize: 16, mr: 0.5 }} />
                    +8% from last month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Approved Amount</Typography>
                  <Typography variant="h5">${reportData?.summary?.approvedAmount?.toLocaleString() || 0}</Typography>
                  <Typography variant="body2" color="success.main">92% approval rate</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>Avg Processing Time</Typography>
                  <Typography variant="h5">{summaryStats.avgProcessingTime} days</Typography>
                  <Typography variant="body2" color="success.main">
                    <TrendingDown sx={{ fontSize: 16, mr: 0.5 }} />
                    -0.5 days improved
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Charts */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Monthly Expense Trends</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={sampleChartData.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip />
                      <Legend />
                      <Bar dataKey="approved" fill="#4caf50" name="Approved" />
                      <Bar dataKey="rejected" fill="#f44336" name="Rejected" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Category Breakdown</Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={sampleChartData.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}%`}
                      >
                        {sampleChartData.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Expenses Table */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Recent Expenses</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>User</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData?.recentExpenses?.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                                  {expense.user.split(' ').map(n => n[0]).join('')}
                                </Avatar>
                                {expense.user}
                              </Box>
                            </TableCell>
                            <TableCell>${expense.amount}</TableCell>
                            <TableCell>{expense.category}</TableCell>
                            <TableCell>{format(expense.date, 'MMM dd, yyyy')}</TableCell>
                            <TableCell>
                              <Chip
                                label={expense.status}
                                color={getStatusColor(expense.status)}
                                size="small"
                              />
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
        );

      case 'department-analysis':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Department Expense Analysis</Typography>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Department</TableCell>
                          <TableCell align="right">Total Expenses</TableCell>
                          <TableCell align="right">Average per Employee</TableCell>
                          <TableCell align="right">Employee Count</TableCell>
                          <TableCell align="center">Trend</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sampleChartData.departmentData.map((dept) => (
                          <TableRow key={dept.department}>
                            <TableCell component="th" scope="row">
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Business sx={{ mr: 1, color: 'primary.main' }} />
                                {dept.department}
                              </Box>
                            </TableCell>
                            <TableCell align="right">${dept.totalExpenses.toLocaleString()}</TableCell>
                            <TableCell align="right">${dept.avgExpense}</TableCell>
                            <TableCell align="right">{dept.employeeCount}</TableCell>
                            <TableCell align="center">
                              <TrendingUp color="success" />
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
        );

      default:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {reportTypes.find(r => r.value === reportType)?.label}
              </Typography>
              <Typography color="textSecondary">
                This report is being prepared. Detailed analytics and data visualization will be available here.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={75} />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Report generation in progress... 75% complete
                </Typography>
              </Box>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          📊 Reports & Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate comprehensive expense reports and insights
        </Typography>
      </Box>

      {/* Report Configuration */}
      <Accordion defaultExpanded sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Report Configuration</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {type.icon}
                        <Typography sx={{ ml: 1 }}>{type.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={dateRange.startDate ? format(dateRange.startDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value) : null }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={dateRange.endDate ? format(dateRange.endDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value) : null }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={filters.department}
                  label="Department"
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                >
                  <MenuItem value="">All Departments</MenuItem>
                  <MenuItem value="engineering">Engineering</MenuItem>
                  <MenuItem value="sales">Sales</MenuItem>
                  <MenuItem value="marketing">Marketing</MenuItem>
                  <MenuItem value="hr">HR</MenuItem>
                  <MenuItem value="finance">Finance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={fetchReportData}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport('excel')}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport('pdf')}
            >
              Export PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrintReport}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              onClick={handleEmailReport}
            >
              Email Report
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Report Content */}
      {loading ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>Generating Report...</Typography>
            <LinearProgress sx={{ mt: 2 }} />
          </CardContent>
        </Card>
      ) : (
        renderReportContent()
      )}
    </Container>
  );
};

export default Reports;