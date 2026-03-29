import api from './api'

/**
 * Appelle l'API chatbot
 */
export const askChatbot = async (question) => {
  try {
    const response = await api.post('/chatbot/ask/', {
      question: question
    })
    return response.data
  } catch (error) {
    console.error('Erreur chatbot:', error)
    throw error
  }
}