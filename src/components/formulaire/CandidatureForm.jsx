import { useState } from 'react'
import FileUpload from '../shared/FileUpload'
import { submitCandidature } from '../../services/candidatureService'

function CandidatureForm() {
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    date_naissance: '',
    wilaya: '',
    genre: '',
    email: '',
    telephone: '',
    universite: '',
    domaine: '',
    niveau: '',
    moyenne: '',
    duree: '',
    date_debut: '',
    date_fin: '',
    encadrant: '',
    theme: '',
    direction: '',
    lettre_motivation_text: '',
    cv: null,
    lettre_motivation: null,
    releve_notes: null,
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const wilayas = [
    'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
    'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger',
    'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma',
    'Constantine', 'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh',
    'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued',
    'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
    'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal', 'Béni Abbès',
    'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', 'El M\'Ghair', 'El Meniaa'
  ]

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (fieldName) => (file) => {
    setFormData({ ...formData, [fieldName]: file })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      const data = new FormData()
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          data.append(key, formData[key])
        }
      })

      await submitCandidature(data)
      
      setMessage({
        type: 'success',
        text: 'Votre candidature a été envoyée avec succès ! 🎉'
      })
      
      setFormData({
        prenom: '',
        nom: '',
        date_naissance: '',
        wilaya: '',
        genre: '',
        email: '',
        telephone: '',
        universite: '',
        domaine: '',
        niveau: '',
        moyenne: '',
        duree: '',
        date_debut: '',
        date_fin: '',
        encadrant: '',
        theme: '',
        direction: '',
        lettre_motivation_text: '',
        cv: null,
        lettre_motivation: null,
        releve_notes: null,
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Une erreur est survenue. Veuillez réessayer.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b px-8 py-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Formulaire de Demande de Stage
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Remplissez tous les champs pour soumettre votre candidature
        </p>
      </div>

      <div className="px-8 py-6">
        {/* Message de confirmation/erreur */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Informations Personnelles */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Informations Personnelles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleInputChange}
                placeholder="Votre prénom"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                placeholder="Votre nom"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Date de naissance <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date_naissance"
                value={formData.date_naissance}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Wilaya <span className="text-red-500">*</span>
              </label>
              <select
                name="wilaya"
                value={formData.wilaya}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Sélectionnez</option>
                {wilayas.map(wilaya => (
                  <option key={wilaya} value={wilaya}>{wilaya}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Genre <span className="text-red-500">*</span>
              </label>
              <select
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Sélectionnez</option>
                <option value="Masculin">Masculin</option>
                <option value="Féminin">Féminin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="votre.email@exemple.com"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                placeholder="0612345678"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
<div>
              <label className="block text-gray-700 text-sm mb-2">
                Direction  <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="direction"
                value={formData.direction}
                onChange={handleInputChange}
                placeholder="ex:25 Rue Didouche Mourad, Alger 16000"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

          </div>
        </div>




        {/* Informations Académiques */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Informations Académiques
          </h3>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm mb-2">
              Université / École <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="universite"
              value={formData.universite}
              onChange={handleInputChange}
              placeholder="Nom de votre établissement"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Domaine d'études <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="domaine"
                value={formData.domaine}
                onChange={handleInputChange}
                placeholder="ex: Informatique, Marketing..."
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Niveau d'études <span className="text-red-500">*</span>
              </label>
              <select
                name="niveau"
                value={formData.niveau}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Sélectionnez</option>
                <option value="Licence 1">Licence 1</option>
                <option value="Licence 2">Licence 2</option>
                <option value="Licence 3">Licence 3</option>
                <option value="Master 1">Master 1</option>
                <option value="Master 2">Master 2</option>
                <option value="Doctorat">Doctorat</option>
                <option value="Ingénieur 1">Ingénieur 1</option> 
                <option value="Ingénieur 2">Ingénieur 2</option>
                <option value="Ingénieur 3">Ingénieur 3</option>
                <option value="Ingénieur 4">Ingénieur 4</option>
                <option value="Ingénieur 5">Ingénieur 5 </option>
                
                
                

              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Moyenne générale <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="20"
                name="moyenne"
                value={formData.moyenne}
                onChange={handleInputChange}
                placeholder="14.50"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Détails du Stage */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Détails du Stage
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            

            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Encadrant 
              </label>
              <input
                type="text"
                name="encadrant"
                value={formData.encadrant}
                onChange={handleInputChange}
                placeholder="Nom de l'encadrant "
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm mb-2">
              Thème du stage <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="theme"
              value={formData.theme}
              onChange={handleInputChange}
              placeholder="ex: Développement d'une application web"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Durée <span className="text-red-500">*</span>
              </label>
              <select
                name="duree"
                value={formData.duree}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Sélectionnez</option>
                <option value="1 mois">1 mois</option>
                <option value="2 mois">2 mois</option>
                <option value="3 mois">3 mois</option>
                <option value="4 mois">4 mois</option>
                <option value="5 mois">5 mois</option>
                <option value="6 mois">6 mois</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Date de début <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date_debut"
                value={formData.date_debut}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Date de fin <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date_fin"
                value={formData.date_fin}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-gray-700 text-sm mb-2">
              Lettre de motivation <span className="text-red-500">*</span>
            </label>
            <textarea
              name="lettre_motivation_text"
              value={formData.lettre_motivation_text}
              onChange={handleInputChange}
              placeholder="Décrivez vos motivations et vos objectifs pour ce stage..."
              required
              rows="6"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Documents */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Documents
          </h3>
          
          <FileUpload
            label="CV (PDF)"
            accept=".pdf"
            onChange={handleFileChange('cv')}
            required
          />
          
          <FileUpload
            label="Lettre de motivation (PDF)"
            accept=".pdf"
            onChange={handleFileChange('lettre_motivation')}
            required
          />
          
          <FileUpload
            label="Relevé de notes (PDF)"
            accept=".pdf"
            onChange={handleFileChange('releve_notes')}
            required
          />
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gray-900 text-white py-3.5 rounded-lg font-semibold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Envoi en cours...' : 'Soumettre la candidature'}
        </button>
      </div>
    </form>
  )
}

export default CandidatureForm