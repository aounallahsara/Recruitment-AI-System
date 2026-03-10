import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // --- LOGIQUE DE TEST ---
      if (credentials.username === 'admin' && credentials.password === 'admin') {
        localStorage.setItem('token', 'fake-admin-token')
        localStorage.setItem('userRole', 'admin')
        navigate('/dashboard')
      } else if (credentials.username === 'rh' && credentials.password === 'rh') {
        localStorage.setItem('token', 'fake-rh-token')
        localStorage.setItem('userRole', 'rh')
        navigate('/dashboard')
      } else {
        // --- LOGIQUE API (Décommenter quand le backend est prêt) ---
        /*
        const response = await api.post('/auth/login/', credentials)
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('userRole', response.data.user.role)
        navigate('/dashboard')
        */
        setError('Identifiants incorrects')
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la connexion')
    } finally {
      setIsLoading(false)
    }
  }

  // Le return doit toujours être à la toute fin de la fonction
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Connexion RH</h2>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Nom d'utilisateur</label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ex: admin ou rh"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Mot de passe</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage