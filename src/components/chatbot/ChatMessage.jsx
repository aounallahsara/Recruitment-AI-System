function ChatMessage({ message, isUser }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[75%] px-4 py-2 rounded-lg ${
          isUser 
            ? 'bg-blue-600 text-white rounded-br-none' 
            : 'bg-white text-gray-800 rounded-bl-none shadow'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message}</p>
      </div>
    </div>
  )
}

export default ChatMessage