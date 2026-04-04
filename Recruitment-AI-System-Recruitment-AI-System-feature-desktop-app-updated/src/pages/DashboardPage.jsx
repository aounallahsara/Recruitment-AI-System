import { getUserRole } from '../utils/auth'
import DashboardRH from './DashboardRH'
import DashboardAdmin from './DashboardAdmin'

function DashboardPage() {
  const userRole = getUserRole()

  if (userRole === 'admin') return <DashboardAdmin />
  if (userRole === 'rh') return <DashboardRH />

  // Rôle par défaut → DashboardAdmin
  return <DashboardAdmin />
}

export default DashboardPage