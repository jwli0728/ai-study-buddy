import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { calculateBackoff, parseRetryAfter, sleep, isRateLimitError } from '../utils/rateLimit';

const API_BASE_URL = '/api/v1';

// Rate limit retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

// Extended config type to track retry attempts and flags
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
  _skipRateLimitRetry?: boolean;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh and rate limiting
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Handle 401 Unauthorized - token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return apiClient(originalRequest);
        } catch {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }

    // Handle 429 Too Many Requests - rate limiting with retry
    if (isRateLimitError(error) && originalRequest && !originalRequest._skipRateLimitRetry) {
      // Initialize retry count
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      // Check if we should retry
      if (originalRequest._retryCount <= MAX_RETRIES) {
        // Check for Retry-After header
        const retryAfter = parseRetryAfter(error.response?.headers?.['retry-after']);

        // Calculate delay (use Retry-After if present, otherwise exponential backoff)
        const delay = retryAfter || calculateBackoff(originalRequest._retryCount, BASE_DELAY);

        // Log retry attempt
        console.warn(
          `[Rate Limit] Retry attempt ${originalRequest._retryCount}/${MAX_RETRIES}`,
          `after ${delay}ms for ${originalRequest.url}`
        );

        // Wait before retrying
        await sleep(delay);

        // Retry the request
        return apiClient(originalRequest);
      } else {
        // Max retries exceeded - enhance error message
        console.error(`[Rate Limit] Max retries exceeded for ${originalRequest.url}`);
        error.message = 'Rate limit exceeded. Please try again later.';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
