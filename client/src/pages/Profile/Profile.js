import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Switch,
  FormControlLabel,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoIcon,
  Key as KeyIcon,
  VpnKey as VpnKeyIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  
  // Form states
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    employeeId: user?.employeeId || '',
    bio: user?.bio || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [notifications, setNotifications] = useState({
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    pushNotifications: user?.preferences?.pushNotifications ?? true,
    expenseReminders: user?.preferences?.expenseReminders ?? true,
    approvalNotifications: user?.preferences?.approvalNotifications ?? true,
    weeklyReports: user?.preferences?.weeklyReports ?? false
  });

  // Fetch user profile
  const { data: fullProfile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiClient.users.getProfile()
  });

  // Fetch user's recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['user-activity'],
    queryFn: () => apiClient.users.getRecentActivity({ limit: 10 })
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => apiClient.users.updateProfile(data),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      queryClient.invalidateQueries(['user-profile']);
      setEditMode(false);
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data) => apiClient.auth.changePassword(data),
    onSuccess: () => {
      setShowPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (preferences) => apiClient.users.updatePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile']);
    }
  });

  const handleProfileChange = (field) => (event) => {
    setProfileData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordChange = (field) => (event) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      // Handle password mismatch
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    });
  };

  const handleNotificationChange = (setting) => (event) => {
    const newNotifications = {
      ...notifications,
      [setting]: event.target.checked
    };
    setNotifications(newNotifications);
    updatePreferencesMutation.mutate({ notifications: newNotifications });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const generateApiKey = () => {
    // Implementation for generating new API key
    setShowApiKeyDialog(true);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                <Avatar
                  sx={{ width: 100, height: 100, margin: '0 auto', mb: 2 }}
                  src={user?.avatar}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                  size="small"
                >
                  <PhotoIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Typography variant="h5" gutterBottom>
                {user?.firstName} {user?.lastName}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {user?.department} • {user?.role}
              </Typography>
              
              <Chip
                label={user?.status || 'Active'}
                color="success"
                size="small"
                sx={{ mb: 2 }}
              />
              
              {user?.bio && (
                <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                  "{user.bio}"
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Stats
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {fullProfile?.stats?.totalExpenses || 0}
                    </Typography>
                    <Typography variant="caption">
                      Total Expenses
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="secondary">
                      {fullProfile?.stats?.pendingApprovals || 0}
                    </Typography>
                    <Typography variant="caption">
                      Pending
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Personal Info" />
                <Tab label="Security" />
                <Tab label="Notifications" />
                <Tab label="Activity" />
              </Tabs>
            </Box>

            {/* Personal Info Tab */}
            {activeTab === 0 && (
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Personal Information</Typography>
                  {!editMode ? (
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => setEditMode(true)}
                    >
                      Edit
                    </Button>
                  ) : (
                    <Box>
                      <Button
                        startIcon={<CancelIcon />}
                        onClick={() => {
                          setEditMode(false);
                          setProfileData({
                            firstName: user?.firstName || '',
                            lastName: user?.lastName || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                            department: user?.department || '',
                            employeeId: user?.employeeId || '',
                            bio: user?.bio || ''
                          });
                        }}
                        sx={{ mr: 1 }}
                      >
                        Cancel
                      </Button>
                      <LoadingButton
                        startIcon={<SaveIcon />}
                        loading={updateProfileMutation.isPending}
                        onClick={handleSaveProfile}
                        variant="contained"
                      >
                        Save
                      </LoadingButton>
                    </Box>
                  )}
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profileData.firstName}
                      onChange={handleProfileChange('firstName')}
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profileData.lastName}
                      onChange={handleProfileChange('lastName')}
                      disabled={!editMode}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={profileData.email}
                      onChange={handleProfileChange('email')}
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      value={profileData.phone}
                      onChange={handleProfileChange('phone')}
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: <PhoneIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Department"
                      value={profileData.department}
                      onChange={handleProfileChange('department')}
                      disabled={!editMode}
                      InputProps={{
                        startAdornment: <BusinessIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Employee ID"
                      value={profileData.employeeId}
                      onChange={handleProfileChange('employeeId')}
                      disabled={!editMode}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      value={profileData.bio}
                      onChange={handleProfileChange('bio')}
                      disabled={!editMode}
                      multiline
                      rows={3}
                      placeholder="Tell us about yourself..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            )}

            {/* Security Tab */}
            {activeTab === 1 && (
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Security Settings
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <KeyIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Password"
                      secondary="Change your account password"
                    />
                    <Button
                      variant="outlined"
                      onClick={() => setShowPasswordDialog(true)}
                    >
                      Change Password
                    </Button>
                  </ListItem>
                  
                  <Divider />
                  
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <VpnKeyIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="API Key"
                      secondary="Generate API key for third-party integrations"
                    />
                    <Button
                      variant="outlined"
                      onClick={generateApiKey}
                    >
                      Generate Key
                    </Button>
                  </ListItem>
                  
                  <Divider />
                  
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <SecurityIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Two-Factor Authentication"
                      secondary="Add an extra layer of security to your account"
                    />
                    <Switch disabled />
                  </ListItem>
                </List>
              </CardContent>
            )}

            {/* Notifications Tab */}
            {activeTab === 2 && (
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <NotificationsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Notification Preferences
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Email Notifications"
                      secondary="Receive notifications via email"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.emailNotifications}
                          onChange={handleNotificationChange('emailNotifications')}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Push Notifications"
                      secondary="Receive push notifications in browser"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.pushNotifications}
                          onChange={handleNotificationChange('pushNotifications')}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Expense Reminders"
                      secondary="Get reminded about pending expense submissions"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.expenseReminders}
                          onChange={handleNotificationChange('expenseReminders')}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Approval Notifications"
                      secondary="Get notified when expenses need approval"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.approvalNotifications}
                          onChange={handleNotificationChange('approvalNotifications')}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemText
                      primary="Weekly Reports"
                      secondary="Receive weekly expense summary reports"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications.weeklyReports}
                          onChange={handleNotificationChange('weeklyReports')}
                        />
                      }
                      label=""
                    />
                  </ListItem>
                </List>
              </CardContent>
            )}

            {/* Activity Tab */}
            {activeTab === 3 && (
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                
                {(!recentActivity || recentActivity.length === 0) ? (
                  <Typography variant="body2" color="textSecondary">
                    No recent activity
                  </Typography>
                ) : (
                  <List>
                    {recentActivity.map((activity, index) => (
                      <ListItem key={index}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {activity.type === 'expense' ? '💰' : '📋'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.description}
                          secondary={new Date(activity.timestamp).toLocaleString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Current Password"
            type="password"
            fullWidth
            value={passwordData.currentPassword}
            onChange={handlePasswordChange('currentPassword')}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            value={passwordData.newPassword}
            onChange={handlePasswordChange('newPassword')}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Confirm New Password"
            type="password"
            fullWidth
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange('confirmPassword')}
          />
          
          {passwordData.newPassword && passwordData.confirmPassword && 
           passwordData.newPassword !== passwordData.confirmPassword && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Passwords do not match
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleChangePassword}
            loading={changePasswordMutation.isPending}
            variant="contained"
            disabled={
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              passwordData.newPassword !== passwordData.confirmPassword
            }
          >
            Change Password
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* API Key Dialog */}
      <Dialog
        open={showApiKeyDialog}
        onClose={() => setShowApiKeyDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>API Key</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Keep your API key secure. It provides access to your account data.
          </Alert>
          <TextField
            fullWidth
            label="API Key"
            value="your-api-key-here"
            InputProps={{
              readOnly: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApiKeyDialog(false)}>
            Close
          </Button>
          <Button variant="contained">
            Regenerate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Alerts */}
      {updateProfileMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error updating profile: {updateProfileMutation.error?.message}
        </Alert>
      )}
      
      {changePasswordMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error changing password: {changePasswordMutation.error?.message}
        </Alert>
      )}
    </Box>
  );
};

export default Profile;