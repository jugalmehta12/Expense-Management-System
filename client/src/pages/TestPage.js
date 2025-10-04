import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  AccountCircle as ProfileIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../contexts/NotificationContext';
import toast from 'react-hot-toast';

const TestPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();

  const handleTestNotification = () => {
    const notificationTypes = [
      {
        type: 'expense_approved',
        title: 'Test: Expense Approved',
        message: 'Your test expense has been approved by the system.',
      },
      {
        type: 'expense_submitted',
        title: 'Test: New Expense Submitted',
        message: 'A test expense has been submitted for review.',
      },
      {
        type: 'system',
        title: 'Test: System Notification',
        message: 'This is a test system notification.',
      },
    ];

    const randomNotification = notificationTypes[
      Math.floor(Math.random() * notificationTypes.length)
    ];

    addNotification(randomNotification);
    toast.success('Test notification added!');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Feature Test Page
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Page Test
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                The profile page has been completely rebuilt with:
                <ul>
                  <li>Personal information editing</li>
                  <li>Notification preferences</li>
                  <li>Password change functionality</li>
                  <li>Account status display</li>
                </ul>
              </Alert>
              
              <Button
                variant="contained"
                startIcon={<ProfileIcon />}
                onClick={() => navigate('/profile')}
                fullWidth
              >
                Test Profile Page
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notification System Test
              </Typography>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                The notification system includes:
                <ul>
                  <li>Real-time notification panel</li>
                  <li>Badge with unread count</li>
                  <li>Mark as read functionality</li>
                  <li>Delete notifications</li>
                  <li>Auto-generating mock notifications</li>
                </ul>
              </Alert>
              
              <Button
                variant="contained"
                startIcon={<NotificationsIcon />}
                onClick={handleTestNotification}
                fullWidth
                sx={{ mb: 2 }}
              >
                Add Test Notification
              </Button>
              
              <Typography variant="body2" color="text.secondary">
                Click the notification bell icon in the top-right corner to view notifications.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Implementation Notes
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  ✅ Profile Page Features:
                </Typography>
                <ul>
                  <li>Complete user profile editing with form validation</li>
                  <li>Profile picture placeholder with edit functionality</li>
                  <li>Notification preferences with toggle switches</li>
                  <li>Password change dialog with validation</li>
                  <li>Account status and member information</li>
                  <li>Role-based color coding</li>
                </ul>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  ✅ Notification System Features:
                </Typography>
                <ul>
                  <li>Notification context for global state management</li>
                  <li>Sliding notification panel from the right</li>
                  <li>Different notification types with icons and colors</li>
                  <li>Real-time badge count updates</li>
                  <li>Mark as read and delete functionality</li>
                  <li>Auto-generating mock notifications every 30 seconds</li>
                  <li>Responsive design for mobile and desktop</li>
                </ul>
                
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  📝 Todo for Production:
                </Typography>
                <ul>
                  <li>Replace mock notifications with real API calls</li>
                  <li>Implement WebSocket/Socket.IO for real-time updates</li>
                  <li>Add profile picture upload functionality</li>
                  <li>Connect password change to backend API</li>
                  <li>Add email notification preferences to backend</li>
                </ul>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TestPage;