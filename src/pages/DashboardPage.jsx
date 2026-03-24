import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthenticated, getUserRole } from '../utils/auth'
import DashboardRH from './DashboardRH'
import DashboardAdmin from './DashboardAdmin'

function DashboardPage() {
  const navigate = useNavigate()
  const userRole = getUserRole()

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login')
    }
  }, [navigate])

  // Routing selon le rôle
  if (userRole === 'admin') return <DashboardAdmin />
  if (userRole === 'rh') return <DashboardRH />

  // Si rôle inconnu
  return null
}

export default DashboardPage
