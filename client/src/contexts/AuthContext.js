import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import apiClient from '../utils/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  // Check if user is authenticated on app load
  useQuery(
    'currentUser',
    async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.get('/auth/me');
      return response.data.data;
    },
    {
      retry: false,
      enabled: !!localStorage.getItem('token'),
      onSuccess: (data) => {
        setUser(data);
        setLoading(false);
      },
      onError: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
      },
    }
  );

  // Initialize auth state
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/login', credentials);
      const { user, token } = response.data.data;

      // Store token and user data
      localStorage.setItem('token', token);
      setUser(user);

      // Update React Query cache
      queryClient.setQueryData('currentUser', user);

      toast.success(`Welcome back, ${user.firstName}!`);
      
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/register', userData);
      const { user, token } = response.data.data;

      // Store token and user data
      localStorage.setItem('token', token);
      setUser(user);

      // Update React Query cache
      queryClient.setQueryData('currentUser', user);

      toast.success(`Welcome to the platform, ${user.firstName}!`);
      
      return { success: true, user };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate server-side session if needed
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if server call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      
      // Clear React Query cache
      queryClient.clear();
      
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiClient.put('/users/profile', profileData);
      const updatedUser = response.data.data;
      
      setUser(updatedUser);
      queryClient.setQueryData('currentUser', updatedUser);
      
      toast.success('Profile updated successfully');
      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const refreshToken = async () => {
    try {
      const response = await apiClient.post('/auth/refresh');
      const { token } = response.data.data;
      
      localStorage.setItem('token', token);
      return token;
    } catch (error) {
      // If refresh fails, logout user
      logout();
      throw error;
    }
  };

  const hasRole = (requiredRoles) => {
    if (!user || !requiredRoles) return false;
    
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    
    return user.role === requiredRoles;
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Define role-based permissions
    const rolePermissions = {
      admin: ['*'], // Admin has all permissions
      director: [
        'view_all_expenses',
        'approve_expenses',
        'view_analytics',
        'manage_users',
        'view_audit_log',
        'override_approvals'
      ],
      finance: [
        'view_all_expenses',
        'approve_expenses',
        'view_analytics',
        'process_reimbursements',
        'view_reports'
      ],
      manager: [
        'view_team_expenses',
        'approve_expenses',
        'view_team_analytics'
      ],
      employee: [
        'create_expenses',
        'view_own_expenses',
        'edit_draft_expenses'
      ]
    };

    const userPermissions = rolePermissions[user.role] || [];
    
    // Admin has all permissions
    if (userPermissions.includes('*')) return true;
    
    return userPermissions.includes(permission);
  };

  const isManager = () => hasRole(['manager', 'director', 'admin']);
  const isFinance = () => hasRole(['finance', 'director', 'admin']);
  const isAdmin = () => hasRole('admin');

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    hasRole,
    hasPermission,
    isManager,
    isFinance,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};