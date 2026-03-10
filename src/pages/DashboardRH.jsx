import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Statistics from '../components/dashboard/Statistics'
import CandidatesTable from '../components/dashboard/CandidatesTable'
import CandidateDetailsPage from '../components/dashboard/CandidateDetailsPage'
import { getCandidatures } from '../services/dashboardService'
import { logout } from '../utils/auth'
import { getUserRole } from '../utils/auth';

function DashboardRH() {
  const navigate = useNavigate()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState('Dashboard')
  const [selectedCandidate, setSelectedCandidate] = useState(null)

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
    return <CandidateDetailsPage candidate={selectedCandidate} onBack={() => setSelectedCandidate(null)} isAdmin={false} />
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar LIMITÉE */}
      <aside className="w-64 bg-white border-r min-h-screen">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">RH</h2>
          <p className="text-xs text-gray-500 mt-1">Consultation uniquement</p>
        </div>
        <nav className="px-4">
          {/* MOINS D'OPTIONS que l'admin */}
          {['Dashboard', 'All Candidates', 'Preselected'].map((item) => (
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
            <h1 className="text-2xl font-bold text-gray-900">Dashboard RH</h1>
            <p className="text-gray-600">Consultation des candidatures</p>
          </div>
          <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold">
            👤 RH
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : (
          <>
            <Statistics stats={calculateStats()} />
           <CandidatesTable 
  candidates={candidates} 
  onViewDetails={handleViewDetails}
  isAdmin={false} 
/>
          </>
        )}
      </main>
    </div>
  )
}

export default DashboardRH