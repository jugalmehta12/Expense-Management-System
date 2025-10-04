import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { Helmet } from 'react-helmet';

import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load pages for better performance
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const ExpenseDetails = React.lazy(() => import('./pages/ExpenseDetails'));
const CreateExpense = React.lazy(() => import('./pages/CreateExpense'));
const Approvals = React.lazy(() => import('./pages/Approvals'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Profile = React.lazy(() => import('./pages/Profile'));
const CompanySettings = React.lazy(() => import('./pages/CompanySettings'));
const UserManagement = React.lazy(() => import('./pages/UserManagement'));
const Reports = React.lazy(() => import('./pages/Reports'));
const AuditLog = React.lazy(() => import('./pages/AuditLog'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Fallback loading component
const PageLoader = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="200px"
  >
    <CircularProgress />
  </Box>
);

function App() {
  const { user, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Helmet>
        <title>NextGen Expense Management System</title>
        <meta 
          name="description" 
          content="AI-powered expense reimbursement and approval management system for enterprises" 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1976d2" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="manifest" href="/manifest.json" />
      </Helmet>

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/dashboard" replace /> : <Login />
            } 
          />
          <Route 
            path="/register" 
            element={
              user ? <Navigate to="/dashboard" replace /> : <Register />
            } 
          />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Expenses */}
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/expenses/new" element={<CreateExpense />} />
              <Route path="/expenses/:id" element={<ExpenseDetails />} />
              
              {/* Approvals */}
              <Route 
                path="/approvals" 
                element={
                  <ProtectedRoute 
                    roles={['manager', 'finance', 'director', 'admin']}
                  >
                    <Approvals />
                  </ProtectedRoute>
                } 
              />
              
              {/* Analytics */}
              <Route 
                path="/analytics" 
                element={
                  <ProtectedRoute 
                    roles={['manager', 'finance', 'director', 'admin']}
                  >
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              
              {/* Reports */}
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute 
                    roles={['finance', 'director', 'admin']}
                  >
                    <Reports />
                  </ProtectedRoute>
                } 
              />
              
              {/* User Profile */}
              <Route path="/profile" element={<Profile />} />
              
              {/* Settings */}
              <Route path="/settings" element={<Settings />} />
              
              {/* Company Management */}
              <Route 
                path="/company" 
                element={
                  <ProtectedRoute roles={['admin']}>
                    <CompanySettings />
                  </ProtectedRoute>
                } 
              />
              
              {/* User Management */}
              <Route 
                path="/users" 
                element={
                  <ProtectedRoute roles={['admin', 'director']}>
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />
              
              {/* Audit Log */}
              <Route 
                path="/audit" 
                element={
                  <ProtectedRoute roles={['admin', 'director']}>
                    <AuditLog />
                  </ProtectedRoute>
                } 
              />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route 
            path="/" 
            element={
              <Navigate 
                to={user ? "/dashboard" : "/login"} 
                replace 
              />
            } 
          />

          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
