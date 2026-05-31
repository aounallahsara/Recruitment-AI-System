import { useState } from 'react'
import { updateStatut } from '../../services/dashboardService'
import api from '../../services/api'

function EvaluationForm({ candidateId, existing, onSaved }) {
  const [form, setForm] = useState({
    Comprehension_et_apprentissage:    existing?.Comprehension_et_apprentissage    || 0,
    Competences_techniques_de_base:    existing?.Competences_techniques_de_base    || 0,
    Capacite_adaptation:               existing?.Capacite_adaptation               || 0,
    Motivation_et_implication:         existing?.Motivation_et_implication         || 0,
    Esprit_analyse_et_reflexion:       existing?.Esprit_analyse_et_reflexion       || 0,
    Communication_et_comportement:     existing?.Communication_et_comportement     || 0,
    Autonomie_et_initiative:           existing?.Autonomie_et_initiative           || 0,
    commentaire:                       existing?.commentaire || '',
  })

  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await api.post(
        `/candidatures/${candidateId}/evaluation/`,
        form
      )
      onSaved(response.data)
      setShowForm(false)
    } catch (error) {
      console.error('Erreur évaluation:', error)
    } finally {
      setSaving(false)
    }
  }

  // 🔥 Mapping labels + backend keys
  const criteria = [
    { key: 'Comprehension_et_apprentissage', label: 'Compréhension et apprentissage' },
    { key: 'Competences_techniques_de_base', label: 'Compétences techniques' },
    { key: 'Capacite_adaptation',            label: "Capacité d'adaptation" },
    { key: 'Motivation_et_implication',      label: 'Motivation et implication' },
    { key: 'Esprit_analyse_et_reflexion',    label: "Esprit d'analyse et réflexion" },
    { key: 'Communication_et_comportement',  label: 'Communication et comportement' },
    { key: 'Autonomie_et_initiative',        label: 'Autonomie et initiative' },
  ]

  // 🔥 Max values selon ton modèle Django
  const maxValues = {
    Comprehension_et_apprentissage: 20,
    Competences_techniques_de_base: 20,
    Capacite_adaptation: 15,
    Motivation_et_implication: 15,
    Esprit_analyse_et_reflexion: 10,
    Communication_et_comportement: 10,
    Autonomie_et_initiative: 10,
  }

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        {existing ? "✏️ Modifier l'évaluation" : '+ Ajouter une évaluation'}
      </button>

      {showForm && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">

          {/* 🔥 CRITERES */}
          {/* Dans EvaluationForm, remplacer la partie critères */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
  {criteria.map(({ key, label }) => (
    <div key={key} className="flex flex-col">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <select
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) })}
        className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      >
        {Array.from({ length: maxValues[key] + 1 }, (_, n) => (
          <option key={n} value={n}>
            Note : {n} / {maxValues[key]}
          </option>
        ))}
      </select>
    </div>
  ))}
</div>

          {/* 🔥 COMMENTAIRE */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commentaire (optionnel)
            </label>
            <textarea
              value={form.commentaire}
              onChange={(e) =>
                setForm({ ...form, commentaire: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Observations du maître de stage..."
            />
          </div>

          {/* 🔥 ACTIONS */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuler
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

        </div>
      )}
    </div>
  )
}



function CandidateDetailsPage({ candidate, onBack, onUpdate, isAdmin }) {
  const [currentStatut, setCurrentStatut] = useState(candidate.statut)
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showStatutMenu, setShowStatutMenu] = useState(false)

  const getInitials = (prenom, nom) => `${prenom[0]}${nom[0]}`.toUpperCase()

  const getStatusColor = (status) => {
    switch (status) {
      case 'Selected':    return 'bg-green-100 text-green-700'
      case 'Preselected': return 'bg-indigo-100 text-indigo-700'
      case 'Rejected':    return 'bg-red-100 text-red-700'
      default:            return 'bg-gray-100 text-gray-700'
    }
  }

  const handleUpdateStatut = async (nouveauStatut) => {
  setShowStatutMenu(false)
  setIsUpdating(true)
  setMessage({ type: '', text: '' })

  try {
    await updateStatut(candidate.id, nouveauStatut)

    if (nouveauStatut === 'Rejected') {
      setMessage({ type: 'success', text: '✅ Candidature rejetée.' })
      setTimeout(() => onUpdate(), 2000)  // ← onUpdate au lieu de onBack
      return
    }

    setCurrentStatut(nouveauStatut)
    setMessage({ type: 'success', text: `✅ Statut mis à jour : ${nouveauStatut}` })
    setTimeout(() => onUpdate(), 1500)  // ← Recharge le dashboard
  } catch (error) {
    setMessage({ type: 'error', text: '❌ Erreur lors de la mise à jour.' })
  } finally {
    setIsUpdating(false)
  }
}

  const handleDownloadDocument = (url, filename) => {
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getDocumentUrl = (type) => {
    if (!candidate.documents) return null
    const doc = candidate.documents.find(d => d.type === type)
    return doc ? doc.fichier_url : null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <button
        onClick={onBack}
        className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
      >
        ← Retour au tableau de bord
      </button>

      {/* Message */}
      {message.text && (
        <div className={`max-w-4xl mx-auto mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">
            DOSSIER — {candidate.prenom.toUpperCase()} {candidate.nom.toUpperCase()}
          </h2>
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Profile */}
        {/* <div className="p-6 border-b">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {getInitials(candidate.prenom, candidate.nom)}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {candidate.prenom} {candidate.nom}
              </h3> */}
              {/* Photo ou initiales */}
                {candidate.photo_url ? (
                  <img
                    src={candidate.photo_url}
                    alt={`${candidate.prenom} ${candidate.nom}`}
                    className="w-20 h-20 rounded-full object-cover border-2 border-blue-300"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    {getInitials(candidate.prenom, candidate.nom)}
                  </div>
                )}
        {/* </div>
//           </div>
//         </div> */}

        {/* Informations Personnelles */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">Informations Personnelles</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Date de naissance</span>
              <p className="text-gray-900 font-medium">{candidate.date_naissance}</p>
            </div>
            <div>
              <span className="text-gray-500">Wilaya</span>
              <p className="text-gray-900 font-medium">{candidate.wilaya}</p>
            </div>
            <div>
              <span className="text-gray-500">Genre</span>
              <p className="text-gray-900 font-medium">{candidate.genre}</p>
            </div>
            <div>
              <span className="text-gray-500">Téléphone</span>
              <p className="text-gray-900 font-medium">{candidate.telephone}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Adresse</span>
              <p className="text-gray-900 font-medium">{candidate.adresse}</p>
            </div>
          </div>
        </div>

        {/* Informations Académiques */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">Parcours Académique</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="col-span-2 md:col-span-3">
              <span className="text-gray-500">Université / École</span>
              <p className="text-gray-900 font-medium">{candidate.universite}</p>
            </div>
            <div>
              <span className="text-gray-500">Domaine</span>
              <p className="text-gray-900 font-medium">{candidate.domaine}</p>
            </div>
            <div>
              <span className="text-gray-500">Niveau</span>
              <p className="text-gray-900 font-medium">{candidate.niveau}</p>
            </div>
            <div>
              <span className="text-gray-500">Moyenne</span>
              <p className="text-gray-900 font-medium text-lg">
                <span className="text-blue-600">{candidate.moyenne}</span>/20
              </p>
            </div>
          </div>
        </div>

        {/* Détails du Stage */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">Informations du Stage</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <span className="text-gray-500">Thème</span>
              <p className="text-gray-900 font-medium">{candidate.theme}</p>
            </div>
            {candidate.encadrant && (
              <div className="col-span-2">
                <span className="text-gray-500">Encadrant</span>
                <p className="text-gray-900 font-medium">{candidate.encadrant}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500">Durée</span>
              <p className="text-gray-900 font-medium">{candidate.duree}</p>
            </div>
            <div>
              <span className="text-gray-500">Période</span>
              <p className="text-gray-900 font-medium">
                {candidate.date_debut} → {candidate.date_fin}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Soumis le</span>
              <p className="text-gray-900 font-medium">
                {new Date(candidate.date_soumission).toLocaleDateString('fr-FR', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Lettre de motivation */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase">Lettre de Motivation</h4>
          <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg">
            {candidate.lettre_motivation_text}
          </p>
        </div>

        {/* Documents */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">Documents</h4>
          <div className="space-y-3">
            {[
              { type: 'cv', label: 'CV.pdf', bg: 'red' },
              { type: 'lettre', label: 'Lettre_Motivation.pdf', bg: 'blue' },
              { type: 'releve', label: 'Releve_Notes.pdf', bg: 'green' },
            ].map(({ type, label, bg }) => {
              const url = getDocumentUrl(type)
              return url ? (
                <div key={type} className={`flex items-center justify-between p-4 bg-${bg}-50 rounded-lg border border-${bg}-100`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-${bg}-100 rounded-lg flex items-center justify-center`}>
                      <span className="text-2xl">📄</span>
                    </div>
                    <p className="font-medium text-gray-900">{label}</p>
                  </div>
                  <button
                    onClick={() => handleDownloadDocument(url, label)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition"
                  >
                    Télécharger
                  </button>
                </div>
              ) : null
            })}
          </div>
        </div>
          {/* Section Évaluation - Admin seulement */}
{/* Section Évaluation - Style Dossier/Document */}
{isAdmin && (
  <div className="p-6 border-b">
    <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">
      Évaluation du Maître de Stage
    </h4>

    {candidate.evaluation ? (
      <div className="space-y-3 mb-6">
        {[
          { label: 'Compréhension et Apprentissage', value: candidate.evaluation.Comprehension_et_apprentissage, max: 20, color: 'blue' },
          { label: 'Compétences Techniques', value: candidate.evaluation.Competences_techniques_de_base, max: 20, color: 'indigo' },
          { label: "Capacité d'Adaptation", value: candidate.evaluation.Capacite_adaptation, max: 15, color: 'purple' },
          { label: 'Motivation et Implication', value: candidate.evaluation.Motivation_et_implication, max: 15, color: 'orange' },
          { label: "Esprit d'Analyse et Réflexion", value: candidate.evaluation.Esprit_analyse_et_reflexion, max: 10, color: 'cyan' },
          { label: 'Communication et Comportement', value: candidate.evaluation.Communication_et_comportement, max: 10, color: 'teal' },
          { label: 'Autonomie et Initiative', value: candidate.evaluation.Autonomie_et_initiative, max: 10, color: 'emerald' },
        ].map((item) => (
          <div key={item.label} className={`flex items-center justify-between p-4 bg-${item.color}-50 rounded-lg border border-${item.color}-100`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-${item.color}-100 rounded-lg flex items-center justify-center`}>
                <span className="text-xl">📊</span>
              </div>
              <p className="font-medium text-gray-900">{item.label}</p>
            </div>
            <div className="text-right">
              <span className={`text-lg font-bold text-${item.color}-700`}>{item.value}</span>
              <span className="text-gray-400 text-sm ml-1">/ {item.max}</span>
            </div>
          </div>
        ))}

        {/* Note Globale Mise en avant */}
        <div className="mt-6 p-5 bg-green-600 rounded-xl shadow-sm flex justify-between items-center text-white">
          <div>
            <p className="text-green-100 text-xs uppercase font-bold tracking-wider">Moyenne Générale de Stage</p>
            <p className="text-sm opacity-90">Calculée sur l'ensemble des critères</p>
          </div>
          <div className="text-3xl font-black">
            {candidate.evaluation.note_globale}<span className="text-lg opacity-70"> / 20</span>
          </div>
        </div>

        {candidate.evaluation.commentaire && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-500 uppercase font-bold mb-2">Commentaire du maître de stage</p>
            <p className="text-gray-700 italic">"{candidate.evaluation.commentaire}"</p>
          </div>
        )}
      </div>
    ) : (
      <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center mb-4">
        <p className="text-gray-400">Aucune évaluation enregistrée pour ce stagiaire.</p>
      </div>
    )}

    {/* Formulaire evaluation reste ici */}
    <EvaluationForm
      candidateId={candidate.id}
      existing={candidate.evaluation}
      onSaved={(newEvaluation) => {
        candidate.evaluation = newEvaluation;
        setMessage({ type: 'success', text: '✅ Évaluation enregistrée !' });
      }}
    />
  </div>
)}
        {/* Actions */}
        <div className="p-6 bg-gray-50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-sm text-gray-500">Statut actuel</span>
              <p className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(currentStatut)}`}>
                {currentStatut}
              </p>
            </div>
        
            {isAdmin ? (
              <div className="flex gap-3 relative">
                {/* Menu modification statut */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatutMenu(!showStatutMenu)}
                    disabled={isUpdating}
                    className="bg-white text-gray-700 px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium transition disabled:opacity-50"
                  >
                    {isUpdating ? 'Mise à jour...' : 'Modifier le statut ▾'}
                  </button>

                  {showStatutMenu && (
                    <div className="absolute right-0 bottom-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48">
                      <button
                        onClick={() => handleUpdateStatut('Preselected')}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-indigo-700 font-medium text-sm border-b"
                      >
                        Préselectionné
                      </button>
                      <button
                        onClick={() => handleUpdateStatut('Selected')}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 text-green-700 font-medium text-sm border-b"
                      >
                        Sélectionné ✅
                      </button>
                      <button
                        onClick={() => handleUpdateStatut('Rejected')}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-700 font-medium text-sm"
                      >
                        Rejeter ❌
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    getDocumentUrl('cv') && handleDownloadDocument(getDocumentUrl('cv'), 'CV.pdf')
                    getDocumentUrl('lettre') && handleDownloadDocument(getDocumentUrl('lettre'), 'Lettre.pdf')
                    getDocumentUrl('releve') && handleDownloadDocument(getDocumentUrl('releve'), 'Releve.pdf')
                  }}
                  className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 font-medium transition"
                >
                  Télécharger tous les documents
                </button>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-lg text-sm">
                ⚠️ Mode consultation uniquement
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CandidateDetailsPage