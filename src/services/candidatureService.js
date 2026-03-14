import api from './api'

/**
 * Envoie une candidature à l'API
 * @param {FormData} formData - Les données du formulaire (avec fichiers)
 * @returns {Promise} - Promesse avec la réponse de l'API
 */
export const submitCandidature = async (formData) => {
  try {
    const response = await api.post('/candidatures/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    console.error('Erreur lors de la soumission de la candidature:', error)
    throw error  // On relance l'erreur pour que le composant puisse la gérer
  }
}