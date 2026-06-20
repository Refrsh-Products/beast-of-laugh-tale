import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { HttpClient, HttpMethod, HttpRequestConfig } from '@freshr/shared';
import { AuthServiceApiEndpoints } from '@freshr/shared';
import { appConfig } from './config';
import { mobileSessionStore } from './session';

// Axios tags the retried request so a second 401 doesn't loop forever.
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/**
 * The shared axios instance for the mobile app. Mirrors web's `freshr-api` +
 * `useAxiosInterceptor`, but as a plain module (no React) so the same instance
 * is reused across every service.
 *
 * Request interceptor: attaches the bearer token from the session mirror.
 * Response interceptor (story 3.4): on a 401, exchanges the refresh token for a
 * new access token, replays the original request, and on refresh failure clears
 * the session — which notifies subscribers and bounces the app back to login.
 */
function createApiInstance(): AxiosInstance {
  const api = axios.create({
    baseURL: appConfig.apiBaseUrl,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
  });

  api.interceptors.request.use((config) => {
    const token = mobileSessionStore.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as RetryableConfig | undefined;
      const refreshToken = mobileSessionStore.getRefreshToken();

      if (
        error.response?.status === 401 &&
        refreshToken &&
        originalRequest &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        try {
          // Bare axios (not `api`) so this call skips the interceptors and
          // can't recurse if the refresh itself 401s.
          const refreshResponse = await axios.post(
            `${appConfig.apiBaseUrl}${AuthServiceApiEndpoints.refreshToken}`,
            { refresh: refreshToken }
          );
          const newAccessToken: string = refreshResponse.data.access;
          mobileSessionStore.setTokens({
            access: newAccessToken,
            refresh: refreshToken,
          });
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          // Refresh failed → the session is dead. Clearing tokens + ending the
          // session notifies AuthContext, which redirects to the login stack.
          mobileSessionStore.clearTokens();
          mobileSessionStore.clearIdentity();
          mobileSessionStore.endSession();
          return Promise.reject(refreshErr);
        }
      }

      return Promise.reject(error);
    }
  );

  return api;
}

const api = createApiInstance();

/**
 * Adapts the axios instance to the shared `HttpClient` contract. Identical
 * dispatch to web's `createAxiosHttpClient` so the shared services behave the
 * same on both platforms (including the `err.response` error shape they read).
 */
export const mobileHttpClient: HttpClient = {
  request: async <T>(
    endpoint: string,
    method: HttpMethod = 'GET',
    data: unknown = null,
    config: HttpRequestConfig = {}
  ): Promise<T> => {
    const axiosConfig: AxiosRequestConfig = {
      params: config.params,
      timeout: config.timeout,
      headers: config.headers as AxiosRequestConfig['headers'],
    };

    let response;
    switch (method) {
      case 'GET':
        response = api.get<T>(endpoint, axiosConfig);
        break;
      case 'POST':
        response = api.post<T>(endpoint, data, axiosConfig);
        break;
      case 'PUT':
        response = api.put<T>(endpoint, data, axiosConfig);
        break;
      case 'PATCH':
        response = api.patch<T>(endpoint, data, axiosConfig);
        break;
      case 'DELETE':
        response = api.delete<T>(endpoint, axiosConfig);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    return (await response).data;
  },
};
