import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Comparisons = () => {
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComparisons = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/comparisons');
        setComparisons(res.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching comparisons:', err);
        setError('Failed to load comparison data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchComparisons();
  }, []);

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

  if (!comparisons || comparisons.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No comparison data available. Please add builds for different providers to see comparisons.
      </Alert>
    );
  }

  // Prepare data for chart
  const chartData = {
    labels: comparisons.map(item => item.provider),
    datasets: [
      {
        label: 'Average Build Time (seconds)',
        data: comparisons.map(item => item.avgBuildTime),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Average Build Time Comparison',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Time (seconds)'
        }
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Provider Comparisons
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: '400px' }}>
            <Bar data={chartData} options={chartOptions} />
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Provider</strong></TableCell>
                  <TableCell align="right"><strong>Avg Build Time (s)</strong></TableCell>
                  <TableCell align="right"><strong>Min Build Time (s)</strong></TableCell>
                  <TableCell align="right"><strong>Max Build Time (s)</strong></TableCell>
                  <TableCell align="right"><strong>Total Builds</strong></TableCell>
                  <TableCell align="right"><strong>Success Rate</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparisons.map((item) => (
                  <TableRow key={item.provider}>
                    <TableCell component="th" scope="row">
                      {item.provider}
                    </TableCell>
                    <TableCell align="right">{item.avgBuildTime.toFixed(2)}</TableCell>
                    <TableCell align="right">{item.minBuildTime.toFixed(2)}</TableCell>
                    <TableCell align="right">{item.maxBuildTime.toFixed(2)}</TableCell>
                    <TableCell align="right">{item.totalBuilds}</TableCell>
                    <TableCell align="right">{item.successRate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
            Key Insights
          </Typography>
          <Grid container spacing={3}>
            {comparisons.length > 0 && (
              <>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Fastest Provider
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {comparisons.reduce((prev, current) => 
                          (prev.avgBuildTime < current.avgBuildTime) ? prev : current
                        ).provider}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Average build time: {comparisons.reduce((prev, current) => 
                          (prev.avgBuildTime < current.avgBuildTime) ? prev : current
                        ).avgBuildTime.toFixed(2)} seconds
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Most Reliable Provider
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {comparisons.reduce((prev, current) => 
                          (prev.successRate > current.successRate) ? prev : current
                        ).provider}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Success rate: {comparisons.reduce((prev, current) => 
                          (prev.successRate > current.successRate) ? prev : current
                        ).successRate.toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Most Tested Provider
                      </Typography>
                      <Typography variant="h4" color="primary">
                        {comparisons.reduce((prev, current) => 
                          (prev.totalBuilds > current.totalBuilds) ? prev : current
                        ).provider}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total builds: {comparisons.reduce((prev, current) => 
                          (prev.totalBuilds > current.totalBuilds) ? prev : current
                        ).totalBuilds}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Comparisons; 