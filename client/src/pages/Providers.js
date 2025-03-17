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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProvider, setCurrentProvider] = useState({
    name: '',
    description: '',
    apiKey: '',
    apiEndpoint: ''
  });
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
        message: 'Failed to load providers',
        severity: 'error'
      });
    }
  };

  const handleOpen = (provider = null) => {
    if (provider) {
      setCurrentProvider(provider);
      setEditMode(true);
    } else {
      setCurrentProvider({
        name: '',
        description: '',
        apiKey: '',
        apiEndpoint: ''
      });
      setEditMode(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (e) => {
    setCurrentProvider({
      ...currentProvider,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    try {
      if (editMode) {
        await axios.put(`/api/providers/${currentProvider.id}`, currentProvider);
        setSnackbar({
          open: true,
          message: 'Provider updated successfully',
          severity: 'success'
        });
      } else {
        await axios.post('/api/providers', currentProvider);
        setSnackbar({
          open: true,
          message: 'Provider added successfully',
          severity: 'success'
        });
      }
      fetchProviders();
      handleClose();
    } catch (error) {
      console.error('Error saving provider:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save provider',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this provider?')) {
      try {
        await axios.delete(`/api/providers/${id}`);
        fetchProviders();
        setSnackbar({
          open: true,
          message: 'Provider deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error deleting provider:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete provider',
          severity: 'error'
        });
      }
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
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Provider
        </Button>
      </Box>

      <Grid container spacing={3}>
        {providers.length > 0 ? (
          providers.map((provider) => (
            <Grid item xs={12} sm={6} md={4} key={provider.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h2">
                    {provider.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" component="p">
                    {provider.description || 'No description provided'}
                  </Typography>
                  <Box mt={2}>
                    <Typography variant="body2">
                      <strong>API Endpoint:</strong> {provider.apiEndpoint || 'N/A'}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => handleOpen(provider)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDelete(provider.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1">
                No providers found. Add a provider to get started.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Provider Form Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Provider Name"
              name="name"
              value={currentProvider.name}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="Description"
              name="description"
              multiline
              rows={3}
              value={currentProvider.description || ''}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="apiKey"
              label="API Key"
              name="apiKey"
              value={currentProvider.apiKey || ''}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              fullWidth
              id="apiEndpoint"
              label="API Endpoint"
              name="apiEndpoint"
              value={currentProvider.apiEndpoint || ''}
              onChange={handleChange}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editMode ? 'Update' : 'Add'}
          </Button>
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