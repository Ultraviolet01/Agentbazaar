import axios from 'axios';
import { useAuthStore } from './store/auth.store';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Response interceptor for handling token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and code is TOKEN_EXPIRED, try refreshing
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        // If refresh successful, retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth state and redirect to login
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Generic 401 handling (No token or Invalid token)
    if (error.response?.status === 401 && !originalRequest._retry) {
        useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  }
);

export default api;
