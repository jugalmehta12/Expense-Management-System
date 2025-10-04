import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import {
  Save,
  Add,
  Edit,
  Delete,
  Business,
  Policy,
  Category,
  Approval,
  Notifications
} from '@mui/icons-material';
import apiClient from '../utils/apiClient';

const CompanySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [companyData, setCompanyData] = useState(null);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', maxAmount: '', requiresReceipt: true });

  const fetchCompanySettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/companies/settings');
      setCompanyData(response.data);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching company settings:', error);
      // Mock data for demo
      setCompanyData(getMockCompanyData());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanySettings();
  }, [fetchCompanySettings]);

  const getMockCompanyData = () => ({
    company: {
      name: 'TechCorp Solutions Inc.',
      code: 'TECH',
      industry: 'Technology',
      size: 'medium',
      country: 'USA',
      defaultCurrency: 'USD',
      email: 'contact@techcorp.com',
      phone: '+1-555-0123',
      website: 'https://techcorp.com',
      address: {
        street: '123 Silicon Valley Blvd',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        zipCode: '94105'
      }
    },
    settings: {
      expenseCategories: [
        { id: 1, name: 'Travel', maxAmount: 2000, requiresReceipt: true, isActive: true },
        { id: 2, name: 'Meals', maxAmount: 100, requiresReceipt: true, isActive: true },
        { id: 3, name: 'Office Supplies', maxAmount: 500, requiresReceipt: false, isActive: true },
        { id: 4, name: 'Equipment', maxAmount: 1000, requiresReceipt: true, isActive: true },
        { id: 5, name: 'Transportation', maxAmount: 200, requiresReceipt: false, isActive: true }
      ],
      approvalRules: {
        defaultFlow: ['manager', 'finance'],
        amountThresholds: [
          { amount: 500, approvers: ['manager'] },
          { amount: 1000, approvers: ['manager', 'finance'] },
          { amount: 5000, approvers: ['manager', 'finance', 'director'] }
        ]
      },
      policies: {
        receiptRequired: 50,
        approvalRequired: 100,
        maxExpenseAge: 90,
        allowPersonalReimbursement: true,
        requirePreApproval: false
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        reminderFrequency: 'daily'
      }
    }
  });

  const handleSaveCompanyInfo = async (formData) => {
    try {
      setSaving(true);
      await apiClient.put('/api/companies/update', formData);
      setCompanyData(prev => ({ ...prev, company: { ...prev.company, ...formData } }));
      // Show success message
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving company info:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setNewCategory({ name: '', maxAmount: '', requiresReceipt: true });
    setOpenCategoryDialog(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({ ...category });
    setOpenCategoryDialog(true);
  };

  const handleSaveCategory = () => {
    if (editingCategory) {
      // Update existing category
      setCompanyData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          expenseCategories: prev.settings.expenseCategories.map(cat =>
            cat.id === editingCategory.id ? { ...cat, ...newCategory } : cat
          )
        }
      }));
    } else {
      // Add new category
      const newId = Math.max(...companyData.settings.expenseCategories.map(c => c.id)) + 1;
      setCompanyData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          expenseCategories: [...prev.settings.expenseCategories, { ...newCategory, id: newId, isActive: true }]
        }
      }));
    }
    setOpenCategoryDialog(false);
  };

  const handleDeleteCategory = (categoryId) => {
    setCompanyData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        expenseCategories: prev.settings.expenseCategories.filter(cat => cat.id !== categoryId)
      }
    }));
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={40} />
      </Container>
    );
  }

  if (!companyData) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Alert severity="error">Failed to load company settings.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          🏢 Company Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your company profile, expense categories, and policies
        </Typography>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<Business />} label="Company Info" />
            <Tab icon={<Category />} label="Expense Categories" />
            <Tab icon={<Approval />} label="Approval Rules" />
            <Tab icon={<Policy />} label="Policies" />
            <Tab icon={<Notifications />} label="Notifications" />
          </Tabs>
        </Box>

        {/* Company Information Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company Name"
                value={companyData.company.name}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  company: { ...prev.company, name: e.target.value }
                }))}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Company Code"
                value={companyData.company.code}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  company: { ...prev.company, code: e.target.value }
                }))}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Industry</InputLabel>
                <Select
                  value={companyData.company.industry}
                  label="Industry"
                  onChange={(e) => setCompanyData(prev => ({
                    ...prev,
                    company: { ...prev.company, industry: e.target.value }
                  }))}
                >
                  <MenuItem value="Technology">Technology</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Healthcare">Healthcare</MenuItem>
                  <MenuItem value="Manufacturing">Manufacturing</MenuItem>
                  <MenuItem value="Retail">Retail</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Company Size</InputLabel>
                <Select
                  value={companyData.company.size}
                  label="Company Size"
                  onChange={(e) => setCompanyData(prev => ({
                    ...prev,
                    company: { ...prev.company, size: e.target.value }
                  }))}
                >
                  <MenuItem value="startup">Startup (1-10)</MenuItem>
                  <MenuItem value="small">Small (11-50)</MenuItem>
                  <MenuItem value="medium">Medium (51-200)</MenuItem>
                  <MenuItem value="large">Large (201-1000)</MenuItem>
                  <MenuItem value="enterprise">Enterprise (1000+)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={companyData.company.email}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  company: { ...prev.company, email: e.target.value }
                }))}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Phone"
                value={companyData.company.phone}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  company: { ...prev.company, phone: e.target.value }
                }))}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Website"
                value={companyData.company.website}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  company: { ...prev.company, website: e.target.value }
                }))}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Street Address"
                value={companyData.company.address.street}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  company: {
                    ...prev.company,
                    address: { ...prev.company.address, street: e.target.value }
                  }
                }))}
                margin="normal"
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={companyData.company.address.city}
                    onChange={(e) => setCompanyData(prev => ({
                      ...prev,
                      company: {
                        ...prev.company,
                        address: { ...prev.company.address, city: e.target.value }
                      }
                    }))}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="ZIP Code"
                    value={companyData.company.address.zipCode}
                    onChange={(e) => setCompanyData(prev => ({
                      ...prev,
                      company: {
                        ...prev.company,
                        address: { ...prev.company.address, zipCode: e.target.value }
                      }
                    }))}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={() => handleSaveCompanyInfo(companyData.company)}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </TabPanel>

        {/* Expense Categories Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Expense Categories</Typography>
            <Button variant="contained" startIcon={<Add />} onClick={handleAddCategory}>
              Add Category
            </Button>
          </Box>
          <List>
            {companyData.settings.expenseCategories.map((category, index) => (
              <ListItem key={category.id} divider={index < companyData.settings.expenseCategories.length - 1}>
                <ListItemText
                  primary={category.name}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        label={`Max: $${category.maxAmount}`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={category.requiresReceipt ? 'Receipt Required' : 'No Receipt'}
                        size="small"
                        color={category.requiresReceipt ? 'primary' : 'default'}
                      />
                      <Chip
                        label={category.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={category.isActive ? 'success' : 'error'}
                      />
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton onClick={() => handleEditCategory(category)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteCategory(category.id)} color="error">
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* Approval Rules Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>Approval Workflow</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Amount Thresholds</Typography>
                  {companyData.settings.approvalRules.amountThresholds.map((threshold, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2">
                        Above ${threshold.amount}
                      </Typography>
                      <Box>
                        {threshold.approvers.map((approver, idx) => (
                          <Chip key={idx} label={approver} size="small" sx={{ mr: 0.5 }} />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>Default Flow</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {companyData.settings.approvalRules.defaultFlow.map((step, index) => (
                      <Chip key={index} label={`${index + 1}. ${step}`} variant="outlined" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Policies Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>Expense Policies</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Receipt Required Above ($)"
                type="number"
                value={companyData.settings.policies.receiptRequired}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    policies: { ...prev.settings.policies, receiptRequired: Number(e.target.value) }
                  }
                }))}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Approval Required Above ($)"
                type="number"
                value={companyData.settings.policies.approvalRequired}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    policies: { ...prev.settings.policies, approvalRequired: Number(e.target.value) }
                  }
                }))}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Maximum Expense Age (days)"
                type="number"
                value={companyData.settings.policies.maxExpenseAge}
                onChange={(e) => setCompanyData(prev => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    policies: { ...prev.settings.policies, maxExpenseAge: Number(e.target.value) }
                  }
                }))}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={companyData.settings.policies.allowPersonalReimbursement}
                    onChange={(e) => setCompanyData(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        policies: { ...prev.settings.policies, allowPersonalReimbursement: e.target.checked }
                      }
                    }))}
                  />
                }
                label="Allow Personal Reimbursement"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={companyData.settings.policies.requirePreApproval}
                    onChange={(e) => setCompanyData(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        policies: { ...prev.settings.policies, requirePreApproval: e.target.checked }
                      }
                    }))}
                  />
                }
                label="Require Pre-approval for Large Expenses"
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={4}>
          <Typography variant="h6" gutterBottom>Notification Settings</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={companyData.settings.notifications.emailNotifications}
                    onChange={(e) => setCompanyData(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        notifications: { ...prev.settings.notifications, emailNotifications: e.target.checked }
                      }
                    }))}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={companyData.settings.notifications.smsNotifications}
                    onChange={(e) => setCompanyData(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        notifications: { ...prev.settings.notifications, smsNotifications: e.target.checked }
                      }
                    }))}
                  />
                }
                label="SMS Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={companyData.settings.notifications.pushNotifications}
                    onChange={(e) => setCompanyData(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        notifications: { ...prev.settings.notifications, pushNotifications: e.target.checked }
                      }
                    }))}
                  />
                }
                label="Push Notifications"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Reminder Frequency</InputLabel>
                <Select
                  value={companyData.settings.notifications.reminderFrequency}
                  label="Reminder Frequency"
                  onChange={(e) => setCompanyData(prev => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      notifications: { ...prev.settings.notifications, reminderFrequency: e.target.value }
                    }
                  }))}
                >
                  <MenuItem value="never">Never</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Category Dialog */}
      <Dialog open={openCategoryDialog} onClose={() => setOpenCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Category Name"
            value={newCategory.name}
            onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Maximum Amount ($)"
            type="number"
            value={newCategory.maxAmount}
            onChange={(e) => setNewCategory(prev => ({ ...prev, maxAmount: Number(e.target.value) }))}
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={newCategory.requiresReceipt}
                onChange={(e) => setNewCategory(prev => ({ ...prev, requiresReceipt: e.target.checked }))}
              />
            }
            label="Requires Receipt"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoryDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveCategory}>
            {editingCategory ? 'Update' : 'Add'} Category
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CompanySettings;