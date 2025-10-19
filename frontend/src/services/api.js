import axios from 'axios';

let API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
if (typeof window !== 'undefined') {
  const frontendOrigin = window.location.origin;
  // Match both exact domain and protocol
  if (frontendOrigin === 'https://boned.macandbutter.com' || window.location.hostname === 'boned.macandbutter.com') {
    API_BASE_URL = 'https://boned-api.macandbutter.com';
  }
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication tokens if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;
