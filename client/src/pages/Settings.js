import React, { useState, useEffect } from 'react';
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
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tab,
  Tabs,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save,
  PhotoCamera,
  Notifications,
  Security,
  Person,
  Palette,
  Backup,
  Delete,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../utils/apiClient';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    bio: ''
  });
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    currency: 'USD',
    timezone: 'UTC',
    notifications: {
      email: true,
      push: true,
      sms: false,
      expenseApproval: true,
      weeklyReports: true,
      monthlyReports: true
    }
  });
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    passwordLastChanged: new Date(),
    sessions: [
      { id: 1, device: 'Chrome on Windows', location: 'San Francisco, CA', lastActive: new Date(), current: true },
      { id: 2, device: 'Mobile App on iOS', location: 'San Francisco, CA', lastActive: new Date(Date.now() - 86400000), current: false }
    ]
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        bio: user.bio || ''
      });
    }
    fetchUserPreferences();
  }, [user]);

  const fetchUserPreferences = async () => {
    try {
      const response = await apiClient.get('/api/users/preferences');
      setPreferences(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.put('/api/users/profile', profileData);
      updateUser(response.data.user);
      // Show success message
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      await apiClient.put('/api/users/preferences', preferences);
      // Show success message
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      // Show error
      return;
    }
    
    try {
      setLoading(true);
      await apiClient.put('/api/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setOpenPasswordDialog(false);
      // Show success message
    } catch (error) {
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      setLoading(true);
      await apiClient.post('/api/users/2fa/toggle');
      setSecurity(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }));
    } catch (error) {
      console.error('Error toggling 2FA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId) => {
    try {
      await apiClient.delete(`/api/users/sessions/${sessionId}`);
      setSecurity(prev => ({
        ...prev,
        sessions: prev.sessions.filter(s => s.id !== sessionId)
      }));
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          ⚙️ Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab icon={<Person />} label="Profile" />
            <Tab icon={<Notifications />} label="Notifications" />
            <Tab icon={<Palette />} label="Preferences" />
            <Tab icon={<Security />} label="Security" />
            <Tab icon={<Backup />} label="Data & Privacy" />
          </Tabs>
        </Box>

        {/* Profile Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar
                    sx={{ width: 120, height: 120, mx: 'auto', mb: 2, fontSize: '3rem' }}
                  >
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {user?.role} • {user?.department}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Employee ID: {user?.employeeId}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PhotoCamera />}
                    sx={{ mt: 2 }}
                  >
                    Change Photo
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    value={profileData.department}
                    onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>Notification Preferences</Typography>
          <List>
            <ListItem>
              <ListItemText primary="Email Notifications" secondary="Receive notifications via email" />
              <ListItemSecondaryAction>
                <Switch
                  checked={preferences.notifications.email}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, email: e.target.checked }
                  }))}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText primary="Push Notifications" secondary="Receive browser push notifications" />
              <ListItemSecondaryAction>
                <Switch
                  checked={preferences.notifications.push}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, push: e.target.checked }
                  }))}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText primary="SMS Notifications" secondary="Receive notifications via text message" />
              <ListItemSecondaryAction>
                <Switch
                  checked={preferences.notifications.sms}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, sms: e.target.checked }
                  }))}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider sx={{ my: 2 }} />
            <ListItem>
              <ListItemText primary="Expense Approval Updates" secondary="Get notified when your expenses are approved or rejected" />
              <ListItemSecondaryAction>
                <Switch
                  checked={preferences.notifications.expenseApproval}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, expenseApproval: e.target.checked }
                  }))}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText primary="Weekly Reports" secondary="Receive weekly expense summaries" />
              <ListItemSecondaryAction>
                <Switch
                  checked={preferences.notifications.weeklyReports}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, weeklyReports: e.target.checked }
                  }))}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <ListItem>
              <ListItemText primary="Monthly Reports" secondary="Receive monthly expense analytics" />
              <ListItemSecondaryAction>
                <Switch
                  checked={preferences.notifications.monthlyReports}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, monthlyReports: e.target.checked }
                  }))}
                />
              </ListItemSecondaryAction>
            </ListItem>
          </List>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSavePreferences}
              disabled={loading}
            >
              Save Preferences
            </Button>
          </Box>
        </TabPanel>

        {/* Preferences Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>Display & Language</Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Theme</InputLabel>
                <Select
                  value={preferences.theme}
                  label="Theme"
                  onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="auto">Auto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Language</InputLabel>
                <Select
                  value={preferences.language}
                  label="Language"
                  onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Spanish</MenuItem>
                  <MenuItem value="fr">French</MenuItem>
                  <MenuItem value="de">German</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Currency</InputLabel>
                <Select
                  value={preferences.currency}
                  label="Currency"
                  onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                >
                  <MenuItem value="USD">USD - US Dollar</MenuItem>
                  <MenuItem value="EUR">EUR - Euro</MenuItem>
                  <MenuItem value="GBP">GBP - British Pound</MenuItem>
                  <MenuItem value="CAD">CAD - Canadian Dollar</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={preferences.timezone}
                  label="Timezone"
                  onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                >
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="America/New_York">Eastern Time</MenuItem>
                  <MenuItem value="America/Chicago">Central Time</MenuItem>
                  <MenuItem value="America/Denver">Mountain Time</MenuItem>
                  <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSavePreferences}
              disabled={loading}
            >
              Save Preferences
            </Button>
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h6" gutterBottom>Account Security</Typography>
          
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Password</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Last changed: {security.passwordLastChanged.toLocaleDateString()}
              </Typography>
              <Button variant="outlined" onClick={() => setOpenPasswordDialog(true)}>
                Change Password
              </Button>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1">Two-Factor Authentication</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add an extra layer of security to your account
                  </Typography>
                </Box>
                <Switch
                  checked={security.twoFactorEnabled}
                  onChange={handleToggle2FA}
                  disabled={loading}
                />
              </Box>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Active Sessions</Typography>
              <List>
                {security.sessions.map((session) => (
                  <ListItem key={session.id} divider>
                    <ListItemText
                      primary={session.device}
                      secondary={`${session.location} • Last active: ${session.lastActive.toLocaleString()}`}
                    />
                    <ListItemSecondaryAction>
                      {session.current ? (
                        <Typography variant="body2" color="success.main">Current</Typography>
                      ) : (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleTerminateSession(session.id)}
                        >
                          Terminate
                        </Button>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Data & Privacy Tab */}
        <TabPanel value={activeTab} index={4}>
          <Typography variant="h6" gutterBottom>Data & Privacy</Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Your data is important to us. Learn more about how we protect your privacy.
          </Alert>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Export Data</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Download a copy of your expense data and account information
              </Typography>
              <Button variant="outlined" startIcon={<Backup />}>
                Download My Data
              </Button>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>Delete Account</Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Permanently delete your account and all associated data. This action cannot be undone.
              </Typography>
              <Button variant="outlined" color="error" startIcon={<Delete />}>
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabPanel>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Current Password"
            type={showPasswords.current ? 'text' : 'password'}
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                >
                  {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="New Password"
            type={showPasswords.new ? 'text' : 'password'}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                >
                  {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Confirm New Password"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                >
                  {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleChangePassword} disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;