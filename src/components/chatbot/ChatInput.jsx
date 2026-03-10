import { useState } from 'react'

    function ChatInput({ onSend }) {
      const [input, setInput] = useState('')

      const handleSubmit = (e) => {
        e.preventDefault()
        if (input.trim()) {
          onSend(input)
          setInput('')
        }
      }

      return (
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Posez votre question..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Envoyer
            </button>
          </div>
        </form>
      )
    }

    export default ChatInput