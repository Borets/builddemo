import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Snackbar
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';

const Settings = () => {
  const [settings, setSettings] = useState({
    apiKey: localStorage.getItem('apiKey') || '',
    darkMode: localStorage.getItem('darkMode') === 'true',
    autoRefresh: localStorage.getItem('autoRefresh') === 'true',
    refreshInterval: parseInt(localStorage.getItem('refreshInterval') || '60'),
    notificationsEnabled: localStorage.getItem('notificationsEnabled') === 'true'
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setSettings({
      ...settings,
      [name]: e.target.type === 'checkbox' ? checked : value
    });
  };

  const handleSave = () => {
    // Save settings to localStorage
    Object.entries(settings).forEach(([key, value]) => {
      localStorage.setItem(key, value.toString());
    });

    // Show success message
    setSnackbar({
      open: true,
      message: 'Settings saved successfully',
      severity: 'success'
    });
  };

  const handleReset = () => {
    // Reset to default settings
    const defaultSettings = {
      apiKey: '',
      darkMode: false,
      autoRefresh: true,
      refreshInterval: 60,
      notificationsEnabled: true
    };

    setSettings(defaultSettings);

    // Save default settings to localStorage
    Object.entries(defaultSettings).forEach(([key, value]) => {
      localStorage.setItem(key, value.toString());
    });

    // Show success message
    setSnackbar({
      open: true,
      message: 'Settings reset to defaults',
      severity: 'info'
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Application Settings
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="API Key"
              name="apiKey"
              value={settings.apiKey}
              onChange={handleChange}
              margin="normal"
              helperText="API key for external services (if needed)"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Refresh Interval (seconds)"
              name="refreshInterval"
              type="number"
              value={settings.refreshInterval}
              onChange={handleChange}
              margin="normal"
              inputProps={{ min: 10, max: 3600 }}
              helperText="How often to refresh data (10-3600 seconds)"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.darkMode}
                  onChange={handleChange}
                  name="darkMode"
                  color="primary"
                />
              }
              label="Dark Mode"
            />
            <Typography variant="body2" color="textSecondary">
              Enable dark mode for the application
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoRefresh}
                  onChange={handleChange}
                  name="autoRefresh"
                  color="primary"
                />
              }
              label="Auto Refresh"
            />
            <Typography variant="body2" color="textSecondary">
              Automatically refresh data at the specified interval
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notificationsEnabled}
                  onChange={handleChange}
                  name="notificationsEnabled"
                  color="primary"
                />
              }
              label="Enable Notifications"
            />
            <Typography variant="body2" color="textSecondary">
              Receive notifications for important events
            </Typography>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="secondary" 
            startIcon={<RefreshIcon />}
            onClick={handleReset}
          >
            Reset to Defaults
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save Settings
          </Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          About
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="body1" paragraph>
          Build Performance Evaluation System
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Version 1.0.0
        </Typography>
        <Typography variant="body2" color="textSecondary">
          This application helps you evaluate and compare build performance across different cloud providers.
          Track build times, success rates, and identify the most efficient provider for your needs.
        </Typography>
        
        <Alert severity="info" sx={{ mt: 3 }}>
          This is a demo application for Render.com. Data collected is for demonstration purposes only.
        </Alert>
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings; 