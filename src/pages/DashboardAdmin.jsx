import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Statistics from '../components/dashboard/Statistics'
import CandidatesTable from '../components/dashboard/CandidatesTable'
import CandidateDetailsPage from '../components/dashboard/CandidateDetailsPage'
import AdminAddCandidate from '../components/dashboard/AdminAddCandidate'
import { getCandidatures } from '../services/dashboardService'
import { logout } from '../utils/auth'
import { exportToExcel, exportByStatus } from '../utils/excelExport'
import ExportMenu from '../components/dashboard/ExportMenu'
function DashboardAdmin() {
  const navigate = useNavigate()
  
  // États
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Charger les candidatures au montage
  useEffect(() => {
    loadCandidates()
  }, [])

  // Fonctions
  const handleExportExcel = () => {
    exportToExcel(candidates)
  }
  const handleExportByStatus = (statut) => {
    exportByStatus(candidates, statut)
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
    logout()
    navigate('/login')
  }

  const handleViewDetails = (candidate) => {
    setSelectedCandidate(candidate)
  }

  const calculateStats = () => {
    return {
      total: candidates.length,
      preselected: candidates.filter(c => c.statut === 'Preselected').length,
      selected: candidates.filter(c => c.statut === 'Selected').length,
      rejected: candidates.filter(c => c.statut === 'Rejected').length,
    }
  }

  // Rendu conditionnel - Formulaire d'ajout
  if (showAddForm) {
    return (
      <AdminAddCandidate 
        onBack={() => setShowAddForm(false)}
        onSuccess={() => {
          loadCandidates()
          setShowAddForm(false)
        }}
      />
    )
  }

  // Rendu conditionnel - Détails candidat
  if (selectedCandidate) {
    return (
      <CandidateDetailsPage 
        candidate={selectedCandidate} 
        onBack={() => setSelectedCandidate(null)} 
        isAdmin={true} 
      />
    )
  }

  // Rendu principal - Dashboard
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
          onClick={() => navigate('/settings')}
          className="w-full text-left px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg mb-1">
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
        {/* Header avec bouton d'ajout */}
        <ExportMenu candidates={candidates} />
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrateur</h1>
            <p className="text-gray-600">Gestion complète de toutes les candidatures</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold">
              ADMIN
            </div>
            <button
      onClick={handleExportExcel}
      className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition font-medium flex items-center gap-2"
      title="Exporter toutes les candidatures en Excel"
    >
      <span className="text-xl">📊</span>
      Exporter Excel
    </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Ajouter une candidature
            </button>
          </div>
        </div>
        
        {/* Contenu */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Chargement...</p>
          </div>
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