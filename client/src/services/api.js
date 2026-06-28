import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || 'https://api.alz.name.ng',
  withCredentials: true,  // httpOnly cookie sent automatically
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
