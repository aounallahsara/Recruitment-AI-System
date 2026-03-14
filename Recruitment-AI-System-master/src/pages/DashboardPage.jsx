import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Statistics from '../components/dashboard/Statistics'
import CandidatesTable from '../components/dashboard/CandidatesTable'
import { getCandidatures } from '../services/dashboardService'
import { getUserRole } from '../utils/auth';
import DashboardRH from './DashboardRH';
import DashboardAdmin from './DashboardAdmin'
import { isAuthenticated } from '../utils/auth';
function DashboardPage() {
  const navigate = useNavigate()
  const userRole = getUserRole()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login')
      return
    }
  }, [navigate])

  // Router selon le rôle
  if (userRole === 'admin') {
    return <DashboardAdmin />
  } else if (userRole === 'rh') {
    return <DashboardRH />
  } else {
    // Si le rôle n'est pas reconnu, rediriger vers login
    navigate('/login')
    return null
  }

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
    localStorage.removeItem('token')
    navigate('/login')
  }

  const handleViewDetails = (candidate) => {
    setSelectedCandidate(candidate)
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
    return <CandidateDetailsPage candidate={selectedCandidate} onBack={() => setSelectedCandidate(null)} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r min-h-screen">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">MAIN</h2>
        </div>
        <nav className="px-4">
          {['Dashboard', 'All Candidates', 'Preselected', 'Selected'].map((item) => (
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
          <button className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
            Settings
          </button>
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            Export
          </button>
        </div>

      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        
        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : (
          <>
            <Statistics stats={calculateStats()} />
            <CandidatesTable 
              candidates={candidates} 
              onViewDetails={handleViewDetails}
            />
          </>
        )}
      </main>
    </div>
  )
}

// Composant de détails du candidat (Image 3)
function CandidateDetailsPage({ candidate, onBack }) {
  const getInitials = (prenom, nom) => {
    return `${prenom[0]}${nom[0]}`.toUpperCase()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Selected':
        return 'bg-green-100 text-green-700'
      case 'Preselected':
        return 'bg-indigo-100 text-indigo-700'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'Rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getGenreIcon = (genre) => {
    return genre === 'Masculin' ? '👨' : '👩'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <button
        onClick={onBack}
        className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
      >
        ← Retour au tableau de bord
      </button>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">
            DOSSIER — {candidate.prenom.toUpperCase()} {candidate.nom.toUpperCase()}
          </h2>
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Profile */}
        <div className="p-6 border-b">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {getInitials(candidate.prenom, candidate.nom)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  {candidate.prenom} {candidate.nom}
                </h3>
                <span className="text-3xl">{getGenreIcon(candidate.genre)}</span>
              </div>
              <p className="text-gray-600">{candidate.email}</p>
              <p className="text-gray-600">{candidate.telephone}</p>
              <span className={`mt-3 inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(candidate.statut)}`}>
                {candidate.statut}
              </span>
            </div>
          </div>
        </div>

        {/* Informations Personnelles */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">
            Informations Personnelles
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Date de naissance</span>
              <p className="text-gray-900 font-medium">{candidate.date_naissance}</p>
            </div>
            <div>
              <span className="text-gray-500">Wilaya</span>
              <p className="text-gray-900 font-medium">{candidate.wilaya}</p>
            </div>
            <div>
              <span className="text-gray-500">Genre</span>
              <p className="text-gray-900 font-medium">{candidate.genre}</p>
            </div>
            <div>
              <span className="text-gray-500">Téléphone</span>
              <p className="text-gray-900 font-medium">{candidate.telephone}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Email</span>
              <p className="text-gray-900 font-medium">{candidate.email}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">📍 Adresse complète</span>
              <p className="text-gray-900 font-medium">{candidate.adresse}</p>
            </div>
          </div>
        </div>

        {/* Informations Académiques */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">
            Parcours Académique
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="col-span-2 md:col-span-3">
              <span className="text-gray-500">Université / École</span>
              <p className="text-gray-900 font-medium">{candidate.universite}</p>
            </div>
            <div>
              <span className="text-gray-500">Domaine d'études</span>
              <p className="text-gray-900 font-medium">{candidate.domaine}</p>
            </div>
            <div>
              <span className="text-gray-500">Niveau</span>
              <p className="text-gray-900 font-medium">{candidate.niveau}</p>
            </div>
            <div>
              <span className="text-gray-500">Moyenne générale</span>
              <p className="text-gray-900 font-medium text-lg">
                <span className="text-blue-600">{candidate.moyenne}</span>/20
              </p>
            </div>
          </div>
        </div>

        {/* Détails du Stage */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">
            Informations du Stage
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <span className="text-gray-500">Thème du stage</span>
              <p className="text-gray-900 font-medium">{candidate.theme}</p>
            </div>
            {candidate.encadrant && (
              <div className="col-span-2">
                <span className="text-gray-500">Encadrant souhaité</span>
                <p className="text-gray-900 font-medium">👤 {candidate.encadrant}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500">Durée</span>
              <p className="text-gray-900 font-medium">{candidate.duree}</p>
            </div>
            <div>
              <span className="text-gray-500">Période</span>
              <p className="text-gray-900 font-medium">
                {candidate.date_debut} → {candidate.date_fin}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Candidature soumise le</span>
              <p className="text-gray-900 font-medium">
                {new Date(candidate.date_soumission).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Lettre de motivation */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase">
            Lettre de Motivation
          </h4>
          <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg">
            {candidate.lettre_motivation_text}
          </p>
        </div>

        {/* Documents */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-4 flex items-center gap-2 uppercase">
            📄 Documents Téléchargés
          </h4>
          <div className="space-y-3">
            {candidate.cv && (
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">CV.pdf</p>
                    <p className="text-xs text-gray-500">285 KB • Uploadé le {new Date(candidate.date_soumission).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition">
                  Télécharger
                </button>
              </div>
            )}

            {candidate.lettre_motivation && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Lettre_Motivation.pdf</p>
                    <p className="text-xs text-gray-500">181 KB • Uploadé le {new Date(candidate.date_soumission).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition">
                  Télécharger
                </button>
              </div>
            )}

            {candidate.releve_notes && (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Releve_Notes.pdf</p>
                    <p className="text-xs text-gray-500">312 KB • Uploadé le {new Date(candidate.date_soumission).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition">
                  Télécharger
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 text-blue-600 text-sm font-medium pt-2">
              📎 3 documents uploadés
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-sm text-gray-500">Statut actuel</span>
              <p className="text-lg font-semibold text-gray-900 mt-1">{candidate.statut}</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-white text-gray-700 px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium transition">
                Modifier le statut
              </button>
              <button className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 font-medium transition">
                Télécharger tous les documents
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage