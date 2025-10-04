import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Avatar,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Security,
  Person,
  Business,
  AttachMoney,
  Check,
  Info,
  Warning,
  Error as ErrorIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

// Mock audit log data
const mockAuditLogs = [
  {
    id: 1,
    timestamp: new Date('2024-01-15T10:30:00'),
    user: { name: 'John Smith', email: 'john.smith@company.com', role: 'Employee' },
    action: 'expense_created',
    resource: 'Expense',
    resourceId: 'EXP-001',
    description: 'Created new expense: Business Lunch',
    severity: 'info',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: {
      amount: 85.50,
      category: 'Meals',
      description: 'Client meeting lunch at Downtown Restaurant'
    }
  },
  {
    id: 2,
    timestamp: new Date('2024-01-15T11:15:00'),
    user: { name: 'Sarah Manager', email: 'sarah.manager@company.com', role: 'Manager' },
    action: 'expense_approved',
    resource: 'Expense',
    resourceId: 'EXP-001',
    description: 'Approved expense submission',
    severity: 'success',
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    details: {
      previousStatus: 'pending',
      newStatus: 'approved',
      approvalComments: 'Valid business expense, approved for reimbursement'
    }
  },
  {
    id: 3,
    timestamp: new Date('2024-01-15T14:22:00'),
    user: { name: 'Admin User', email: 'admin@company.com', role: 'Admin' },
    action: 'user_created',
    resource: 'User',
    resourceId: 'USR-045',
    description: 'Created new user account',
    severity: 'warning',
    ipAddress: '192.168.1.200',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: {
      newUser: 'mike.brown@company.com',
      role: 'Employee',
      department: 'Engineering'
    }
  },
  {
    id: 4,
    timestamp: new Date('2024-01-15T15:45:00'),
    user: { name: 'Finance Team', email: 'finance@company.com', role: 'Finance' },
    action: 'policy_updated',
    resource: 'ExpensePolicy',
    resourceId: 'POL-001',
    description: 'Updated expense approval policy',
    severity: 'warning',
    ipAddress: '192.168.1.110',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: {
      changedFields: ['maxAmount', 'approvalLevels'],
      oldValues: { maxAmount: 1000, approvalLevels: 2 },
      newValues: { maxAmount: 1500, approvalLevels: 3 }
    }
  },
  {
    id: 5,
    timestamp: new Date('2024-01-15T16:30:00'),
    user: { name: 'System', email: 'system@company.com', role: 'System' },
    action: 'login_failed',
    resource: 'Authentication',
    resourceId: 'AUTH-001',
    description: 'Multiple failed login attempts detected',
    severity: 'error',
    ipAddress: '203.0.113.45',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    details: {
      attemptedUser: 'unknown.user@company.com',
      attemptCount: 5,
      securityAction: 'IP temporarily blocked'
    }
  }
];

const AuditLog = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    user: '',
    dateFrom: null,
    dateTo: null,
    severity: ''
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAuditLogs = useCallback(async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredLogs = mockAuditLogs;
      
      // Apply search filter
      if (searchTerm) {
        filteredLogs = filteredLogs.filter(log =>
          log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply other filters
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
      }
      if (filters.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
      }
      
      setAuditLogs(filteredLogs);
      setTotalCount(filteredLogs.length);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  }, [searchTerm, filters]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setOpenDetailDialog(true);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info':
      default: return 'info';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'success': return <Check />;
      case 'warning': return <Warning />;
      case 'error': return <ErrorIcon />;
      case 'info':
      default: return <Info />;
    }
  };

  const getActionIcon = (action) => {
    if (action.includes('user')) return <Person />;
    if (action.includes('expense')) return <AttachMoney />;
    if (action.includes('company') || action.includes('policy')) return <Business />;
    if (action.includes('login') || action.includes('auth')) return <Security />;
    return <Info />;
  };

  const exportAuditLog = () => {
    // Implement export functionality
    console.log('Exporting audit log...');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🔍 Audit Log
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track all system activities and security events
        </Typography>
      </Box>

      {/* Filters */}
      <Accordion defaultExpanded sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">Filters & Search</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Search"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  endAdornment: <SearchIcon />
                }}
                placeholder="Search by description, user, or action..."
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Action Type</InputLabel>
                <Select
                  value={filters.action}
                  label="Action Type"
                  onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  <MenuItem value="expense_created">Expense Created</MenuItem>
                  <MenuItem value="expense_approved">Expense Approved</MenuItem>
                  <MenuItem value="expense_rejected">Expense Rejected</MenuItem>
                  <MenuItem value="user_created">User Created</MenuItem>
                  <MenuItem value="user_updated">User Updated</MenuItem>
                  <MenuItem value="policy_updated">Policy Updated</MenuItem>
                  <MenuItem value="login_failed">Login Failed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={filters.severity}
                  label="Severity"
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                >
                  <MenuItem value="">All Severities</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="success">Success</MenuItem>
                  <MenuItem value="warning">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={filters.dateFrom ? format(filters.dateFrom, 'yyyy-MM-dd') : ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value ? new Date(e.target.value) : null }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={filters.dateTo ? format(filters.dateTo, 'yyyy-MM-dd') : ''}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value ? new Date(e.target.value) : null }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
          
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilters({ action: '', user: '', dateFrom: null, dateTo: null, severity: '' })}
            >
              Clear Filters
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportAuditLog}
            >
              Export Log
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>

      {/* Audit Log Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>IP Address</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {format(log.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                            {log.user.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {log.user.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {log.user.role}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getActionIcon(log.action)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {log.action.replace('_', ' ').toUpperCase()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.resource}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.resourceId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.description}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getSeverityIcon(log.severity)}
                          label={log.severity.toUpperCase()}
                          color={getSeverityColor(log.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {log.ipAddress}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(log)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={openDetailDialog}
        onClose={() => setOpenDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Audit Log Details</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Timestamp</Typography>
                <Typography variant="body1" gutterBottom>
                  {format(selectedLog.timestamp, 'MMM dd, yyyy HH:mm:ss')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">User</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedLog.user.name} ({selectedLog.user.email})
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Action</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedLog.action.replace('_', ' ').toUpperCase()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Resource</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedLog.resource} ({selectedLog.resourceId})
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedLog.description}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">IP Address</Typography>
                <Typography variant="body1" fontFamily="monospace" gutterBottom>
                  {selectedLog.ipAddress}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Severity</Typography>
                <Chip
                  icon={getSeverityIcon(selectedLog.severity)}
                  label={selectedLog.severity.toUpperCase()}
                  color={getSeverityColor(selectedLog.severity)}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">User Agent</Typography>
                <Typography variant="body2" fontFamily="monospace" gutterBottom>
                  {selectedLog.userAgent}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Additional Details</Typography>
                <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <pre style={{ fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AuditLog;