import { useState } from 'react'
import { createCandidature } from '../../services/candidatureService'

function AdminAddCandidate({ onBack, onSuccess }) {
  // État du formulaire
  const [formData, setFormData] = useState({
    // Informations personnelles
    prenom: '',
    nom: '',
    date_naissance: '',
    wilaya: '',
    genre: '',
    email: '',
    telephone: '',
    adresse: '',
    
    // Informations académiques
    universite: '',
    domaine: '',
    niveau: '',
    moyenne: '',
    
    // Informations du stage
    duree: '',
    date_debut: '',
    date_fin: '',
    encadrant: '',
    theme: '',
    lettre_motivation_text: '',
  })

  // Fichiers
  const [files, setFiles] = useState({
    cv: null,
    lettre_motivation: null,
    releve_notes: null,
    photo: null  
  })

  // États
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')

  // Wilayas algériennes (58)
  const wilayas = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra',
    'Béchar', 'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret',
    'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda',
    'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem',
    'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj',
    'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela',
    'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
    'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal',
    'Béni Abbès', 'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', 'El M\'Ghair',
    'El Meniaa'
  ]
  // Niveaux d'études
  const niveaux = [
    'Licence 1', 'Licence 2', 'Licence 3',
    'Master 1', 'Master 2', 'Doctorat',
    'Ingénieur1', 'Ingénieur2', 'Ingénieur3',
    'Ingénieur4', 'Ingénieur5', 
  ]
  // Durées de stage
  const durees = ['1 mois', '2 mois', '3 mois', '4 mois', '5 mois', '6 mois']

  // Gérer les changements de champs texte
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Effacer l'erreur du champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }
  const handlePhotoChange = (e) => {
  const file = e.target.files[0]
  if (!file) return

  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    setErrors(prev => ({ ...prev, photo: 'La photo doit être JPG ou PNG' }))
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    setErrors(prev => ({ ...prev, photo: 'La photo ne peut pas dépasser 2 MB' }))
    return
  }

  setFiles(prev => ({ ...prev, photo: file }))
  if (errors.photo) setErrors(prev => ({ ...prev, photo: '' }))
}
  // Gérer les fichiers
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0]
    
    // Vérifier le type
    if (file && file.type !== 'application/pdf') {
      setErrors(prev => ({
        ...prev,
        [fieldName]: 'Seuls les fichiers PDF sont acceptés'
      }))
      return
    }
    
    // Vérifier la taille (5MB max)
    if (file && file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: 'Le fichier doit faire moins de 5 MB'
      }))
      return
    }
    
    setFiles(prev => ({
      ...prev,
      [fieldName]: file
    }))
    
    // Effacer l'erreur
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }))
    }
  }

  // Valider le formulaire
  const validateForm = () => {
    const newErrors = {}

    // Champs obligatoires
    const requiredFields = [
      'prenom', 'nom', 'date_naissance', 'wilaya', 'genre', 'email',
      'telephone', 'adresse', 'universite', 'domaine', 'niveau', 'moyenne',
      'duree', 'date_debut', 'date_fin', 'theme', 'lettre_motivation_text'
    ]

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = 'Ce champ est obligatoire'
      }
    })

    // Vérifier les fichiers
    if (!files.cv) newErrors.cv = 'Le CV est obligatoire'
    if (!files.lettre_motivation) newErrors.lettre_motivation = 'La lettre de motivation est obligatoire'

    // Vérifier l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }

    // Vérifier la moyenne
    if (formData.moyenne && (parseFloat(formData.moyenne) < 0 || parseFloat(formData.moyenne) > 20)) {
      newErrors.moyenne = 'La moyenne doit être entre 0 et 20'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Valider
    if (!validateForm()) {
      setMessage('Veuillez corriger les erreurs dans le formulaire')
      window.scrollTo(0, 0)
      return
    }

    setIsSubmitting(true)
    setMessage('')

    try {
      // Créer FormData
      const formDataToSend = new FormData()
      
      // Ajouter tous les champs
      // Mapper les champs correctement pour le backend
formDataToSend.append('wilaya_nom', formData.wilaya)
formDataToSend.append('niveau_nom', formData.niveau)
formDataToSend.append('domaine_nom', formData.domaine)
if (files.photo) {
  formDataToSend.append('photo', files.photo)
}
// Ajouter tous les autres champs sauf wilaya, niveau, domaine
Object.keys(formData).forEach(key => {
  if (!['wilaya', 'niveau', 'domaine'].includes(key) && formData[key]) {
    formDataToSend.append(key, formData[key])
  }
})

// Source = admin
formDataToSend.append('source', 'admin')
      
      // Ajouter les fichiers requis et optionnels uniquement si présents
      if (files.cv) {
        formDataToSend.append('cv', files.cv)
      }
      if (files.lettre_motivation) {
        formDataToSend.append('lettre_motivation', files.lettre_motivation)
      }
      if (files.releve_notes) {
        formDataToSend.append('releve_notes', files.releve_notes)
      }
      if (files.photo) {
        formDataToSend.append('photo', files.photo)
      }

      // Appeler l'API
      const response = await createCandidature(formDataToSend)
      
      // Succès
      setMessage('✅ Candidature ajoutée avec succès !')
      
      // Attendre 2 secondes puis retourner au dashboard
      setTimeout(() => {
        if (onSuccess) onSuccess(response)
        if (onBack) onBack()
      }, 2000)
      
    } catch (error) {
      console.error('Erreur:', error)
      setMessage('❌ Erreur lors de l\'ajout de la candidature. Vérifiez que le backend est lancé.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ajouter une Candidature</h1>
              <p className="text-gray-600 mt-1">Pour les dossiers reçus hors plateforme</p>
            </div>
            <button
              onClick={onBack}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Retour au dashboard
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1 : Informations Personnelles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📝 Informations Personnelles</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prénom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.prenom ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
              </div>

              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.nom ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
              </div>

              {/* Date de naissance */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance *
                </label>
                <input
                  type="date"
                  name="date_naissance"
                  value={formData.date_naissance}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.date_naissance ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date_naissance && <p className="text-red-500 text-xs mt-1">{errors.date_naissance}</p>}
              </div>

              {/* Wilaya */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wilaya *
                </label>
                <select
                  name="wilaya"
                  value={formData.wilaya}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.wilaya ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionnez une wilaya</option>
                  {wilayas.map(w => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                {errors.wilaya && <p className="text-red-500 text-xs mt-1">{errors.wilaya}</p>}
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Genre *
                </label>
                <select
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.genre ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionnez</option>
                  <option value="Masculin">Masculin</option>
                  <option value="Féminin">Féminin</option>
                </select>
                {errors.genre && <p className="text-red-500 text-xs mt-1">{errors.genre}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleChange}
                  placeholder="+213 XXX XX XX XX"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.telephone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
              </div>

              {/* Adresse */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse complète *
                </label>
                <input
                  type="text"
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.adresse ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.adresse && <p className="text-red-500 text-xs mt-1">{errors.adresse}</p>}
              </div>
            </div>
          </div>

          {/* Section 2 : Informations Académiques */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎓 Informations Académiques</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Université */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Université / École *
                </label>
                <input
                  type="text"
                  name="universite"
                  value={formData.universite}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.universite ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.universite && <p className="text-red-500 text-xs mt-1">{errors.universite}</p>}
              </div>

              {/* Domaine */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domaine d'études *
                </label>
                <input
                  type="text"
                  name="domaine"
                  value={formData.domaine}
                  onChange={handleChange}
                  placeholder="Ex: Informatique, Marketing..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.domaine ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.domaine && <p className="text-red-500 text-xs mt-1">{errors.domaine}</p>}
              </div>

              {/* Niveau */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau d'études *
                </label>
                <select
                  name="niveau"
                  value={formData.niveau}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.niveau ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionnez</option>
                  {niveaux.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                {errors.niveau && <p className="text-red-500 text-xs mt-1">{errors.niveau}</p>}
              </div>

              {/* Moyenne */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moyenne générale (/20) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="moyenne"
                  value={formData.moyenne}
                  onChange={handleChange}
                  min="0"
                  max="20"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.moyenne ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.moyenne && <p className="text-red-500 text-xs mt-1">{errors.moyenne}</p>}
              </div>
            </div>
          </div>

          {/* Section 3 : Informations du Stage */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">💼 Informations du Stage</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Thème */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thème du stage *
                </label>
                <input
                  type="text"
                  name="theme"
                  value={formData.theme}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.theme ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.theme && <p className="text-red-500 text-xs mt-1">{errors.theme}</p>}
              </div>

              {/* Durée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durée *
                </label>
                <select
                  name="duree"
                  value={formData.duree}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.duree ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Sélectionnez</option>
                  {durees.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {errors.duree && <p className="text-red-500 text-xs mt-1">{errors.duree}</p>}
              </div>

              {/* Encadrant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Encadrant souhaité (optionnel)
                </label>
                <input
                  type="text"
                  name="encadrant"
                  value={formData.encadrant}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date début */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début *
                </label>
                <input
                  type="date"
                  name="date_debut"
                  value={formData.date_debut}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.date_debut ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date_debut && <p className="text-red-500 text-xs mt-1">{errors.date_debut}</p>}
              </div>

              {/* Date fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin *
                </label>
                <input
                  type="date"
                  name="date_fin"
                  value={formData.date_fin}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.date_fin ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.date_fin && <p className="text-red-500 text-xs mt-1">{errors.date_fin}</p>}
              </div>

              {/* Lettre motivation */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lettre de motivation (texte) *
                </label>
                <textarea
                  name="lettre_motivation_text"
                  value={formData.lettre_motivation_text}
                  onChange={handleChange}
                  rows="6"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.lettre_motivation_text ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Expliquez votre motivation pour ce stage..."
                />
                {errors.lettre_motivation_text && (
                  <p className="text-red-500 text-xs mt-1">{errors.lettre_motivation_text}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4 : Documents */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">📎 Documents (PDF uniquement)</h2>
            
            <div className="space-y-4">
              {/* CV */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CV * (max 5 MB)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'cv')}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    errors.cv ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {files.cv && (
                  <p className="text-green-600 text-xs mt-1">✓ {files.cv.name}</p>
                )}
                {errors.cv && <p className="text-red-500 text-xs mt-1">{errors.cv}</p>}
              </div>

              {/* Lettre motivation PDF */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lettre de motivation * (max 5 MB)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'lettre_motivation')}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    errors.lettre_motivation ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {files.lettre_motivation && (
                  <p className="text-green-600 text-xs mt-1">✓ {files.lettre_motivation.name}</p>
                )}
                {errors.lettre_motivation && (
                  <p className="text-red-500 text-xs mt-1">{errors.lettre_motivation}</p>
                )}
              </div>
                              {/* Photo du candidat */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo du candidat <span className="text-gray-400">(optionnel — JPG/PNG, max 2 MB)</span>
                  </label>
                  <div className={`w-full px-3 py-2 border rounded-lg ${
                    errors.photo ? 'border-red-500' : 'border-gray-300'
                  }`}>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handlePhotoChange}
                      className="w-full"
                    />
                  </div>
                  {files.photo && (
                    <div className="flex items-center gap-3 mt-2">
                      <img
                        src={URL.createObjectURL(files.photo)}
                        alt="Aperçu"
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                      />
                      <p className="text-green-600 text-xs">✓ {files.photo.name}</p>
                    </div>
                  )}
                  {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo}</p>}
                </div>
              {/* Relevé notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Relevé de notes (optionnel, max 5 MB)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange(e, 'releve_notes')}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    errors.releve_notes ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {files.releve_notes && (
                  <p className="text-green-600 text-xs mt-1">✓ {files.releve_notes.name}</p>
                )}
                {errors.releve_notes && (
                  <p className="text-red-500 text-xs mt-1">{errors.releve_notes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400"
            >
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter la candidature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminAddCandidate