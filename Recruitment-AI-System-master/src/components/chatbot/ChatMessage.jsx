function ChatMessage({ message, isUser }) {
      return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
          <div className={`max-w-xs px-4 py-2 rounded-lg ${
            isUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'
          }`}>
            {message}
          </div>
        </div>
      )
    }

    export default ChatMessage