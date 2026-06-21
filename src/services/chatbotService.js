import axios from 'axios'

const CHATBOT_API_URL = 'http://127.0.0.1:8000/api/chatbot/ask/'

/**
 * Appelle l'API chatbot
 */
export const askChatbot = async (question) => {
  try {
    const response = await axios.post(CHATBOT_API_URL, {
      question: question
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    console.error('Erreur chatbot:', error)
    throw error
  }
}