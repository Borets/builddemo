import React from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';

const BuildTable = ({ builds }) => {
  // Format date
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <TableContainer component={Paper} elevation={0}>
      <Table sx={{ minWidth: 650 }} aria-label="builds table">
        <TableHead>
          <TableRow>
            <TableCell>Provider</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Build Time</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {builds.length > 0 ? (
            builds.map((build) => (
              <TableRow
                key={build._id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Chip 
                    label={build.provider} 
                    color="primary" 
                    variant="outlined" 
                    size="small" 
                  />
                </TableCell>
                <TableCell>
                  {build.success ? (
                    <Chip 
                      icon={<CheckCircleIcon />} 
                      label="Success" 
                      color="success" 
                      size="small" 
                    />
                  ) : (
                    <Chip 
                      icon={<CancelIcon />} 
                      label="Failed" 
                      color="error" 
                      size="small" 
                    />
                  )}
                </TableCell>
                <TableCell>
                  {build.buildTime.toFixed(2)}s
                </TableCell>
                <TableCell>{formatDate(build.date)}</TableCell>
                <TableCell align="right">
                  <Tooltip title="View Details">
                    <IconButton 
                      component={Link} 
                      to={`/builds/${build._id}`}
                      size="small"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No builds found
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BuildTable; 