import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const Expenses = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Expenses
        </Typography>
        <Typography variant="body1">
          Expense management page - Coming soon
        </Typography>
      </Box>
    </Container>
  );
};

export default Expenses;