// Récupérer le rôle de l'utilisateur
export const getUserRole = () => {
  return localStorage.getItem('userRole')
}

// Récupérer le token
export const getToken = () => {
  return localStorage.getItem('token')
}

// Vérifier si l'utilisateur est admin
export const isAdmin = () => {
  return getUserRole() === 'admin'
}

// Vérifier si l'utilisateur est connecté
export const isAuthenticated = () => {
  return !!getToken()
}

// Déconnexion
export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userRole')
}