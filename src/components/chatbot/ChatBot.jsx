import { useState } from 'react'
    import ChatMessage from './ChatMessage'
    import ChatInput from './ChatInput'

    function ChatBot() {
      const [isOpen, setIsOpen] = useState(false)
      const [messages, setMessages] = useState([
        {
          text: "Bonjour ! Je suis l'assistant virtuel. Comment puis-je vous aider avec votre candidature ?",
          isUser: false
        }
      ])

      const handleSend = (message) => {
        // Ajouter le message de l'utilisateur
        setMessages([...messages, { text: message, isUser: true }])

        // Simuler une réponse (à remplacer par l'API RAG plus tard)
        setTimeout(() => {
          setMessages(prev => [...prev, {
            text: "Merci pour votre question. Cette fonctionnalité sera bientôt disponible avec l'intégration RAG.",
            isUser: false
          }])
        }, 1000)
      }

      return (
        <div className="fixed bottom-6 right-6 z-50">
          {/* Bouton pour ouvrir/fermer le chatbot */}
          {!isOpen && (
            <button
              onClick={() => setIsOpen(true)}
              className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
          )}

          {/* Fenêtre du chatbot */}
          {isOpen && (
            <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col">
              {/* Header */}
              <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                <h3 className="font-semibold">Assistant virtuel</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-blue-700 rounded p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4">
                {messages.map((msg, index) => (
                  <ChatMessage key={index} message={msg.text} isUser={msg.isUser} />
                ))}
              </div>

              {/* Input */}
              <ChatInput onSend={handleSend} />
            </div>
          )}
        </div>
      )
    }

    export default ChatBot