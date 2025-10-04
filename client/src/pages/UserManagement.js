import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
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
  Avatar,
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
  Switch,
  FormControlLabel,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Edit,
  Search,
  FilterList,
  PersonAdd,
  Groups,
  AdminPanelSettings,
  Block,
  CheckCircle,
  Business,
  Visibility
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';

const UserManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'employee',
    department: '',
    manager: '',
    isActive: true
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/users');
      setUsers(response.data.users || []);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching users:', error);
      // Mock data for demo
      setUsers(getMockUsers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getMockUsers = () => [
    {
      _id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'testuser456@example.com',
      role: 'employee',
      department: 'Engineering',
      employeeId: 'TECH-0001',
      isActive: true,
      lastLogin: new Date('2025-10-03'),
      manager: { firstName: 'Sarah', lastName: 'Connor' },
      expenses: { total: 15, pending: 3, approved: 12 }
    },
    {
      _id: '2',
      firstName: 'Sarah',
      lastName: 'Connor',
      email: 'manager@example.com',
      role: 'manager',
      department: 'Engineering',
      employeeId: 'TECH-0002',
      isActive: true,
      lastLogin: new Date('2025-10-04'),
      manager: null,
      expenses: { total: 8, pending: 1, approved: 7 },
      subordinates: ['1', '5']
    },
    {
      _id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'finance@example.com',
      role: 'finance',
      department: 'Finance',
      employeeId: 'TECH-0003',
      isActive: true,
      lastLogin: new Date('2025-10-04'),
      manager: null,
      expenses: { total: 12, pending: 2, approved: 10 }
    },
    {
      _id: '4',
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'director@example.com',
      role: 'director',
      department: 'Operations',
      employeeId: 'TECH-0004',
      isActive: true,
      lastLogin: new Date('2025-10-03'),
      manager: null,
      expenses: { total: 20, pending: 1, approved: 19 }
    },
    {
      _id: '5',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      role: 'employee',
      department: 'Marketing',
      employeeId: 'TECH-0005',
      isActive: true,
      lastLogin: new Date('2025-10-02'),
      manager: { firstName: 'Sarah', lastName: 'Connor' },
      expenses: { total: 10, pending: 2, approved: 8 }
    },
    {
      _id: '6',
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@example.com',
      role: 'employee',
      department: 'Sales',
      employeeId: 'TECH-0006',
      isActive: false,
      lastLogin: new Date('2025-09-28'),
      manager: { firstName: 'Sarah', lastName: 'Connor' },
      expenses: { total: 5, pending: 0, approved: 5 }
    }
  ];

  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({
      firstName: '',
      lastName: '',
      email: '',
      role: 'employee',
      department: '',
      manager: '',
      isActive: true
    });
    setOpenUserDialog(true);
  };

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setUserForm({
      firstName: userToEdit.firstName,
      lastName: userToEdit.lastName,
      email: userToEdit.email,
      role: userToEdit.role,
      department: userToEdit.department,
      manager: userToEdit.manager?._id || '',
      isActive: userToEdit.isActive
    });
    setOpenUserDialog(true);
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        // Update user
        await apiClient.put(`/api/users/${editingUser._id}`, userForm);
        setUsers(prev => prev.map(u => 
          u._id === editingUser._id ? { ...u, ...userForm } : u
        ));
      } else {
        // Create user
        const response = await apiClient.post('/api/users/create', userForm);
        setUsers(prev => [...prev, response.data.user]);
      }
      setOpenUserDialog(false);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving user:', error);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await apiClient.patch(`/api/users/${userId}/status`, { isActive: !currentStatus });
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, isActive: !currentStatus } : u
      ));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating user status:', error);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'director': return 'warning';
      case 'manager': return 'info';
      case 'finance': return 'success';
      default: return 'default';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getUserStats = () => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const inactive = total - active;
    const byRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    return { total, active, inactive, byRole };
  };

  const stats = getUserStats();

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={40} />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            👥 User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage users, roles, and permissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={handleAddUser}
          disabled={user?.role !== 'admin' && user?.role !== 'director'}
        >
          Add User
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Users
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.total}
                  </Typography>
                </Box>
                <Groups sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Active Users
                  </Typography>
                  <Typography variant="h4" component="div" color="success.main">
                    {stats.active}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Inactive Users
                  </Typography>
                  <Typography variant="h4" component="div" color="error.main">
                    {stats.inactive}
                  </Typography>
                </Box>
                <Block sx={{ fontSize: 40, color: 'error.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Managers
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats.byRole.manager || 0}
                  </Typography>
                </Box>
                <AdminPanelSettings sx={{ fontSize: 40, color: 'info.main', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Role</InputLabel>
                <Select
                  value={roleFilter}
                  label="Filter by Role"
                  onChange={(e) => setRoleFilter(e.target.value)}
                  startAdornment={<FilterList sx={{ mr: 1 }} />}
                >
                  <MenuItem value="all">All Roles</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="director">Director</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="finance">Finance</MenuItem>
                  <MenuItem value="employee">Employee</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="body2" color="text.secondary">
                Showing {filteredUsers.length} of {users.length} users
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell>Expenses</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((userData) => (
                  <TableRow key={userData._id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {userData.firstName[0]}{userData.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {userData.firstName} {userData.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {userData.email}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            ID: {userData.employeeId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={userData.role}
                        color={getRoleColor(userData.role)}
                        size="small"
                        icon={<AdminPanelSettings />}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business fontSize="small" color="action" />
                        {userData.department}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {userData.manager ? (
                        <Typography variant="body2">
                          {userData.manager.firstName} {userData.manager.lastName}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Total Expenses">
                          <Chip label={userData.expenses.total} size="small" variant="outlined" />
                        </Tooltip>
                        <Tooltip title="Pending">
                          <Chip 
                            label={userData.expenses.pending} 
                            size="small" 
                            color="warning" 
                            variant={userData.expenses.pending > 0 ? "filled" : "outlined"}
                          />
                        </Tooltip>
                        <Tooltip title="Approved">
                          <Chip 
                            label={userData.expenses.approved} 
                            size="small" 
                            color="success" 
                            variant="outlined"
                          />
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={userData.isActive ? 'Active' : 'Inactive'}
                        color={userData.isActive ? 'success' : 'error'}
                        size="small"
                        icon={userData.isActive ? <CheckCircle /> : <Block />}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {userData.lastLogin.toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit User">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditUser(userData)}
                            disabled={user?.role !== 'admin' && user?.role !== 'director'}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={userData.isActive ? 'Deactivate' : 'Activate'}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleToggleUserStatus(userData._id, userData.isActive)}
                            disabled={user?.role !== 'admin' && user?.role !== 'director'}
                          >
                            {userData.isActive ? <Block /> : <CheckCircle />}
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

      {/* User Dialog */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={userForm.firstName}
                onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={userForm.lastName}
                onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={userForm.role}
                  label="Role"
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                >
                  <MenuItem value="employee">Employee</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                  <MenuItem value="finance">Finance</MenuItem>
                  <MenuItem value="director">Director</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={userForm.department}
                onChange={(e) => setUserForm(prev => ({ ...prev, department: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userForm.isActive}
                    onChange={(e) => setUserForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active User"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveUser}>
            {editingUser ? 'Update' : 'Create'} User
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;