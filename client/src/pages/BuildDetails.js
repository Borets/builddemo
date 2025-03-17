import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Chip,
  CircularProgress,
  Divider,
  Alert
} from '@mui/material';
import axios from 'axios';

const BuildDetails = () => {
  const { id } = useParams();
  const [build, setBuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBuildDetails = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/builds/${id}`);
        setBuild(res.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching build details:', err);
        setError('Failed to load build details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBuildDetails();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!build) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Build not found
      </Alert>
    );
  }

  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate duration in minutes and seconds
  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    
    const minutes = Math.floor(durationMs / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(0);
    
    return `${minutes}m ${seconds}s`;
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Build Details
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="textSecondary">
              Provider
            </Typography>
            <Typography variant="h6" gutterBottom>
              {build.provider}
            </Typography>
            
            <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 2 }}>
              Build Time
            </Typography>
            <Typography variant="h6" gutterBottom>
              {build.buildTime.toFixed(2)} seconds
            </Typography>
            
            <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 2 }}>
              Status
            </Typography>
            <Chip 
              label={build.success ? "Success" : "Failed"} 
              color={build.success ? "success" : "error"} 
              sx={{ mt: 0.5 }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" color="textSecondary">
              Start Time
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDate(build.startTime)}
            </Typography>
            
            <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 2 }}>
              End Time
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDate(build.endTime)}
            </Typography>
            
            <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 2 }}>
              Duration
            </Typography>
            <Typography variant="body1" gutterBottom>
              {calculateDuration(build.startTime, build.endTime)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>
      
      {build.metadata && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Build Metadata
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box component="pre" sx={{ 
            p: 2, 
            bgcolor: 'background.default', 
            borderRadius: 1,
            overflow: 'auto'
          }}>
            {JSON.stringify(build.metadata, null, 2)}
          </Box>
        </Paper>
      )}
      
      {build.logs && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Build Logs
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box component="pre" sx={{ 
            p: 2, 
            bgcolor: 'background.default', 
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: '400px',
            fontSize: '0.875rem',
            fontFamily: 'monospace'
          }}>
            {build.logs}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default BuildDetails; 