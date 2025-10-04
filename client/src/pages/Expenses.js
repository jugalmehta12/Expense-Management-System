import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Expenses = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock expense data
  const expenses = [
    {
      id: 1,
      title: 'Business Lunch',
      amount: 75.50,
      category: 'Meals',
      date: '2025-10-01',
      status: 'approved',
      description: 'Team lunch at downtown restaurant',
      receipt: true,
    },
    {
      id: 2,
      title: 'Taxi Fare',
      amount: 25.00,
      category: 'Transport',
      date: '2025-10-02',
      status: 'pending',
      description: 'Airport to hotel',
      receipt: true,
    },
    {
      id: 3,
      title: 'Office Supplies',
      amount: 145.75,
      category: 'Office',
      date: '2025-10-03',
      status: 'rejected',
      description: 'Notebooks, pens, and desk organizers',
      receipt: false,
    },
    {
      id: 4,
      title: 'Software License',
      amount: 299.99,
      category: 'Software',
      date: '2025-10-04',
      status: 'approved',
      description: 'Annual subscription for productivity tools',
      receipt: true,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Meals': return '🍽️';
      case 'Transport': return '🚗';
      case 'Office': return '🏢';
      case 'Software': return '💻';
      default: return '📄';
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const approvedAmount = expenses
    .filter(expense => expense.status === 'approved')
    .reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            My Expenses 💰
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage your expense reports
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <MoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">${totalAmount.toFixed(2)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Expenses
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <ReceiptIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">${approvedAmount.toFixed(2)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <CalendarIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">{expenses.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Reports
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <FilterIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {expenses.filter(e => e.status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />
        <Button variant="outlined" startIcon={<FilterIcon />}>
          Filter
        </Button>
      </Box>

      {/* Expenses Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Expense</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Receipt</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontSize: '1.2em', mr: 1 }}>
                          {getCategoryIcon(expense.category)}
                        </Typography>
                        <Box>
                          <Typography variant="subtitle2">{expense.title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {expense.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={expense.category} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        ${expense.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>
                      <Chip
                        label={expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        color={getStatusColor(expense.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {expense.receipt ? '✅' : '❌'}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View">
                          <IconButton size="small" onClick={() => navigate(`/expenses/${expense.id}`)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add expense"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => navigate('/expenses/new')}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default Expenses;