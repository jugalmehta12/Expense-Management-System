import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="background.default"
    >
      <CircularProgress size={60} thickness={4} />
      <Typography 
        variant="h6" 
        color="text.secondary" 
        sx={{ mt: 2 }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;