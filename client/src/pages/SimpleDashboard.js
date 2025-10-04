import React from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  PendingActions,
  SmartToy,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock stats data
  const stats = [
    {
      title: 'Total Expenses',
      value: '$12,450',
      change: '+12%',
      icon: AccountBalance,
      color: 'primary',
      subtitle: 'This quarter'
    },
    {
      title: 'Pending Approvals',
      value: '8',
      change: '-5%',
      icon: PendingActions,
      color: 'warning',
      subtitle: 'Awaiting review'
    },
    {
      title: 'This Month',
      value: '$3,280',
      change: '+8%',
      icon: TrendingUp,
      color: 'success',
      subtitle: 'Current spending'
    },
    {
      title: 'AI Insights',
      value: '3',
      change: 'NEW',
      icon: SmartToy,
      color: 'info',
      subtitle: 'Smart recommendations'
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.firstName || 'User'}! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your expense management hub - Enterprise Dashboard
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/create-expense')}
          >
            New Expense
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 8
                }
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.subtitle}
                    </Typography>
                    <Typography variant="body2" color={stat.color === 'success' ? 'success.main' : 'info.main'}>
                      {stat.change}
                    </Typography>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}.main`,
                      width: 56,
                      height: 56,
                    }}
                  >
                    <stat.icon />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={() => navigate('/create-expense')}>
              Create Expense
            </Button>
            <Button variant="outlined" onClick={() => navigate('/my-expenses')}>
              View My Expenses
            </Button>
            <Button variant="outlined" onClick={() => navigate('/team-expenses')}>
              Team Expenses
            </Button>
            <Button variant="outlined" onClick={() => navigate('/analytics')}>
              Analytics
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Welcome Message */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom>
          🎉 ExpenseFlow Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your comprehensive expense management system is ready! Navigate using the sidebar to access all features.
        </Typography>
      </Box>
    </Container>
  );
};

export default Dashboard;