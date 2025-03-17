import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  Tabs,
  Tab
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Compare as CompareIcon,
  Timeline as TimelineIcon,
  Build as BuildIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

const Navbar = () => {
  const location = useLocation();
  
  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    
    if (path === '/') return 0;
    if (path === '/comparisons') return 1;
    if (path === '/timeline') return 2;
    if (path === '/providers') return 3;
    if (path === '/settings') return 4;
    
    return false;
  };

  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: '1px solid #e0e0e0' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component={Link}
            to="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              color: 'primary.main',
              textDecoration: 'none',
            }}
          >
            Build Performance
          </Typography>

          <Box sx={{ flexGrow: 1, display: 'flex' }}>
            <Tabs 
              value={getActiveTab()} 
              aria-label="navigation tabs"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab 
                icon={<DashboardIcon />} 
                label="Dashboard" 
                component={Link} 
                to="/" 
              />
              <Tab 
                icon={<CompareIcon />} 
                label="Comparisons" 
                component={Link} 
                to="/comparisons" 
              />
              <Tab 
                icon={<TimelineIcon />} 
                label="Timeline" 
                component={Link} 
                to="/timeline" 
              />
              <Tab 
                icon={<BuildIcon />} 
                label="Providers" 
                component={Link} 
                to="/providers" 
              />
              <Tab 
                icon={<SettingsIcon />} 
                label="Settings" 
                component={Link} 
                to="/settings" 
              />
            </Tabs>
          </Box>

          <Box sx={{ flexGrow: 0 }}>
            <Button 
              variant="contained" 
              color="primary"
              component={Link}
              to="/comparisons"
            >
              Run Comparison
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 