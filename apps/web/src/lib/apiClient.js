import { logWarning } from './errorLogger';

const normalizeBaseUrl = (value) => String(value || '').replace(/\/+$/, '');
const normalizeEndpoint = (value) => (String(value || '').startsWith('/') ? String(value || '') : `/${String(value || '')}`);

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL || 'http://localhost:3001');
const isDevelopment = import.meta.env.DEV;

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = normalizeBaseUrl(baseURL);
  }

  async #request(endpoint, options = {}) {
    // Extract params and build query string
    const { params, ...fetchOptions } = options;
    let url = `${this.baseURL}${normalizeEndpoint(endpoint)}`;
    
    // Add query parameters if present
    if (params && typeof params === 'object') {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const token = localStorage.getItem('token');

    const headers = {
      ...fetchOptions.headers,
    };

    // Only add Content-Type if there's a body
    if (fetchOptions.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(url, {
        ...fetchOptions,
        headers,
      });
    } catch (networkError) {
      const error = new Error('Network error: Unable to connect to server');
      error.status = 0;
      throw error;
    }

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { message: response.statusText || 'Request failed' };
      }
      
      const errorMessage = errorBody.error || errorBody.message || 'API request failed';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.body = errorBody;

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }

      throw error;
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // Handle empty responses
    if (!contentLength || contentLength === '0') {
      return {};
    }
    
    // Read response as text first (can only read body once)
    const text = await response.text();
    
    if (!text || text.trim() === '') {
      return {};
    }
    
    // Try to parse as JSON
    try {
      return JSON.parse(text);
    } catch (parseError) {
      // Log warning for non-JSON responses in development
      if (isDevelopment) {
        const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;
        console.warn(`[ApiClient] Non-JSON response from ${endpoint}:`, preview);
      }
      return {};
    }
  }

  get(endpoint, options) {
    return this.#request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options) {
    const hasData = data !== undefined && data !== null;
    return this.#request(endpoint, {
      ...options,
      method: 'POST',
      ...(hasData && { body: JSON.stringify(data) }),
    });
  }

  put(endpoint, data, options) {
    const hasData = data !== undefined && data !== null;
    return this.#request(endpoint, {
      ...options,
      method: 'PUT',
      ...(hasData && { body: JSON.stringify(data) }),
    });
  }

  delete(endpoint, options) {
    return this.#request(endpoint, { ...options, method: 'DELETE' });
  }

  patch(endpoint, data, options) {
    const hasData = data !== undefined && data !== null;
    return this.#request(endpoint, {
      ...options,
      method: 'PATCH',
      ...(hasData && { body: JSON.stringify(data) }),
    });
  }
}

export const apiClient = new ApiClient();

export default apiClient;
