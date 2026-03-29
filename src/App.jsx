import { BrowserRouter, Routes, Route } from 'react-router-dom'
import FormulairePage from './pages/FormulairePage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import SettingsPage from './pages/SettingsPage'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FormulairePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/settings" element={<SettingsPage />} /> 
      </Routes>
    </BrowserRouter>
  )
}

export default App