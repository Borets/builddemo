import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Box, 
  Paper, 
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import axios from 'axios';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Timeline = () => {
  const [timelineData, setTimelineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30);
  
  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/comparisons/timeline?days=${timeRange}`);
        setTimelineData(res.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching timeline data:', err);
        setError('Failed to load timeline data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, [timeRange]);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

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

  if (!timelineData || timelineData.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No timeline data available. Please add builds for different providers to see the timeline.
      </Alert>
    );
  }

  // Extract unique providers from the data
  const providers = [...new Set(
    timelineData.flatMap(day => day.providers.map(p => p.provider))
  )];

  // Generate random colors for each provider
  const providerColors = providers.reduce((acc, provider, index) => {
    const colors = [
      { bg: 'rgba(54, 162, 235, 0.2)', border: 'rgba(54, 162, 235, 1)' },
      { bg: 'rgba(255, 99, 132, 0.2)', border: 'rgba(255, 99, 132, 1)' },
      { bg: 'rgba(75, 192, 192, 0.2)', border: 'rgba(75, 192, 192, 1)' },
      { bg: 'rgba(255, 206, 86, 0.2)', border: 'rgba(255, 206, 86, 1)' },
      { bg: 'rgba(153, 102, 255, 0.2)', border: 'rgba(153, 102, 255, 1)' },
      { bg: 'rgba(255, 159, 64, 0.2)', border: 'rgba(255, 159, 64, 1)' }
    ];
    
    acc[provider] = colors[index % colors.length];
    return acc;
  }, {});

  // Prepare data for chart
  const chartData = {
    labels: timelineData.map(item => item.date),
    datasets: providers.map(provider => ({
      label: provider,
      data: timelineData.map(day => {
        const providerData = day.providers.find(p => p.provider === provider);
        return providerData ? providerData.avgBuildTime : null;
      }),
      backgroundColor: providerColors[provider].bg,
      borderColor: providerColors[provider].border,
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 3,
      fill: false,
    })),
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Build Time Trends Over Time',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value !== null ? value.toFixed(2) + ' seconds' : 'No data'}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Average Build Time (seconds)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Build Time Timeline
        </Typography>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="time-range-label">Time Range</InputLabel>
          <Select
            labelId="time-range-label"
            id="time-range-select"
            value={timeRange}
            label="Time Range"
            onChange={handleTimeRangeChange}
          >
            <MenuItem value={7}>Last 7 days</MenuItem>
            <MenuItem value={14}>Last 14 days</MenuItem>
            <MenuItem value={30}>Last 30 days</MenuItem>
            <MenuItem value={60}>Last 60 days</MenuItem>
            <MenuItem value={90}>Last 90 days</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: '500px' }}>
            <Line data={chartData} options={chartOptions} />
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Key Observations
            </Typography>
            
            {providers.length > 0 && (
              <Box mt={2}>
                <Typography variant="body1" paragraph>
                  The chart above shows the average build time trends for {providers.join(', ')} over the past {timeRange} days.
                </Typography>
                
                {timelineData.length > 1 && (
                  <Typography variant="body1" paragraph>
                    {(() => {
                      // Find the provider with the most consistent performance
                      const providerVariances = providers.map(provider => {
                        const times = timelineData
                          .flatMap(day => {
                            const providerData = day.providers.find(p => p.provider === provider);
                            return providerData ? [providerData.avgBuildTime] : [];
                          })
                          .filter(time => time !== null);
                        
                        if (times.length < 2) return { provider, variance: Infinity };
                        
                        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
                        const variance = times.reduce((sum, time) => sum + Math.pow(time - avg, 2), 0) / times.length;
                        return { provider, variance };
                      });
                      
                      const mostConsistent = providerVariances.reduce((prev, current) => 
                        (prev.variance < current.variance && prev.variance !== Infinity) ? prev : current
                      );
                      
                      if (mostConsistent.variance !== Infinity) {
                        return `${mostConsistent.provider} shows the most consistent build performance over time.`;
                      }
                      return '';
                    })()}
                  </Typography>
                )}
                
                <Typography variant="body1">
                  Continue collecting data to identify long-term trends and optimize your build processes.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Timeline; 