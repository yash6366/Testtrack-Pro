/**
 * AXIOS CLIENT WRAPPER
 * Handles common config, headers, error handling, and token management
 * Centralizes all API communication configuration
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token to all requests
 */
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request ID header for distributed tracing
    config.headers['X-Request-ID'] = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle common errors globally
 */
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const response = error.response;
    
    // Handle 401 - Token expired or invalid
    if (response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      
      // Redirect to login only if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }
    
    // Handle 403 - Permission denied
    if (response?.status === 403) {
      return Promise.reject(new Error(response.data?.message || 'You do not have permission for this action.'));
    }
    
    // Handle 404
    if (response?.status === 404) {
      return Promise.reject(new Error(response.data?.message || 'Resource not found.'));
    }
    
    // Handle 422 - Validation errors
    if (response?.status === 422) {
      const errors = response.data?.errors || {};
      return Promise.reject({
        name: 'ValidationError',
        message: response.data?.message || 'Validation failed',
        errors,
      });
    }
    
    // Handle 500+ - Server errors
    if (response?.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    
    // Network error
    if (!response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    return Promise.reject(error);
  }
);

export default client;
