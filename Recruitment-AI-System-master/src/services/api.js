import axios from 'axios'

// ⚠️ IMPORTANT : Change cette URL quand ton équipe backend te donnera l'adresse réelle
const API_BASE_URL = 'http://localhost:8000/api'

// Création de l'instance Axios avec la configuration de base
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter automatiquement le token d'authentification
api.interceptors.request.use(
  (config) => {
    // Récupère le token stocké dans localStorage
    const token = localStorage.getItem('token')
    
    // Si un token existe, l'ajoute dans les headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default api