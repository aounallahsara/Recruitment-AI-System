import { useState } from 'react'

function ChatInput({ onSend, disabled = false }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-4 bg-white">
      <div className="flex gap-2">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          placeholder="Posez votre question..."
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button 
          type="submit" 
          disabled={disabled || !input.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          Envoyer
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        💡 Exemples : "Quels documents ?", "Durée du stage ?"
      </p>
    </form>
  )
}

export default ChatInput