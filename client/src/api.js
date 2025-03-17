import axios from 'axios';
import config from './config';

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: config.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api; 