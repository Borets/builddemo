import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import BuildTable from '../components/builds/BuildTable';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comparisons, setComparisons] = useState([]);
  const [recentBuilds, setRecentBuilds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch comparison data
        const comparisonRes = await axios.get('/api/comparisons');
        setComparisons(comparisonRes.data);
        
        // Fetch recent builds
        const buildsRes = await axios.get('/api/builds?limit=5');
        setRecentBuilds(buildsRes.data);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        setLoading(false);
        console.error(err);
      }
    };
    
    fetchData();
  }, []);

  // Prepare chart data
  const chartData = comparisons.map(provider => ({
    name: provider.provider,
    avgBuildTime: provider.avgBuildTime,
    successRate: provider.successRate
  }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Build Performance Dashboard
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to="/comparisons"
        >
          Run New Comparison
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Performance Overview */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Build Performance Comparison" />
            <Divider />
            <CardContent>
              <Box sx={{ height: 400 }}>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="avgBuildTime" name="Avg Build Time (s)" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="successRate" name="Success Rate (%)" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      No comparison data available. Run a comparison to see results.
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Builds */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Recent Builds" 
              action={
                <Button component={Link} to="/builds">
                  View All
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <BuildTable builds={recentBuilds} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 