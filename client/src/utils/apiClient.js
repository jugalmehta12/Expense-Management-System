import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshResponse = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        const { token } = refreshResponse.data.data;
        localStorage.setItem('token', token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    } else {
      // Handle other HTTP errors
      const status = error.response.status;
      const message = error.response.data?.message || 'An error occurred';

      switch (status) {
        case 400:
          // Bad Request - usually validation errors
          if (error.response.data?.errors) {
            error.response.data.errors.forEach((err) => {
              toast.error(err.msg || err.message);
            });
          } else {
            toast.error(message);
          }
          break;
        case 403:
          toast.error('Access denied. You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 409:
          toast.error(message || 'Conflict error. Resource already exists.');
          break;
        case 413:
          toast.error('File too large. Please select a smaller file.');
          break;
        case 429:
          toast.error('Too many requests. Please wait a moment and try again.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        case 502:
        case 503:
        case 504:
          toast.error('Service temporarily unavailable. Please try again later.');
          break;
        default:
          if (status >= 400) {
            toast.error(message);
          }
      }
    }

    return Promise.reject(error);
  }
);

// Helper functions for different HTTP methods
export const api = {
  get: (url, config = {}) => apiClient.get(url, config),
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config),
  delete: (url, config = {}) => apiClient.delete(url, config),
};

// Specialized functions for file uploads
export const uploadFile = (url, formData, onUploadProgress = null) => {
  return apiClient.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
};

// Function to download files
export const downloadFile = async (url, filename) => {
  try {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    // Create blob link to download
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(link.href);
    
    toast.success('File downloaded successfully');
  } catch (error) {
    toast.error('Download failed');
    throw error;
  }
};

// Function to get current user's info
export const getCurrentUser = () => api.get('/auth/me');

// Authentication API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  validateToken: () => api.post('/auth/validate-token'),
};

// Expense API calls
export const expenseAPI = {
  getExpenses: (params = {}) => api.get('/expenses', { params }),
  getExpense: (id) => api.get(`/expenses/${id}`),
  createExpense: (data) => uploadFile('/expenses', data),
  updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
  submitExpense: (id) => api.patch(`/expenses/${id}/submit`),
  getPendingApprovals: (params = {}) => api.get('/expenses/pending-approvals', { params }),
};

// Approval API calls
export const approvalAPI = {
  approveExpense: (id, data) => api.post(`/approvals/${id}/approve`, data),
  rejectExpense: (id, data) => api.post(`/approvals/${id}/reject`, data),
  overrideApproval: (id, data) => api.post(`/approvals/${id}/override`, data),
  getApprovalHistory: (id) => api.get(`/approvals/${id}/history`),
};

// User API calls
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getUsers: (params = {}) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  changePassword: (data) => api.put('/users/change-password', data),
};

// Company API calls
export const companyAPI = {
  getCompany: () => api.get('/companies/current'),
  updateCompany: (data) => api.put('/companies/current', data),
  getSettings: () => api.get('/companies/settings'),
  updateSettings: (data) => api.put('/companies/settings', data),
  getEmployees: (params = {}) => api.get('/companies/employees', { params }),
};

// Currency API calls
export const currencyAPI = {
  getSupportedCurrencies: () => api.get('/currency/supported'),
  convertCurrency: (data) => api.post('/currency/convert', data),
  getExchangeRate: (from, to) => api.get(`/currency/rate/${from}/${to}`),
  getHistoricalRates: (params) => api.get('/currency/historical', { params }),
};

// Analytics API calls
export const analyticsAPI = {
  getDashboardStats: (params = {}) => api.get('/analytics/dashboard', { params }),
  getExpensesByCategory: (params = {}) => api.get('/analytics/expenses-by-category', { params }),
  getSpendingTrends: (params = {}) => api.get('/analytics/spending-trends', { params }),
  getApprovalStats: (params = {}) => api.get('/analytics/approval-stats', { params }),
  getUserStats: (params = {}) => api.get('/analytics/user-stats', { params }),
  exportReport: (params = {}) => api.get('/analytics/export', { params, responseType: 'blob' }),
};

// OCR API calls
export const ocrAPI = {
  processReceipt: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return uploadFile('/ocr/process', formData, onUploadProgress);
  },
  getOCRHistory: (params = {}) => api.get('/ocr/history', { params }),
};

// Audit API calls
export const auditAPI = {
  getAuditLog: (params = {}) => api.get('/audit', { params }),
  getExpenseAudit: (id) => api.get(`/audit/expense/${id}`),
  getUserAudit: (id, params = {}) => api.get(`/audit/user/${id}`, { params }),
};

export default apiClient;