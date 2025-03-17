import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Button, 
  Grid,
  Card, 
  CardContent, 
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SettingsIcon from '@mui/icons-material/Settings';
import axios from 'axios';

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await axios.get('/api/providers');
      setProviders(res.data);
    } catch (error) {
      console.error('Error fetching providers:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch providers',
        severity: 'error'
      });
    }
  };

  const handleOpenInfo = (provider) => {
    setSelectedProvider(provider);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedProvider(null);
  };

  const validateProvider = async (name) => {
    try {
      const res = await axios.get(`/api/providers/${name}/validate`);
      setSnackbar({
        open: true,
        message: res.data.message,
        severity: res.data.valid ? 'success' : 'warning'
      });
    } catch (error) {
      console.error('Error validating provider:', error);
      setSnackbar({
        open: true,
        message: 'Failed to validate provider credentials',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Cloud Providers
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Provider Configuration
        </Typography>
        <Typography variant="body1" paragraph>
          Providers are now configured securely via environment variables. This approach enhances security by keeping sensitive API keys out of the database and UI.
        </Typography>
        <Typography variant="body1" paragraph>
          To add or modify providers, update the environment variables in your deployment environment or .env file.
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Environment Variables" 
              secondary="Set provider-specific environment variables like PROVIDER_ENABLED, PROVIDER_API_KEY, etc."
            />
          </ListItem>
          <Divider component="li" />
          <ListItem>
            <ListItemIcon>
              <InfoIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Configuration File" 
              secondary="The server loads provider configuration from environment variables at startup."
            />
          </ListItem>
        </List>
      </Paper>

      <Typography variant="h5" gutterBottom mt={4}>
        Available Providers
      </Typography>
      
      <Grid container spacing={3}>
        {providers.length > 0 ? (
          providers.map((provider) => (
            <Grid item xs={12} sm={6} md={4} key={provider.name}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="div">
                      {provider.name}
                    </Typography>
                    <Chip 
                      label={provider.enabled ? "Enabled" : "Disabled"} 
                      color={provider.enabled ? "success" : "default"}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {provider.description || "No description available"}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<InfoIcon />}
                    onClick={() => handleOpenInfo(provider)}
                  >
                    Info
                  </Button>
                  {provider.enabled && (
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => validateProvider(provider.name)}
                    >
                      Validate Credentials
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Alert severity="info">
              No providers configured. Please set up provider environment variables.
            </Alert>
          </Grid>
        )}
      </Grid>

      {/* Provider Info Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          {selectedProvider?.name} Details
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This provider is {selectedProvider?.enabled ? 'enabled' : 'disabled'} in your configuration.
          </DialogContentText>
          <List>
            <ListItem>
              <ListItemIcon>
                {selectedProvider?.enabled ? <CheckCircleIcon color="success" /> : <CancelIcon color="disabled" />}
              </ListItemIcon>
              <ListItemText primary="Status" secondary={selectedProvider?.enabled ? 'Enabled' : 'Disabled'} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Description" secondary={selectedProvider?.description || 'No description available'} />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Configuration" 
                secondary="API keys and endpoints are configured via environment variables for security."
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
          {selectedProvider?.enabled && (
            <Button 
              onClick={() => {
                validateProvider(selectedProvider.name);
                handleClose();
              }} 
              color="primary"
            >
              Validate Credentials
            </Button>
          )}
        </DialogActions>
      </Dialog>

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

export default Providers; 