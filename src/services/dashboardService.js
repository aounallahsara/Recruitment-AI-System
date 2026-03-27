import api from './api'

// Récupérer toutes les candidatures
export const getCandidatures = async () => {
  try {
    const response = await api.get('/candidatures/list/')
    return response.data
  } catch (error) {
    console.error('Erreur getCandidatures:', error)
    throw error
  }
}

// Récupérer une candidature spécifique
export const getCandidature = async (id) => {
  try {
    const response = await api.get(`/candidatures/${id}/`)
    return response.data
  } catch (error) {
    console.error('Erreur getCandidature:', error)
    throw error
  }
}

// Modifier le statut d'une candidature
export const updateStatut = async (id, statut_nom) => {
  try {
    const response = await api.patch(`/candidatures/${id}/statut/`, { statut_nom })
    return response.data
  } catch (error) {
    console.error('Erreur updateStatut:', error)
    throw error
  }
}

// Récupérer les statistiques du dashboard
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats/')
    return response.data
  } catch (error) {
    console.error('Erreur getDashboardStats:', error)
    throw error
  }
}

// Authentification
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login/', credentials)
    return response.data
  } catch (error) {
    console.error('Erreur login:', error)
    throw error
  }
}

// Télécharger un document
export const downloadDocument = async (url) => {
  try {
    const response = await api.get(url, { responseType: 'blob' })
    return response.data
  } catch (error) {
    console.error('Erreur downloadDocument:', error)
    throw error
  }
}