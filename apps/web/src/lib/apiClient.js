import { logWarning } from './errorLogger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async #request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    const headers = {
      ...options.headers,
    };

    // Only add Content-Type if there's a body
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(url, {
        ...options,
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

    try {
      return await response.json();
    } catch (parseError) {
      // If response is not JSON, return empty object
      logWarning('Response is not valid JSON:', { error: parseError });
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
