import axios from 'axios'

// ⚠️ IMPORTANT : Change cette URL quand ton équipe backend te donnera l'adresse réelle

const API_BASE_URL = 'http://127.0.0.1:8000/api'
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
    
    // N'ajoute le token QUE si ce n'est pas la page de login
    if (token && !config.url.includes('auth/login')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);
export default api