import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Container,
  Paper,
  Avatar,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from '@mui/material';
import {
  PersonAdd,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Person,
  Business,
  Phone,
  Badge,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Professional Information
    role: 'admin',
    department: '',
    employeeId: '',
    managerEmail: '',
    
    // Company Information (required for registration)
    companyName: '',
    country: '',
    industry: '',
    companySize: '',
    isFirstUser: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const steps = ['Personal Information', 'Professional Details', 'Review & Submit'];

  const departments = [
    'Engineering', 'Sales', 'Marketing', 'Human Resources', 'Finance',
    'Operations', 'Customer Support', 'Product Management', 'Design', 'Other'
  ];

  const companySizes = [
    '1-10 employees', '11-50 employees', '51-200 employees', 
    '201-1000 employees', '1000+ employees'
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Consulting', 'Real Estate', 'Non-profit', 'Other'
  ];

  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'IN', name: 'India' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'SG', name: 'Singapore' },
    { code: 'HK', name: 'Hong Kong' },
    { code: 'CN', name: 'China' },
    { code: 'BR', name: 'Brazil' },
    { code: 'MX', name: 'Mexico' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'SE', name: 'Sweden' },
    { code: 'NO', name: 'Norway' },
    { code: 'DK', name: 'Denmark' },
    { code: 'FI', name: 'Finland' },
    { code: 'NZ', name: 'New Zealand' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 0) {
      // Personal Information validation
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Please fill in this field';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
        newErrors.phone = 'Invalid phone number format';
      }
    }

    if (step === 1) {
      // Professional Information validation
      if (!formData.department.trim()) {
        newErrors.department = 'Department is required';
      }
      if (!formData.employeeId.trim()) {
        newErrors.employeeId = 'Employee ID is required';
      }
      if (formData.role === 'employee' && !formData.managerEmail.trim()) {
        newErrors.managerEmail = 'Manager email is required for employees';
      }
      if (formData.managerEmail && !/\S+@\S+\.\S+/.test(formData.managerEmail)) {
        newErrors.managerEmail = 'Please enter a valid email address';
      }
      
      // Company Information validation (now required)
      if (!formData.companyName.trim()) {
        newErrors.companyName = 'Company name is required and must be less than 200 characters';
      } else if (formData.companyName.trim().length > 200) {
        newErrors.companyName = 'Company name must be less than 200 characters';
      }
      if (!formData.country.trim()) {
        newErrors.country = 'Country code must be 2 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(1)) return;
    setLoading(true);
    setErrors({});

    try {
      // Format data according to backend API requirements
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        companyName: formData.companyName.trim(),
        country: formData.country.trim().toUpperCase(),
        industry: formData.industry || 'Other',
        department: formData.department.trim(),
        employeeId: formData.employeeId.trim(),
        companySize: formData.companySize,
      };
      if (formData.phone.trim()) {
        registrationData.phone = formData.phone.trim();
      }
      if (formData.managerEmail.trim()) {
        registrationData.managerEmail = formData.managerEmail.trim().toLowerCase();
      }

      const result = await register(registrationData);
      if (result.success) {
        setTimeout(() => {
          navigate('/login');
        }, 1200);
      } else {
        setErrors({ submit: result.error || 'Registration failed. Please try again.' });
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Registration failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const renderPersonalInformation = () => (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleChange}
            error={!!errors.firstName}
            helperText={errors.firstName}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleChange}
            error={!!errors.lastName}
            helperText={errors.lastName}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            required
            fullWidth
            name="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password || 'Minimum 8 characters'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            name="phone"
            label="Phone Number (Optional)"
            value={formData.phone}
            onChange={handleChange}
            error={!!errors.phone}
            helperText={errors.phone}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderProfessionalDetails = () => (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!!errors.role}>
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={formData.role}
              label="Role"
              onChange={handleChange}
            >
              <MenuItem value="employee">Employee</MenuItem>
              <MenuItem value="manager">Manager</MenuItem>
              <MenuItem value="finance">Finance</MenuItem>
              <MenuItem value="director">Director</MenuItem>
              <MenuItem value="admin">Administrator</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={!!errors.department}>
            <InputLabel>Department</InputLabel>
            <Select
              name="department"
              value={formData.department}
              label="Department"
              onChange={handleChange}
            >
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            name="employeeId"
            label="Employee ID"
            value={formData.employeeId}
            onChange={handleChange}
            error={!!errors.employeeId}
            helperText={errors.employeeId}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Badge />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            name="managerEmail"
            label="Manager Email"
            type="email"
            value={formData.managerEmail}
            onChange={handleChange}
            error={!!errors.managerEmail}
            helperText={errors.managerEmail || (formData.role === 'employee' ? 'Required for employees' : 'Optional')}
            required={formData.role === 'employee'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      {/* Company setup section - now required */}
      <Box sx={{ mt: 3 }}>
        <Divider sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Company Information (Required)
          </Typography>
        </Divider>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              name="companyName"
              label="Company Name"
              value={formData.companyName}
              onChange={handleChange}
              error={!!errors.companyName}
              helperText={errors.companyName || 'Enter your company name (max 200 characters)'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Business />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required error={!!errors.country}>
              <InputLabel>Country</InputLabel>
              <Select
                name="country"
                value={formData.country}
                label="Country"
                onChange={handleChange}
              >
                {countries.map((country) => (
                  <MenuItem key={country.code} value={country.code}>
                    {country.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.country && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                  {errors.country}
                </Typography>
              )}
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Industry</InputLabel>
              <Select
                name="industry"
                value={formData.industry}
                label="Industry"
                onChange={handleChange}
              >
                {industries.map((industry) => (
                  <MenuItem key={industry} value={industry}>
                    {industry}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Company Size</InputLabel>
              <Select
                name="companySize"
                value={formData.companySize}
                label="Company Size"
                onChange={handleChange}
              >
                {companySizes.map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  const renderReview = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Review Your Information
      </Typography>
      
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom color="primary">
          Personal Information
        </Typography>
        <Typography variant="body2">
          <strong>Name:</strong> {formData.firstName} {formData.lastName}
        </Typography>
        <Typography variant="body2">
          <strong>Email:</strong> {formData.email}
        </Typography>
        {formData.phone && (
          <Typography variant="body2">
            <strong>Phone:</strong> {formData.phone}
          </Typography>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom color="primary">
          Professional Details
        </Typography>
        <Typography variant="body2">
          <strong>Role:</strong> {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
        </Typography>
        <Typography variant="body2">
          <strong>Department:</strong> {formData.department}
        </Typography>
        <Typography variant="body2">
          <strong>Employee ID:</strong> {formData.employeeId}
        </Typography>
        {formData.managerEmail && (
          <Typography variant="body2">
            <strong>Manager Email:</strong> {formData.managerEmail}
          </Typography>
        )}
      </Paper>

      {formData.companyName && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom color="primary">
            Company Information
          </Typography>
          <Typography variant="body2">
            <strong>Company:</strong> {formData.companyName}
          </Typography>
          <Typography variant="body2">
            <strong>Country:</strong> {countries.find(c => c.code === formData.country)?.name || formData.country}
          </Typography>
          {formData.industry && (
            <Typography variant="body2">
              <strong>Industry:</strong> {formData.industry}
            </Typography>
          )}
          {formData.companySize && (
            <Typography variant="body2">
              <strong>Size:</strong> {formData.companySize}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return renderPersonalInformation();
      case 1:
        return renderProfessionalDetails();
      case 2:
        return renderReview();
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
          pb: 4,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            marginTop: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 4,
            borderRadius: 2,
            width: '100%',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
            <PersonAdd />
          </Avatar>
          
          <Typography component="h1" variant="h4" gutterBottom>
            Create Account
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Join the Expense Management System
          </Typography>

          <Stepper activeStep={activeStep} sx={{ width: '100%', mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {errors.submit && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {errors.submit}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {getStepContent(activeStep)}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              
              <Box sx={{ flex: '1 1 auto' }} />
              
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ py: 1.5, px: 4 }}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ py: 1.5, px: 4 }}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>

          <Box textAlign="center" sx={{ mt: 3 }}>
            <Link component={RouterLink} to="/login" variant="body2">
              Already have an account? Sign In
            </Link>
          </Box>
        </Paper>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
          © 2025 NextGen Expense Management System
        </Typography>
      </Box>
    </Container>
  );
};

export default Register;