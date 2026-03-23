import { useState } from 'react'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import { askChatbot } from '../../services/chatbotService'

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { 
      text: "Bonjour ! 👋 Je suis votre assistant virtuel. Posez-moi vos questions sur les candidatures de stages !", 
      isUser: false 
    }
  ])
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async (message) => {
    // Ajouter le message utilisateur
    const userMessage = { text: message, isUser: true }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    
    try {
      // Appeler l'API
      console.log('Envoi de la question:', message)
      const response = await askChatbot(message)
      console.log('Réponse reçue:', response)
      
      // Vérifier la réponse
      if (response.success && response.answer) {
        setMessages(prev => [...prev, {
          text: response.answer,
          isUser: false
        }])
      } else {
        throw new Error(response.error || 'Pas de réponse')
      }
    } catch (error) {
      console.error('Erreur complète:', error)
      setMessages(prev => [...prev, {
        text: "Désolé, je rencontre un problème technique. Vérifiez que le backend Django est bien lancé.",
        isUser: false
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Bouton flottant */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-110"
          title="Ouvrir le chatbot"
        >
          💬
        </button>
      )}

      {/* Fenêtre du chatbot */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-96 h-[600px] flex flex-col border-2 border-blue-500">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">Assistant Virtuel</h3>
              <p className="text-xs text-blue-100">Propulsé par Google Gemini</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="hover:bg-blue-800 rounded-full p-2 transition"
              title="Fermer"
            >
              ✕
            </button>
          </div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg.text} isUser={msg.isUser} />
            ))}
            
            {/* Animation de chargement */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce" style={{animationDelay: '0.1s'}}>●</span>
                    <span className="animate-bounce" style={{animationDelay: '0.2s'}}>●</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Input */}
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      )}
    </div>
  )
}

export default ChatBot