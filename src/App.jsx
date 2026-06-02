import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import FormulairePage from './pages/FormulairePage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import SettingsPage from './pages/SettingsPage'
import AnalysePage from './pages/AnalysePage'


function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<FormulairePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/analyse" element={<AnalysePage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App