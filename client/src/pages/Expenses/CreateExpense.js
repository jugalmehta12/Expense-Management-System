import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  PhotoCamera as CameraIcon,
  Visibility as ViewIcon,
  AutoAwesome as AIIcon,
  Receipt as ReceiptIcon,
  Save as SaveIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';

const CreateExpense = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [ocrResults, setOcrResults] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [autoFillData, setAutoFillData] = useState(null);
  const [showAutoFillDialog, setShowAutoFillDialog] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      amount: '',
      currency: user?.company?.defaultCurrency || 'USD',
      date: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      description: '',
      vendor: '',
      location: ''
    }
  });

  // Fetch company expense categories
  const { data: categories } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: () => apiClient.companies.getExpenseCategories()
  });

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: (data) => apiClient.expenses.createExpense(data),
    onSuccess: (data) => {
      navigate(`/expenses/${data._id}`);
    }
  });

  // OCR processing mutation
  const ocrMutation = useMutation({
    mutationFn: (file) => apiClient.ocr.processReceipt(file),
    onSuccess: (result) => {
      setOcrResults(prev => [...prev, result]);
      
      // If OCR extracted data, show auto-fill dialog
      if (result.parsedData && Object.keys(result.parsedData).length > 0) {
        setAutoFillData(result.parsedData);
        setShowAutoFillDialog(true);
      }
    }
  });

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    
    files.forEach(file => {
      // Add to uploaded files
      const fileData = {
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file)
      };
      
      setUploadedFiles(prev => [...prev, fileData]);
      
      // Process with OCR if it's an image
      if (file.type.startsWith('image/')) {
        ocrMutation.mutate(file);
      }
    });
    
    // Reset input
    event.target.value = '';
  };

  const handleCameraCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileUpload({ target: { files: [file] } });
    }
    event.target.value = '';
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  const handleAutoFill = () => {
    if (autoFillData) {
      if (autoFillData.amount) setValue('amount', autoFillData.amount);
      if (autoFillData.vendor) setValue('vendor', autoFillData.vendor);
      if (autoFillData.date) setValue('date', format(new Date(autoFillData.date), 'yyyy-MM-dd'));
      if (autoFillData.category) setValue('category', autoFillData.category);
    }
    setShowAutoFillDialog(false);
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    
    // Add form fields
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    
    // Add files
    uploadedFiles.forEach(fileData => {
      formData.append('receipts', fileData.file);
    });
    
    createExpenseMutation.mutate(formData);
  };

  const onSaveDraft = async (data) => {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      formData.append(key, data[key]);
    });
    
    formData.append('status', 'draft');
    
    uploadedFiles.forEach(fileData => {
      formData.append('receipts', fileData.file);
    });
    
    createExpenseMutation.mutate(formData);
  };

  const watchedAmount = watch('amount');
  const watchedCurrency = watch('currency');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create New Expense
      </Typography>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Main Form */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Expense Details
                </Typography>
                
                <Grid container spacing={2}>
                  {/* Amount and Currency */}
                  <Grid item xs={12} sm={8}>
                    <Controller
                      name="amount"
                      control={control}
                      rules={{ 
                        required: 'Amount is required',
                        min: { value: 0.01, message: 'Amount must be greater than 0' }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Amount"
                          type="number"
                          fullWidth
                          error={!!errors.amount}
                          helperText={errors.amount?.message}
                          InputProps={{
                            inputProps: { step: 0.01, min: 0 }
                          }}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="currency"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <InputLabel>Currency</InputLabel>
                          <Select {...field} label="Currency">
                            <MenuItem value="USD">USD</MenuItem>
                            <MenuItem value="EUR">EUR</MenuItem>
                            <MenuItem value="GBP">GBP</MenuItem>
                            <MenuItem value="CAD">CAD</MenuItem>
                            <MenuItem value="AUD">AUD</MenuItem>
                            <MenuItem value="JPY">JPY</MenuItem>
                            <MenuItem value="INR">INR</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  
                  {/* Date */}
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="date"
                      control={control}
                      rules={{ required: 'Date is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Date"
                          type="date"
                          fullWidth
                          error={!!errors.date}
                          helperText={errors.date?.message}
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                  </Grid>
                  
                  {/* Category */}
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="category"
                      control={control}
                      rules={{ required: 'Category is required' }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.category}>
                          <InputLabel>Category</InputLabel>
                          <Select {...field} label="Category">
                            {categories?.map(category => (
                              <MenuItem key={category.name} value={category.name}>
                                {category.icon} {category.name}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.category && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, ml: 1 }}>
                              {errors.category.message}
                            </Typography>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>
                  
                  {/* Description */}
                  <Grid item xs={12}>
                    <Controller
                      name="description"
                      control={control}
                      rules={{ required: 'Description is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Description"
                          multiline
                          rows={3}
                          fullWidth
                          error={!!errors.description}
                          helperText={errors.description?.message}
                          placeholder="Describe your expense..."
                        />
                      )}
                    />
                  </Grid>
                  
                  {/* Vendor */}
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="vendor"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Vendor/Merchant"
                          fullWidth
                          placeholder="e.g., Starbucks, Amazon, etc."
                        />
                      )}
                    />
                  </Grid>
                  
                  {/* Location */}
                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Location"
                          fullWidth
                          placeholder="e.g., New York, NY"
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          {/* File Upload Section */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Receipt Upload
                </Typography>
                
                {/* Upload Buttons */}
                <Box sx={{ mb: 2 }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                  />
                  
                  <input
                    type="file"
                    ref={cameraInputRef}
                    onChange={handleCameraCapture}
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                  />
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<UploadIcon />}
                        onClick={() => fileInputRef.current?.click()}
                        size="small"
                      >
                        Upload
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        startIcon={<CameraIcon />}
                        onClick={() => cameraInputRef.current?.click()}
                        size="small"
                      >
                        Camera
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
                
                {/* OCR Processing Status */}
                {ocrMutation.isPending && (
                  <Alert 
                    severity="info" 
                    icon={<CircularProgress size={20} />}
                    sx={{ mb: 2 }}
                  >
                    Processing receipt with AI...
                  </Alert>
                )}
                
                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <List dense>
                    {uploadedFiles.map((fileData) => (
                      <ListItem key={fileData.id}>
                        <ListItemText
                          primary={fileData.name}
                          secondary={`${(fileData.size / 1024).toFixed(1)} KB`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            onClick={() => handlePreviewFile(fileData)}
                            size="small"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton 
                            edge="end" 
                            onClick={() => removeFile(fileData.id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
                
                {/* OCR Results */}
                {ocrResults.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      AI Extracted Data:
                    </Typography>
                    {ocrResults.map((result, index) => (
                      <Paper key={index} sx={{ p: 1, mb: 1, bgcolor: 'success.50' }}>
                        <Typography variant="caption" display="block">
                          Confidence: {(result.confidence * 100).toFixed(0)}%
                        </Typography>
                        {result.parsedData && (
                          <Box sx={{ mt: 1 }}>
                            {result.parsedData.amount && (
                              <Chip label={`Amount: ${result.parsedData.amount}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                            )}
                            {result.parsedData.vendor && (
                              <Chip label={`Vendor: ${result.parsedData.vendor}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                            )}
                            {result.parsedData.date && (
                              <Chip label={`Date: ${result.parsedData.date}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                            )}
                          </Box>
                        )}
                      </Paper>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Action Buttons */}
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/expenses')}
          >
            Cancel
          </Button>
          
          <LoadingButton
            variant="outlined"
            startIcon={<SaveIcon />}
            loading={createExpenseMutation.isPending}
            onClick={handleSubmit(onSaveDraft)}
          >
            Save Draft
          </LoadingButton>
          
          <LoadingButton
            type="submit"
            variant="contained"
            startIcon={<SendIcon />}
            loading={createExpenseMutation.isPending}
          >
            Submit for Approval
          </LoadingButton>
        </Box>
      </form>
      
      {/* Auto-fill Dialog */}
      <Dialog open={showAutoFillDialog} onClose={() => setShowAutoFillDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AIIcon sx={{ mr: 1 }} />
            Auto-fill from Receipt
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            AI has extracted the following data from your receipt. Would you like to auto-fill the form?
          </Typography>
          {autoFillData && (
            <Box sx={{ mt: 2 }}>
              {autoFillData.amount && (
                <Typography variant="body2">Amount: <strong>{autoFillData.amount}</strong></Typography>
              )}
              {autoFillData.vendor && (
                <Typography variant="body2">Vendor: <strong>{autoFillData.vendor}</strong></Typography>
              )}
              {autoFillData.date && (
                <Typography variant="body2">Date: <strong>{autoFillData.date}</strong></Typography>
              )}
              {autoFillData.category && (
                <Typography variant="body2">Category: <strong>{autoFillData.category}</strong></Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAutoFillDialog(false)}>
            No, Thanks
          </Button>
          <Button onClick={handleAutoFill} variant="contained">
            Auto-fill Form
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* File Preview Dialog */}
      <Dialog 
        open={showPreview} 
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Receipt Preview</DialogTitle>
        <DialogContent>
          {previewFile && (
            <Box sx={{ textAlign: 'center' }}>
              {previewFile.file.type.startsWith('image/') ? (
                <img 
                  src={previewFile.url} 
                  alt="Receipt preview"
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                />
              ) : (
                <Typography>PDF preview not available</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Error Display */}
      {createExpenseMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error creating expense: {createExpenseMutation.error?.message}
        </Alert>
      )}
    </Box>
  );
};

export default CreateExpense;