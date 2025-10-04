import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Box,
  IconButton,
  Badge,
  Avatar,
  Chip,
  Divider,
  Button,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  MarkEmailRead as MarkReadIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

const NotificationPanel = ({ open, onClose, notifications = [], onMarkAsRead, onDelete }) => {
  const [localNotifications, setLocalNotifications] = useState(notifications);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const getNotificationIcon = (type) => {
    const iconProps = { fontSize: 'small' };
    
    switch (type) {
      case 'expense_approved':
        return <CheckCircleIcon color="success" {...iconProps} />;
      case 'expense_rejected':
        return <CancelIcon color="error" {...iconProps} />;
      case 'expense_submitted':
        return <ReceiptIcon color="info" {...iconProps} />;
      case 'expense_reminder':
        return <WarningIcon color="warning" {...iconProps} />;
      case 'system':
        return <InfoIcon color="primary" {...iconProps} />;
      case 'user_action':
        return <PersonIcon color="secondary" {...iconProps} />;
      default:
        return <InfoIcon color="primary" {...iconProps} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'expense_approved':
        return 'success';
      case 'expense_rejected':
        return 'error';
      case 'expense_submitted':
        return 'info';
      case 'expense_reminder':
        return 'warning';
      case 'system':
        return 'primary';
      case 'user_action':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleMarkAsRead = (notificationId) => {
    setLocalNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    if (onMarkAsRead) {
      onMarkAsRead(notificationId);
    }
  };

  const handleDelete = (notificationId) => {
    setLocalNotifications(prev =>
      prev.filter(notif => notif.id !== notificationId)
    );
    if (onDelete) {
      onDelete(notificationId);
    }
  };

  const unreadCount = localNotifications.filter(n => !n.read).length;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 400, maxWidth: '90vw' }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error" />
          )}
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider />

      {localNotifications.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="info">
            No notifications yet. You'll see important updates here!
          </Alert>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {localNotifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem
                sx={{
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  opacity: notification.read ? 0.7 : 1,
                  py: 2,
                }}
              >
                <ListItemIcon>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      backgroundColor: `${getNotificationColor(notification.type)}.light`,
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {notification.title}
                      </Typography>
                      {!notification.read && (
                        <Chip label="New" color="primary" size="small" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                  }
                />
                
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {!notification.read && (
                      <IconButton
                        size="small"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <MarkReadIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(notification.id)}
                      title="Delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
              
              {index < localNotifications.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {localNotifications.length > 0 && (
        <>
          <Divider />
          <Box sx={{ p: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                localNotifications.forEach(n => {
                  if (!n.read) handleMarkAsRead(n.id);
                });
              }}
              disabled={unreadCount === 0}
            >
              Mark All as Read
            </Button>
          </Box>
        </>
      )}
    </Drawer>
  );
};

export default NotificationPanel;