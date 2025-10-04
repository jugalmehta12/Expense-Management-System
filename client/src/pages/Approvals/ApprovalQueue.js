import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Avatar,
  Tooltip,
  Paper,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Badge
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Comment as CommentIcon,
  Schedule as ClockIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  Flag as FlagIcon,
  CheckCircle
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';

const ApprovalQueue = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalType, setApprovalType] = useState('approve'); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);

  // Fetch pending approvals
  const { data: pendingApprovals, isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: () => apiClient.approvals.getPendingApprovals()
  });

  // Fetch approval history
  const { data: approvalHistory } = useQuery({
    queryKey: ['approval-history'],
    queryFn: () => apiClient.approvals.getApprovalHistory({ limit: 10 })
  });

  // Process approval mutation
  const processApprovalMutation = useMutation({
    mutationFn: ({ expenseId, decision, comments }) => {
      if (decision === 'approve') {
        return apiClient.approvals.approveExpense(expenseId, { comments });
      } else {
        return apiClient.approvals.rejectExpense(expenseId, { comments });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-approvals']);
      queryClient.invalidateQueries(['approval-history']);
      queryClient.invalidateQueries(['expenses']);
      handleCloseApprovalDialog();
    }
  });

  const handleOpenApprovalDialog = (expense, type) => {
    setSelectedExpense(expense);
    setApprovalType(type);
    setComments('');
    setShowApprovalDialog(true);
  };

  const handleCloseApprovalDialog = () => {
    setShowApprovalDialog(false);
    setSelectedExpense(null);
    setComments('');
  };

  const handleProcessApproval = () => {
    if (selectedExpense) {
      processApprovalMutation.mutate({
        expenseId: selectedExpense._id,
        decision: approvalType,
        comments: comments.trim()
      });
    }
  };

  const handleViewExpenseDetails = (expense) => {
    setSelectedExpense(expense);
    setShowExpenseDetails(true);
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getPriorityColor = (expense) => {
    const daysOld = Math.floor((new Date() - new Date(expense.submittedAt)) / (1000 * 60 * 60 * 24));
    if (daysOld > 7) return 'error';
    if (daysOld > 3) return 'warning';
    return 'success';
  };

  const getApprovalStepInfo = (expense) => {
    const currentStep = expense.approvalFlow?.find(step => step.status === 'pending');
    const completedSteps = expense.approvalFlow?.filter(step => step.status !== 'pending').length || 0;
    const totalSteps = expense.approvalFlow?.length || 0;
    
    return {
      currentStep,
      progress: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
      stepText: `Step ${completedSteps + 1} of ${totalSteps}`
    };
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading approvals...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Approval Queue
      </Typography>

      <Grid container spacing={3}>
        {/* Pending Approvals */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Pending Approvals
                </Typography>
                <Badge badgeContent={pendingApprovals?.length || 0} color="error">
                  <ClockIcon />
                </Badge>
              </Box>

              {(!pendingApprovals || pendingApprovals.length === 0) ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    All caught up!
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    No pending approvals at the moment.
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Expense</TableCell>
                        <TableCell>Employee</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Submitted</TableCell>
                        <TableCell>Priority</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingApprovals.map((expense) => {
                        const approvalInfo = getApprovalStepInfo(expense);
                        return (
                          <TableRow key={expense._id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ width: 32, height: 32, mr: 2 }}>
                                  <ReceiptIcon fontSize="small" />
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {expense.description}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    #{expense.expenseNumber}
                                  </Typography>
                                  {expense.anomalyFlags?.length > 0 && (
                                    <Tooltip title="Anomaly detected">
                                      <FlagIcon 
                                        fontSize="small" 
                                        color="warning" 
                                        sx={{ ml: 1 }}
                                      />
                                    </Tooltip>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
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
                            </TableCell>
                            
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(expense.amount, expense.currency)}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {expense.category}
                              </Typography>
                            </TableCell>
                            
                            <TableCell>
                              <Typography variant="body2">
                                {format(new Date(expense.submittedAt), 'MMM dd, yyyy')}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {formatDistanceToNow(new Date(expense.submittedAt), { addSuffix: true })}
                              </Typography>
                            </TableCell>
                            
                            <TableCell>
                              <Chip
                                size="small"
                                label={getPriorityColor(expense) === 'error' ? 'High' : 
                                       getPriorityColor(expense) === 'warning' ? 'Medium' : 'Normal'}
                                color={getPriorityColor(expense)}
                              />
                            </TableCell>
                            
                            <TableCell>
                              <Typography variant="caption" color="textSecondary">
                                {approvalInfo.stepText}
                              </Typography>
                              <Box sx={{ width: '100%', height: 4, bgcolor: 'grey.200', borderRadius: 2, mt: 0.5 }}>
                                <Box
                                  sx={{
                                    width: `${approvalInfo.progress}%`,
                                    height: '100%',
                                    bgcolor: 'primary.main',
                                    borderRadius: 2
                                  }}
                                />
                              </Box>
                            </TableCell>
                            
                            <TableCell align="right">
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewExpenseDetails(expense)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleOpenApprovalDialog(expense, 'approve')}
                                >
                                  <ApproveIcon />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenApprovalDialog(expense, 'reject')}
                                >
                                  <RejectIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Approval History */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              
              {(!approvalHistory || approvalHistory.length === 0) ? (
                <Typography variant="body2" color="textSecondary">
                  No recent approval activity
                </Typography>
              ) : (
                <List dense>
                  {approvalHistory.slice(0, 10).map((activity, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ px: 0 }}>
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
                              {activity.decision === 'approved' ? 'Approved' : 'Rejected'} expense
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                {activity.expense?.description}
                              </Typography>
                              <br />
                              <Typography variant="caption" color="textSecondary">
                                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < approvalHistory.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Approval Dialog */}
      <Dialog 
        open={showApprovalDialog} 
        onClose={handleCloseApprovalDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {approvalType === 'approve' ? 'Approve Expense' : 'Reject Expense'}
        </DialogTitle>
        <DialogContent>
          {selectedExpense && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {selectedExpense.description}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                {formatCurrency(selectedExpense.amount, selectedExpense.currency)} • {selectedExpense.category}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Submitted by {selectedExpense.submittedBy?.firstName} {selectedExpense.submittedBy?.lastName}
              </Typography>
            </Box>
          )}
          
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
          <Button onClick={handleCloseApprovalDialog}>
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

      {/* Expense Details Dialog */}
      <Dialog
        open={showExpenseDetails}
        onClose={() => setShowExpenseDetails(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Expense Details</DialogTitle>
        <DialogContent>
          {selectedExpense && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Basic Information</Typography>
                <Typography variant="body2"><strong>Description:</strong> {selectedExpense.description}</Typography>
                <Typography variant="body2"><strong>Amount:</strong> {formatCurrency(selectedExpense.amount, selectedExpense.currency)}</Typography>
                <Typography variant="body2"><strong>Category:</strong> {selectedExpense.category}</Typography>
                <Typography variant="body2"><strong>Date:</strong> {format(new Date(selectedExpense.date), 'MMM dd, yyyy')}</Typography>
                <Typography variant="body2"><strong>Vendor:</strong> {selectedExpense.vendor || 'N/A'}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Approval Flow</Typography>
                <List dense>
                  {selectedExpense.approvalFlow?.map((step, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {step.status === 'approved' ? '✅' : 
                           step.status === 'rejected' ? '❌' : '⏳'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={step.approver?.firstName + ' ' + step.approver?.lastName}
                        secondary={step.role}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              
              {selectedExpense.anomalyFlags?.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom color="warning.main">
                    ⚠️ Anomaly Alerts
                  </Typography>
                  {selectedExpense.anomalyFlags.map((flag, index) => (
                    <Alert key={index} severity={flag.severity} sx={{ mb: 1 }}>
                      <strong>{flag.type}:</strong> {flag.description}
                    </Alert>
                  ))}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExpenseDetails(false)}>Close</Button>
          {selectedExpense && (
            <>
              <Button
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => {
                  setShowExpenseDetails(false);
                  handleOpenApprovalDialog(selectedExpense, 'approve');
                }}
              >
                Approve
              </Button>
              <Button
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => {
                  setShowExpenseDetails(false);
                  handleOpenApprovalDialog(selectedExpense, 'reject');
                }}
              >
                Reject
              </Button>
            </>
          )}
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

export default ApprovalQueue;