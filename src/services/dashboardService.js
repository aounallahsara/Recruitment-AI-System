import api from './api'

// ========================================
// DONNÉES DE TEST (Temporaire)
// ========================================

const MOCK_DATA = [
  {
    id: 1,
    prenom: 'Marie',
    nom: 'Dupont',
    date_naissance: '15/03/2001',
    wilaya: 'Alger',
    genre: 'Féminin',
    email: 'marie.dupont@email.com',
    telephone: '+213 555 12 34 56',
    adresse: '25 Rue Didouche Mourad, Alger 16000',
    universite: 'Université d\'Alger 1',
    domaine: 'Informatique',
    niveau: 'Master 2',
    moyenne: '15.75',
    duree: '6 mois',
    date_debut: '01/03/2025',
    date_fin: '31/08/2025',
    encadrant: 'Dr. Ahmed Benali',
    theme: 'Développement d\'une plateforme web de gestion RH',
    date_soumission: '2025-01-02',
    lettre_motivation_text: 'Passionnée par le développement web, je souhaite mettre en pratique mes compétences en React et Django au sein de votre entreprise...',
    cv: true,
    lettre_motivation: true,
    releve_notes: true,
    statut: 'Selected'
  },
  {
    id: 2,
    prenom: 'Youcef',
    nom: 'Benali',
    date_naissance: '22/07/2000',
    wilaya: 'Oran',
    genre: 'Masculin',
    email: 'youcef.benali@email.com',
    telephone: '+213 661 23 45 67',
    adresse: '12 Boulevard de la Soummam, Oran 31000',
    universite: 'Université d\'Oran 1',
    domaine: 'Data Science',
    niveau: 'Master 1',
    moyenne: '14.20',
    duree: '4 mois',
    date_debut: '15/03/2025',
    date_fin: '15/07/2025',
    encadrant: 'Mme. Fatima Khelif',
    theme: 'Analyse prédictive des données clients',
    date_soumission: '2025-01-05',
    lettre_motivation_text: 'Intéressé par l\'analyse de données et le machine learning, je souhaite approfondir mes connaissances...',
    cv: true,
    lettre_motivation: true,
    releve_notes: true,
    statut: 'Preselected'
  },
  {
    id: 3,
    prenom: 'Amina',
    nom: 'Meziane',
    date_naissance: '10/11/2002',
    wilaya: 'Constantine',
    genre: 'Féminin',
    email: 'amina.meziane@email.com',
    telephone: '+213 770 34 56 78',
    adresse: '8 Rue Larbi Ben M\'hidi, Constantine 25000',
    universite: 'Université Constantine 1',
    domaine: 'Marketing Digital',
    niveau: 'Licence 3',
    moyenne: '13.85',
    duree: '3 mois',
    date_debut: '01/04/2025',
    date_fin: '30/06/2025',
    encadrant: '',
    theme: 'Stratégie de communication digitale',
    date_soumission: '2025-01-08',
    lettre_motivation_text: 'Motivée par le marketing digital et la communication, je souhaite acquérir une expérience pratique...',
    cv: true,
    lettre_motivation: true,
    releve_notes: true,
    statut: 'Pending'
  },
  {
    id: 4,
    prenom: 'Karim',
    nom: 'Messaoudi',
    date_naissance: '05/01/2001',
    wilaya: 'Annaba',
    genre: 'Masculin',
    email: 'karim.messaoudi@email.com',
    telephone: '+213 550 45 67 89',
    adresse: '45 Avenue de la Révolution, Annaba 23000',
    universite: 'Université Badji Mokhtar',
    domaine: 'Finance',
    niveau: 'Master 2',
    moyenne: '16.10',
    duree: '6 mois',
    date_debut: '01/02/2025',
    date_fin: '31/07/2025',
    encadrant: 'M. Rachid Bouzid',
    theme: 'Analyse financière et gestion de portefeuille',
    date_soumission: '2025-01-10',
    lettre_motivation_text: 'Passionné par la finance et l\'analyse financière, je souhaite développer mes compétences...',
    cv: true,
    lettre_motivation: true,
    releve_notes: true,
    statut: 'Pending'
  },
  {
    id: 5,
    prenom: 'Lynda',
    nom: 'Cherif',
    date_naissance: '18/09/2001',
    wilaya: 'Sétif',
    genre: 'Féminin',
    email: 'lynda.cherif@email.com',
    telephone: '+213 665 56 78 90',
    adresse: '33 Rue des Frères Bouadou, Sétif 19000',
    universite: 'Université Ferhat Abbas',
    domaine: 'Design UX/UI',
    niveau: 'Master 1',
    moyenne: '14.50',
    duree: '5 mois',
    date_debut: '15/03/2025',
    date_fin: '15/08/2025',
    encadrant: 'Mme. Sarah Kadri',
    theme: 'Refonte de l\'interface utilisateur mobile',
    date_soumission: '2025-01-12',
    lettre_motivation_text: 'Créative et rigoureuse, je souhaite approfondir mes compétences en design d\'expérience utilisateur...',
    cv: true,
    lettre_motivation: true,
    releve_notes: true,
    statut: 'Rejected'
  }
]

// ========================================
// FONCTIONS DE SERVICE
// ========================================

// Authentification RH
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login/', credentials)
    return response.data
  } catch (error) {
    console.error('Erreur login:', error)
    throw error
  }
}

// Récupérer toutes les candidatures
export const getCandidatures = async () => {
  try {
    // ⚠️ MODE TEST - Utilise les données fictives
    // Quand le backend sera prêt, remplace par :
    // const response = await api.get('/candidatures/')
    // return response.data
    
    return new Promise(resolve => {
      setTimeout(() => resolve(MOCK_DATA), 500)
    })
  } catch (error) {
    console.error('Erreur getCandidatures:', error)
    throw error
  }
}

// Récupérer une candidature spécifique
export const getCandidature = async (id) => {
  try {
    // ⚠️ MODE TEST - Cherche dans les données fictives
    // Quand le backend sera prêt, remplace par :
    // const response = await api.get(`/candidatures/${id}/`)
    // return response.data
    
    return new Promise(resolve => {
      const candidate = MOCK_DATA.find(c => c.id === id)
      setTimeout(() => resolve(candidate), 300)
    })
  } catch (error) {
    console.error('Erreur getCandidature:', error)
    throw error
  }
}

// Télécharger un document
export const downloadDocument = async (url) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    })
    return response.data
  } catch (error) {
    console.error('Erreur downloadDocument:', error)
    throw error
  }
}