// Environment-specific configuration
const config = {
  // Local development
  development: {
    apiBaseUrl: 'http://localhost:5000/api',
  },
  // Testing environment
  test: {
    apiBaseUrl: 'http://localhost:5000/api',
  },
  // Production environment
  production: {
    // For GitHub Pages, the API needs to be hosted separately
    // Replace with your actual API URL (e.g., Render, Heroku, etc.)
    apiBaseUrl: 'https://build-performance-app.onrender.com/api',
  },
};

// Get the current environment
const env = process.env.NODE_ENV || 'development';

// Export the configuration for the current environment
export default config[env]; 