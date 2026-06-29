import axios from 'axios';

const api = axios.create({
  // Same origin — frontend and backend on same Render service
  // In dev, Vite proxy forwards /api to localhost:3000
  baseURL:         '/api',
  withCredentials: true,
  headers:         { 'Content-Type': 'application/json' },
});

// Auto-redirect on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && window.location.pathname !== '/') {
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
