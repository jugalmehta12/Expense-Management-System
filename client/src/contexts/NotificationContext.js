import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock notifications data - Replace with real API calls
  const generateMockNotifications = () => {
    const mockNotifications = [
      {
        id: '1',
        type: 'expense_approved',
        title: 'Expense Approved',
        message: 'Your expense report for $250.00 has been approved by John Manager.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        read: false,
      },
      {
        id: '2',
        type: 'expense_submitted',
        title: 'New Expense Submitted',
        message: 'Sarah Employee has submitted a new expense report for review.',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        read: false,
      },
      {
        id: '3',
        type: 'expense_reminder',
        title: 'Expense Reminder',
        message: 'You have 3 pending expense reports that need your review.',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        read: true,
      },
      {
        id: '4',
        type: 'system',
        title: 'System Update',
        message: 'The expense management system will undergo maintenance on Sunday at 2 AM.',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        read: false,
      },
      {
        id: '5',
        type: 'expense_rejected',
        title: 'Expense Rejected',
        message: 'Your expense report for $150.00 needs additional documentation.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
        read: true,
      },
    ];

    return mockNotifications;
  };

  // Initialize notifications when user logs in
  useEffect(() => {
    if (user) {
      const mockNotifications = generateMockNotifications();
      setNotifications(mockNotifications);
    } else {
      setNotifications([]);
    }
  }, [user]);

  // Update unread count whenever notifications change
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    
    // TODO: Call API to mark notification as read
    // await api.post(`/notifications/${notificationId}/read`);
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    // TODO: Call API to mark all notifications as read
    // await api.post('/notifications/mark-all-read');
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
    
    // TODO: Call API to delete notification
    // await api.delete(`/notifications/${notificationId}`);
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false,
      ...notification,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Simulate real-time notifications (replace with WebSocket/Socket.IO)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Randomly add a new notification (for demo purposes)
      if (Math.random() < 0.1) { // 10% chance every 30 seconds
        const randomNotifications = [
          {
            type: 'expense_submitted',
            title: 'New Expense Submitted',
            message: 'A team member has submitted a new expense for review.',
          },
          {
            type: 'expense_approved',
            title: 'Expense Approved',
            message: 'Your recent expense report has been approved.',
          },
          {
            type: 'system',
            title: 'System Notification',
            message: 'Your monthly expense summary is ready.',
          },
        ];
        
        const randomNotification = randomNotifications[
          Math.floor(Math.random() * randomNotifications.length)
        ];
        
        addNotification(randomNotification);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};