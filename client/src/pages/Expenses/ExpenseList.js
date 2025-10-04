import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Tooltip,
  Menu,
  MenuList,
  ListItemText,
  ListItemIcon,
  Avatar,
  Box as MuiBox,
  Fab
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  Receipt as ReceiptIcon,
  Add as AddIcon,
  Download as DownloadIcon,
  FileUpload as UploadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';

const ExpenseList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Build query filters
  const filters = {
    page: page + 1,
    limit: rowsPerPage,
    ...(searchTerm && { search: searchTerm }),
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(categoryFilter !== 'all' && { category: categoryFilter }),
    ...(dateFilter !== 'all' && { dateRange: dateFilter })
  };

  // Fetch expenses
  const { data: expensesData, isLoading, error } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => apiClient.expenses.getExpenses(filters)
  });

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => apiClient.companies.getExpenseCategories()
  });

  // Delete expense mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId) => apiClient.expenses.deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      setAnchorEl(null);
    }
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event, expense) => {
    setAnchorEl(event.currentTarget);
    setSelectedExpense(expense);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpense(null);
  };

  const handleViewExpense = (expenseId) => {
    navigate(`/expenses/${expenseId}`);
    handleMenuClose();
  };

  const handleEditExpense = (expenseId) => {
    navigate(`/expenses/${expenseId}/edit`);
    handleMenuClose();
  };

  const handleDeleteExpense = () => {
    if (selectedExpense) {
      deleteExpenseMutation.mutate(selectedExpense._id);
    }
  };

  const handleExportExpenses = () => {
    // TODO: Implement export functionality
    console.log('Export expenses');
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
      case 'draft':
        return 'default';
      case 'reimbursed':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'pending':
        return '⏳';
      case 'submitted':
        return '📤';
      case 'draft':
        return '📝';
      case 'reimbursed':
        return '💰';
      default:
        return '📄';
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const canEditExpense = (expense) => {
    return expense.status === 'draft' || expense.status === 'rejected';
  };

  const canDeleteExpense = (expense) => {
    return expense.status === 'draft' || user?.role === 'admin';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          My Expenses
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/expenses/create')}
        >
          Create Expense
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <TextField
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            {/* Status Filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="reimbursed">Reimbursed</MenuItem>
              </Select>
            </FormControl>

            {/* Category Filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories?.map((category) => (
                  <MenuItem key={category.name} value={category.name}>
                    {category.icon} {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Date Filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Date</InputLabel>
              <Select
                value={dateFilter}
                label="Date"
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="quarter">This Quarter</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
              </Select>
            </FormControl>

            <Button
              startIcon={<DownloadIcon />}
              onClick={handleExportExpenses}
              variant="outlined"
              size="small"
            >
              Export
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Receipt</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Vendor</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Loading expenses...
                  </TableCell>
                </TableRow>
              ) : expensesData?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Box sx={{ py: 4 }}>
                      <ReceiptIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="textSecondary">
                        No expenses found
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Create your first expense to get started
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/expenses/create')}
                      >
                        Create Expense
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                expensesData?.data?.map((expense) => (
                  <TableRow key={expense._id} hover>
                    <TableCell>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {expense.receipts?.length > 0 ? (
                          <ReceiptIcon fontSize="small" />
                        ) : (
                          '📄'
                        )}
                      </Avatar>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {expense.description}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        #{expense.expenseNumber}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(expense.amount, expense.currency)}
                      </Typography>
                      {expense.originalCurrency !== expense.currency && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          {formatCurrency(expense.originalAmount, expense.originalCurrency)}
                        </Typography>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={expense.category}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={`${getStatusIcon(expense.status)} ${expense.status}`}
                        color={getStatusColor(expense.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {expense.vendor || '-'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell align="right">
                      <Tooltip title="More actions">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, expense)}
                          size="small"
                        >
                          <MoreIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {expensesData?.data && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={expensesData.total || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuList>
          <MenuItem onClick={() => handleViewExpense(selectedExpense?._id)}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          
          {selectedExpense && canEditExpense(selectedExpense) && (
            <MenuItem onClick={() => handleEditExpense(selectedExpense._id)}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
          )}
          
          {selectedExpense && canDeleteExpense(selectedExpense) && (
            <MenuItem 
              onClick={handleDeleteExpense}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          )}
        </MenuList>
      </Menu>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add expense"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={() => navigate('/expenses/create')}
      >
        <AddIcon />
      </Fab>

      {/* Error Display */}
      {error && (
        <Box sx={{ mt: 2 }}>
          <Typography color="error">
            Error loading expenses: {error.message}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ExpenseList;