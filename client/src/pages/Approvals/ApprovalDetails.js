import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Divider,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Alert,
  Tooltip,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Comment as CommentIcon,
  Person as PersonIcon,
  Schedule as ClockIcon,
  Receipt as ReceiptIcon,
  Flag as FlagIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  Visibility as ViewIcon,
  Send as SendIcon,
  AttachFile as AttachIcon
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';

const ApprovalDetails = () => {
  const { expenseId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalType, setApprovalType] = useState('approve');
  const [comments, setComments] = useState('');
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);

  // Fetch expense details
  const { data: expense, isLoading } = useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => apiClient.expenses.getExpenseById(expenseId),
    enabled: !!expenseId
  });

  // Fetch approval history for this expense
  const { data: approvalHistory } = useQuery({
    queryKey: ['approval-history', expenseId],
    queryFn: () => apiClient.approvals.getApprovalHistory({ expenseId }),
    enabled: !!expenseId
  });

  // Process approval mutation
  const processApprovalMutation = useMutation({
    mutationFn: ({ decision, comments }) => {
      if (decision === 'approve') {
        return apiClient.approvals.approveExpense(expenseId, { comments });
      } else {
        return apiClient.approvals.rejectExpense(expenseId, { comments });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expense', expenseId]);
      queryClient.invalidateQueries(['approval-history', expenseId]);
      queryClient.invalidateQueries(['pending-approvals']);
      setShowApprovalDialog(false);
      setComments('');
    }
  });

  const handleOpenApprovalDialog = (type) => {
    setApprovalType(type);
    setComments('');
    setShowApprovalDialog(true);
  };

  const handleProcessApproval = () => {
    processApprovalMutation.mutate({
      decision: approvalType,
      comments: comments.trim()
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getCurrentApprovalStep = () => {
    if (!expense?.approvalFlow) return null;
    return expense.approvalFlow.find(step => step.status === 'pending');
  };

  const canApprove = () => {
    const currentStep = getCurrentApprovalStep();
    return currentStep && currentStep.approver._id === user.id;
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading expense details...</Typography>
      </Box>
    );
  }

  if (!expense) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Expense not found</Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Expense Approval
        </Typography>
        <Box>
          <Chip
            label={expense.status}
            color={getStatusColor(expense.status)}
            size="large"
            sx={{ mr: 2 }}
          />
          {canApprove() && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => handleOpenApprovalDialog('approve')}
                sx={{ mr: 1 }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => handleOpenApprovalDialog('reject')}
              >
                Reject
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Main Expense Details */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Expense Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Expense Number
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      #{expense.expenseNumber}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Description
                    </Typography>
                    <Typography variant="body1">
                      {expense.description}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Amount
                    </Typography>
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {formatCurrency(expense.amount, expense.currency)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Category
                    </Typography>
                    <Chip label={expense.category} size="small" />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Date
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(expense.date), 'MMMM dd, yyyy')}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Vendor
                    </Typography>
                    <Typography variant="body1">
                      {expense.vendor || 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Submitted By
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                        {expense.submittedBy?.firstName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">
                          {expense.submittedBy?.firstName} {expense.submittedBy?.lastName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {expense.submittedBy?.department}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Submitted
                    </Typography>
                    <Typography variant="body1">
                      {format(new Date(expense.submittedAt), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      ({formatDistanceToNow(new Date(expense.submittedAt), { addSuffix: true })})
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {expense.notes && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Notes
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {expense.notes}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Receipt and Attachments */}
          {expense.receipt && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Receipt & Attachments
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AttachIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {expense.receipt.originalName || 'Receipt'}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => setShowReceiptDialog(true)}
                    sx={{ mr: 1 }}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    href={expense.receipt.url}
                    target="_blank"
                  >
                    Download
                  </Button>
                </Box>
                
                {expense.receipt.ocrData && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>OCR Extracted:</strong> Amount: {expense.receipt.ocrData.amount}, 
                      Vendor: {expense.receipt.ocrData.vendor}, 
                      Date: {expense.receipt.ocrData.date}
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Anomaly Flags */}
          {expense.anomalyFlags && expense.anomalyFlags.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="warning.main">
                  <FlagIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Anomaly Alerts
                </Typography>
                
                {expense.anomalyFlags.map((flag, index) => (
                  <Alert 
                    key={index} 
                    severity={flag.severity} 
                    sx={{ mb: 1 }}
                    icon={<FlagIcon />}
                  >
                    <Typography variant="subtitle2">
                      {flag.type}
                    </Typography>
                    <Typography variant="body2">
                      {flag.description}
                    </Typography>
                    {flag.recommendation && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        <strong>Recommendation:</strong> {flag.recommendation}
                      </Typography>
                    )}
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Approval Flow and History */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Approval Workflow
              </Typography>
              
              <Timeline>
                {expense.approvalFlow?.map((step, index) => (
                  <TimelineItem key={index}>
                    <TimelineSeparator>
                      <TimelineDot
                        color={
                          step.status === 'approved' ? 'success' :
                          step.status === 'rejected' ? 'error' :
                          step.status === 'pending' ? 'warning' : 'grey'
                        }
                      >
                        {step.status === 'approved' ? <ApproveIcon fontSize="small" /> :
                         step.status === 'rejected' ? <RejectIcon fontSize="small" /> :
                         step.status === 'pending' ? <ClockIcon fontSize="small" /> :
                         <PersonIcon fontSize="small" />}
                      </TimelineDot>
                      {index < expense.approvalFlow.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Typography variant="body2" fontWeight="medium">
                        {step.role}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {step.approver?.firstName} {step.approver?.lastName}
                      </Typography>
                      {step.timestamp && (
                        <Typography variant="caption" color="textSecondary">
                          {format(new Date(step.timestamp), 'MMM dd, HH:mm')}
                        </Typography>
                      )}
                      {step.comments && (
                        <Paper sx={{ p: 1, mt: 1, bgcolor: 'grey.50' }}>
                          <Typography variant="caption">
                            {step.comments}
                          </Typography>
                        </Paper>
                      )}
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </CardContent>
          </Card>

          {/* Approval History */}
          {approvalHistory && approvalHistory.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Approval History
                </Typography>
                
                <List dense>
                  {approvalHistory.map((activity, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: activity.decision === 'approved' ? 'success.main' : 'error.main'
                          }}
                        >
                          {activity.decision === 'approved' ? 
                            <ApproveIcon fontSize="small" /> : 
                            <RejectIcon fontSize="small" />
                          }
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2">
                            {activity.decision === 'approved' ? 'Approved' : 'Rejected'} by {activity.approver?.firstName} {activity.approver?.lastName}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="textSecondary">
                              {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                            </Typography>
                            {activity.comments && (
                              <>
                                <br />
                                <Typography variant="caption">
                                  "{activity.comments}"
                                </Typography>
                              </>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Approval Dialog */}
      <Dialog 
        open={showApprovalDialog} 
        onClose={() => setShowApprovalDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {approvalType === 'approve' ? 'Approve Expense' : 'Reject Expense'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" gutterBottom>
              <strong>{expense.description}</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {formatCurrency(expense.amount, expense.currency)} • Submitted by {expense.submittedBy?.firstName} {expense.submittedBy?.lastName}
            </Typography>
          </Box>
          
          <TextField
            autoFocus
            margin="dense"
            label={`${approvalType === 'approve' ? 'Approval' : 'Rejection'} Comments`}
            fullWidth
            multiline
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={`Add your comments for ${approvalType === 'approve' ? 'approval' : 'rejection'}...`}
          />
          
          {approvalType === 'reject' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This expense will be returned to the employee for revision.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApprovalDialog(false)}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleProcessApproval}
            loading={processApprovalMutation.isPending}
            variant="contained"
            color={approvalType === 'approve' ? 'success' : 'error'}
            startIcon={approvalType === 'approve' ? <ApproveIcon /> : <RejectIcon />}
          >
            {approvalType === 'approve' ? 'Approve' : 'Reject'}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog
        open={showReceiptDialog}
        onClose={() => setShowReceiptDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Receipt</DialogTitle>
        <DialogContent>
          {expense.receipt && (
            <Box sx={{ textAlign: 'center' }}>
              <img
                src={expense.receipt.url}
                alt="Receipt"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReceiptDialog(false)}>Close</Button>
          <Button
            href={expense.receipt?.url}
            target="_blank"
            startIcon={<DownloadIcon />}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Display */}
      {processApprovalMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error processing approval: {processApprovalMutation.error?.message}
        </Alert>
      )}
    </Box>
  );
};

export default ApprovalDetails;