import axios from 'axios';

const api = axios.create({ baseURL: '/api' });
let refreshPromise = null;

function expireSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:expired'));
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// FIX: Refresh tokens were saved at login but never used, so an otherwise
// active session stopped working when its short-lived access token expired.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest?.url?.startsWith('/auth/');

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retried || isAuthRequest) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      expireSession();
      return Promise.reject(error);
    }

    originalRequest._retried = true;
    try {
      // Share one refresh call when several requests expire together.
      if (!refreshPromise) {
        refreshPromise = axios
          .post('/api/auth/refresh', { refreshToken })
          .then(({ data }) => {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            return data.accessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const accessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      expireSession();
      return Promise.reject(refreshError);
    }
  }
);

export default api;
