import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Statistics from '../components/dashboard/Statistics'
import CandidatesTable from '../components/dashboard/CandidatesTable'
import CandidateDetailsPage from '../components/dashboard/CandidateDetailsPage'
import { getCandidatures } from '../services/dashboardService'
import { logout } from '../utils/auth'
import { getUserRole } from '../utils/auth';
function DashboardAdmin() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('adminSettings')
    const parsed = saved ? JSON.parse(saved) : {
      darkMode: false,
      emailNotifications: true,
      selectionThreshold: 70,
      maxCandidates: 10,
      scoreMinimum: 50,
      weightSkills: 40,
      weightEducation: 30,
      weightExperience: 30,
    }
    if (parsed.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    return parsed
  })

  useEffect(() => {
    loadCandidates()
  }, [])

  const loadCandidates = async () => {
    try {
      const data = await getCandidatures()
      setCandidates(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleViewDetails = (candidate) => {
    setSelectedCandidate(candidate)
  }

  const handleSaveSettings = () => {
    localStorage.setItem('adminSettings', JSON.stringify(settings))
    if (settings.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const calculateStats = () => {
    return {
      total: candidates.length,
      pending: candidates.filter(c => c.statut === 'Pending').length,
      preselected: candidates.filter(c => c.statut === 'Preselected').length,
      selected: candidates.filter(c => c.statut === 'Selected').length,
      rejected: candidates.filter(c => c.statut === 'Rejected').length,
    }
  }

  if (selectedCandidate) {
    return <CandidateDetailsPage candidate={selectedCandidate} onBack={() => setSelectedCandidate(null)} isAdmin={true} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r min-h-screen">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">ADMIN</h2>
          <p className="text-xs text-gray-500 mt-1">Accès complet</p>
        </div>
        <nav className="px-4">
          {['Dashboard', 'All Candidates', 'Preselected', 'Selected', 'Manage Users'].map((item) => (
            <button
              key={item}
              onClick={() => setActiveMenu(item)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition ${
                activeMenu === item
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="px-4 mt-8">
          <h3 className="text-sm font-semibold text-gray-500 px-4 mb-2">SYSTEM</h3>
          <button
            onClick={() => setActiveMenu('Settings')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition ${
              activeMenu === 'Settings'
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Settings
          </button>
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrateur</h1>
            <p className="text-gray-600">Gestion complète de toutes les candidatures</p>
          </div>
          <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold">
            👑 ADMIN
          </div>
        </div>
        
        {activeMenu === 'Settings' ? (
          <div className="bg-white p-6 rounded-xl shadow max-w-2xl">
            <h2 className="text-xl font-bold mb-2">⚙️ Paramètres du système</h2>
            <p className="text-gray-500 text-sm mb-8">Les modifications sont sauvegardées localement.</p>

            {/* Général */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Général</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-800">Mode sombre</p>
                    <p className="text-sm text-gray-500">Changer l'apparence de l'interface</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={e => updateSetting('darkMode', e.target.checked)}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-800">Notifications email</p>
                    <p className="text-sm text-gray-500">Recevoir un email à chaque nouvelle candidature</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={e => updateSetting('emailNotifications', e.target.checked)}
                    className="w-5 h-5 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Scoring IA */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">🤖 Scoring IA</h3>
              <div className="space-y-5">

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-800">Seuil de sélection</p>
                    <p className="text-sm text-gray-500">Score minimum pour être présélectionné</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0" max="100"
                      value={settings.selectionThreshold}
                      onChange={e => updateSetting('selectionThreshold', Number(e.target.value))}
                      className="w-16 border rounded-lg p-1 text-center font-medium"
                    />
                    <span className="text-gray-400 text-sm">/ 100</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-800">Score minimum accepté</p>
                    <p className="text-sm text-gray-500">En dessous, le CV est automatiquement rejeté</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="0" max="100"
                      value={settings.scoreMinimum}
                      onChange={e => updateSetting('scoreMinimum', Number(e.target.value))}
                      className="w-16 border rounded-lg p-1 text-center font-medium"
                    />
                    <span className="text-gray-400 text-sm">/ 100</span>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium text-gray-800">Nombre max de présélectionnés</p>
                    <p className="text-sm text-gray-500">Limite automatique lors du tri IA</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" min="1" max="100"
                      value={settings.maxCandidates}
                      onChange={e => updateSetting('maxCandidates', Number(e.target.value))}
                      className="w-16 border rounded-lg p-1 text-center font-medium"
                    />
                    <span className="text-gray-400 text-sm">candidats</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Poids du scoring */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Poids du scoring</h3>
              <p className="text-sm text-gray-400 mb-4">Total recommandé : 100%</p>
              <div className="space-y-4">
                {[
                  { key: 'weightSkills', label: 'Compétences techniques' },
                  { key: 'weightEducation', label: 'Formation / Diplômes' },
                  { key: 'weightExperience', label: 'Expérience professionnelle' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b">
                    <p className="font-medium text-gray-800">{label}</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range" min="0" max="100"
                        value={settings[key]}
                        onChange={e => updateSetting(key, Number(e.target.value))}
                        className="w-28 accent-blue-600"
                      />
                      <span className="w-10 text-right font-semibold text-blue-600">{settings[key]}%</span>
                    </div>
                  </div>
                ))}
                <p className={`text-sm font-medium mt-1 ${
                  settings.weightSkills + settings.weightEducation + settings.weightExperience === 100
                    ? 'text-green-600' : 'text-red-500'
                }`}>
                  Total : {settings.weightSkills + settings.weightEducation + settings.weightExperience}%
                  {settings.weightSkills + settings.weightEducation + settings.weightExperience === 100 ? ' ✅' : ' ⚠️ doit être égal à 100'}
                </p>
              </div>
            </div>

            {/* Bouton sauvegarder */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSaveSettings}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition"
              >
                Sauvegarder
              </button>
              {saveSuccess && (
                <span className="text-green-600 font-medium animate-pulse">
                  ✅ Paramètres sauvegardés !
                </span>
              )}
            </div>
          </div>

        ) : loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : (
          <>
            <Statistics stats={calculateStats()} />
            <CandidatesTable 
              candidates={candidates} 
              onViewDetails={handleViewDetails}
              isAdmin={true}
            />
          </>
        )}
      </main>
    </div>
  )
}

export default DashboardAdmin