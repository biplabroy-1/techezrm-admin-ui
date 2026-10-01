/* eslint-disable @typescript-eslint/no-unused-vars */
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { ENDPOINTS } from './endpoints';

/**
 * Drop every trace of the dead session and bounce to /login.
 *
 * Clearing localStorage alone is not enough: the persisted zustand store
 * keeps `auth-storage`, so a reload would restore a logged-in shell and the
 * user would land right back on a page that 401s.
 */
const clearSession = () => {
  localStorage.removeItem('auth-token');
  localStorage.removeItem('refresh-token');
  localStorage.removeItem('auth-storage');

  // Never bounce away from the login page itself, or a failed login attempt
  // turns into a reload loop.
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: ENDPOINTS.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth-token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // There is no refresh-token flow in this app: the server exposes no
    // POST /auth/refresh and login returns no refreshToken, so `refresh-token`
    // in localStorage is never populated. A 401 therefore always means the
    // session is unrecoverable - clear it and send the user to login.
    if (error.response?.status === 401) {
      clearSession();
    }

    return Promise.reject(error?.response?.data || error);
  }
);

export default api;
