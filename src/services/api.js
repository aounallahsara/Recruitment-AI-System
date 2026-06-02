import axios from 'axios'

// ⚠️ IMPORTANT : Change cette URL quand ton équipe backend te donnera l'adresse réelle

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
// Création de l'instance Axios avec la configuration de base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.url.includes('auth/login')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Redirige vers /login automatiquement quand le token est expiré ou invalide
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api