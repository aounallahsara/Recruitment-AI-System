import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserRole } from '../utils/auth'

 import api from '../services/api'
function SettingsPage() {
  const navigate = useNavigate()
  const userRole = getUserRole()

  // États
  const [userInfo, setUserInfo] = useState({
    prenom: '',
    nom: '',
    email: '',
    role: userRole
  })

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    theme: 'light'
  })

  const [activeTab, setActiveTab] = useState('profile')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [isLoading, setIsLoading] = useState(false)

  // Charger les infos utilisateur au montage
  useEffect(() => {
    loadUserInfo()
  }, [])
  // ← Ajoute cet import en haut !

// Remplace loadUserInfo
const loadUserInfo = async () => {
  try {
    const response = await api.get('/auth/me/')
    setUserInfo({
      prenom: response.data.prenom || '',
      nom:    response.data.nom    || '',
      email:  response.data.email  || '',
      role:   response.data.role,
    })
  } catch (error) {
    console.error('Erreur:', error)
  }
}
  // Sauvegarder les informations du profil
const handleSaveProfile = async (e) => {
  e.preventDefault()
  setIsLoading(true)
  setMessage({ type: '', text: '' })

  try {
    await api.patch('/auth/profile/', {
      prenom: userInfo.prenom,
      nom:    userInfo.nom,
      email:  userInfo.email,
    })
    setMessage({ type: 'success', text: '✅ Profil mis à jour avec succès !' })
  } catch (error) {
    setMessage({ type: 'error', text: '❌ Erreur lors de la mise à jour du profil' })
  } finally {
    setIsLoading(false)
  }
}

  // Changer le mot de passe
  const handleChangePassword = async (e) => {
  e.preventDefault()
  setMessage({ type: '', text: '' })

  if (passwords.newPassword !== passwords.confirmPassword) {
    setMessage({ type: 'error', text: '❌ Les mots de passe ne correspondent pas' })
    return
  }

  if (passwords.newPassword.length < 8) {
    setMessage({ type: 'error', text: '❌ Le mot de passe doit contenir au moins 8 caractères' })
    return
  }

  setIsLoading(true)

  try {
    await api.post('/auth/change-password/', {
      currentPassword: passwords.currentPassword,
      newPassword:     passwords.newPassword,
    })
    setMessage({ type: 'success', text: '✅ Mot de passe changé avec succès !' })
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
  } catch (error) {
    const msg = error.response?.data?.error || 'Mot de passe actuel incorrect'
    setMessage({ type: 'error', text: `❌ ${msg}` })
  } finally {
    setIsLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
              <p className="text-gray-600 mt-1">Gérez votre profil et vos préférences</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Retour
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'profile'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👤 Profil
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'security'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔒 Sécurité
              </button>
              <button
                onClick={() => setActiveTab('preferences')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === 'preferences'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ⚙️ Préférences
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Onglet Profil */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Informations du profil
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={userInfo.prenom}
                        onChange={(e) => setUserInfo({...userInfo, prenom: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={userInfo.nom}
                        onChange={(e) => setUserInfo({...userInfo, nom: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={userInfo.email}
                        onChange={(e) => setUserInfo({...userInfo, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rôle
                      </label>
                      <input
                        type="text"
                        value={userInfo.role === 'admin' ? 'Administrateur' : 'Ressources Humaines'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isLoading ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                </div>
              </form>
            )}

            {/* Onglet Sécurité */}
            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Changer le mot de passe
                  </h2>
                  
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        value={passwords.currentPassword}
                        onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                        minLength={8}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum 8 caractères
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmer le nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isLoading ? 'Changement...' : 'Changer le mot de passe'}
                  </button>
                </div>
              </form>
            )}

            {/* Onglet Préférences */}
            {activeTab === 'preferences' && (
              <form onSubmit={handleSavePreferences} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Préférences de l'application
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Notifications par email</p>
                        <p className="text-sm text-gray-600">
                          Recevoir des notifications pour les nouvelles candidatures
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={(e) => setPreferences({...preferences, emailNotifications: e.target.checked})}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">Thème de l'interface</p>
                      <select
                        value={preferences.theme}
                        onChange={(e) => setPreferences({...preferences, theme: e.target.value})}
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="light">Clair</option>
                        <option value="dark">Sombre</option>
                        <option value="auto">Automatique</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isLoading ? 'Enregistrement...' : 'Sauvegarder'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage