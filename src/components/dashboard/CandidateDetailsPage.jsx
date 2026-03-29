import { useState } from 'react'

const criteresEvaluation = [
  {
    key: 'maitre_stage',
    label: 'Maître de stage (formulaire)',
    icon: '🧑‍💼',
    description: 'Appréciation globale du maître de stage',
  },
  {
    key: 'entretien_materiel',
    label: 'Entretien de matériel',
    icon: '🔧',
    description: 'Maîtrise et soin du matériel utilisé',
  },
  {
    key: 'interesse',
    label: 'Intéressé',
    icon: '💡',
    description: 'Motivation et intérêt pour les tâches',
  },
  {
    key: 'assiduite',
    label: 'Assiduité',
    icon: '📅',
    description: 'Présence et ponctualité durant le stage',
  },
  {
    key: 'connaissance_gc',
    label: 'Connaissance (Génie Civil)',
    icon: '🏗️',
    description: 'Niveau de connaissance en génie civil',
  },
]

function NoteInput({ value, onChange, readOnly }) {
  const num = parseFloat(value)
  const valid = !isNaN(num) && num >= 0 && num <= 20
  const isOutOfRange = !isNaN(num) && (num < 0 || num > 20)

  const getColor = () => {
    if (!valid) return 'text-gray-400'
    if (num >= 16) return 'text-green-600'
    if (num >= 12) return 'text-blue-600'
    if (num >= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleChange = (e) => {
    const raw = e.target.value
    if (raw === '') { onChange(''); return }
    const n = parseFloat(raw)
    if (!isNaN(n)) {
      if (n < 0) { onChange('0'); return }
      if (n > 20) { onChange('20'); return }
    }
    onChange(raw)
  }

  const handleBlur = (e) => {
    const n = parseFloat(e.target.value)
    if (!isNaN(n)) {
      if (n < 0) { onChange('0'); return }
      if (n > 20) { onChange('20'); return }
    }
  }

  if (readOnly) {
    return (
      <span className={`text-lg font-bold ${getColor()}`}>
        {valid ? `${num}/20` : <span className="text-gray-400 text-sm font-normal">Non évalué</span>}
      </span>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          max="20"
          step="0.5"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="—"
          className={`w-20 text-center px-2 py-1.5 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400
            ${isOutOfRange ? 'border-red-400 bg-red-50' : valid ? 'border-amber-300' : 'border-gray-300'}`}
        />
        <span className="text-gray-500 text-sm font-medium">/ 20</span>
      </div>
      {isOutOfRange && (
        <span className="text-red-500 text-xs">Entre 0 et 20 uniquement</span>
      )}
    </div>
  )
}

function CandidateDetailsPage({ candidate, onBack, isAdmin }) {
  const [evaluation, setEvaluation] = useState({
    maitre_stage: candidate.evaluation?.maitre_stage ?? '',
    entretien_materiel: candidate.evaluation?.entretien_materiel ?? '',
    interesse: candidate.evaluation?.interesse ?? '',
    assiduite: candidate.evaluation?.assiduite ?? '',
    connaissance_gc: candidate.evaluation?.connaissance_gc ?? '',
    commentaire: candidate.evaluation?.commentaire || '',
  })
  const [evalSaved, setEvalSaved] = useState(false)

  const getInitials = (prenom, nom) => {
    return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Selected':    return 'bg-green-100 text-green-700'
      case 'Preselected': return 'bg-indigo-100 text-indigo-700'
      case 'Rejected':    return 'bg-red-100 text-red-700'
      default:            return 'bg-gray-100 text-gray-700'
    }
  }

  const handleEvalChange = (field, value) => {
    setEvaluation(prev => ({ ...prev, [field]: value }))
    setEvalSaved(false)
  }

  const computeMoyenne = () => {
    const notes = criteresEvaluation
      .map(c => parseFloat(evaluation[c.key]))
      .filter(n => !isNaN(n) && n >= 0 && n <= 20)
    if (notes.length === 0) return null
    return (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(2)
  }

  const moyenne = computeMoyenne()
  const filledCount = criteresEvaluation.filter(c => {
    const n = parseFloat(evaluation[c.key])
    return !isNaN(n) && n >= 0 && n <= 20
  }).length

  const getMoyenneColor = (m) => {
    if (m === null) return 'text-gray-400'
    if (m >= 16) return 'text-green-600'
    if (m >= 12) return 'text-blue-600'
    if (m >= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMoyenneMention = (m) => {
    if (m === null) return ''
    if (m >= 16) return 'Très bien'
    if (m >= 14) return 'Bien'
    if (m >= 12) return 'Assez bien'
    if (m >= 10) return 'Passable'
    return 'Insuffisant'
  }

  const handleSaveEval = () => {
    console.log('Évaluation sauvegardée:', evaluation)
    setEvalSaved(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <button
        onClick={onBack}
        className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
      >
        ← Retour au tableau de bord
      </button>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">
            DOSSIER — {candidate.prenom?.toUpperCase()} {candidate.nom?.toUpperCase()}
          </h2>
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Profile avec photo */}
        <div className="p-6 border-b">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0">
              {candidate.photo ? (
                <img
                  src={candidate.photo}
                  alt={`${candidate.prenom} ${candidate.nom}`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 shadow"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-100 shadow">
                  {getInitials(candidate.prenom, candidate.nom)}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  {candidate.prenom} {candidate.nom}
                </h3>
              </div>
              <p className="text-gray-600">{candidate.email}</p>
              <p className="text-gray-600">{candidate.telephone}</p>
              <span className={`mt-3 inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(candidate.statut)}`}>
                {candidate.statut}
              </span>
            </div>
          </div>
        </div>

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
              <span className="text-gray-500">Email</span>
              <p className="text-gray-900 font-medium">{candidate.email}</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">📍 Adresse complète</span>
              <p className="text-gray-900 font-medium">{candidate.adresse}</p>
            </div>
          </div>
        </div>

        {/* Parcours Académique */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">Parcours Académique</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="col-span-2 md:col-span-3">
              <span className="text-gray-500">Université / École</span>
              <p className="text-gray-900 font-medium">{candidate.universite}</p>
            </div>
            <div>
              <span className="text-gray-500">Domaine d'études</span>
              <p className="text-gray-900 font-medium">{candidate.domaine}</p>
            </div>
            <div>
              <span className="text-gray-500">Niveau</span>
              <p className="text-gray-900 font-medium">{candidate.niveau}</p>
            </div>
            <div>
              <span className="text-gray-500">Moyenne générale</span>
              <p className="text-gray-900 font-medium text-lg">
                <span className="text-blue-600">{candidate.moyenne}</span>/20
              </p>
            </div>
          </div>
        </div>

        {/* Informations du Stage */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">Informations du Stage</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <span className="text-gray-500">Thème du stage</span>
              <p className="text-gray-900 font-medium">{candidate.theme}</p>
            </div>
            {candidate.encadrant && (
              <div className="col-span-2">
                <span className="text-gray-500">Encadrant souhaité</span>
                <p className="text-gray-900 font-medium">👤 {candidate.encadrant}</p>
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
              <span className="text-gray-500">Candidature soumise le</span>
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
          <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">📄 Documents Téléchargés</h4>
          <div className="space-y-3">
            {candidate.cv && (
              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">CV.pdf</p>
                    <p className="text-xs text-gray-500">Uploadé le {new Date(candidate.date_soumission).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition">Télécharger</button>
              </div>
            )}
            {candidate.lettre_motivation && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Lettre_Motivation.pdf</p>
                    <p className="text-xs text-gray-500">Uploadé le {new Date(candidate.date_soumission).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition">Télécharger</button>
              </div>
            )}
            {candidate.releve_notes && (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Releve_Notes.pdf</p>
                    <p className="text-xs text-gray-500">Uploadé le {new Date(candidate.date_soumission).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition">Télécharger</button>
              </div>
            )}
          </div>
        </div>

        {/* ÉVALUATION APRÈS STAGE — MAÎTRE DE STAGE */}
        <div className="p-6 border-b bg-amber-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-lg">📋</span>
            </div>
            <div>
              <h4 className="text-base font-bold text-amber-900 uppercase tracking-wide">
                Évaluation après stage — Maître de stage
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Note chaque critère sur 20 — la moyenne est calculée automatiquement
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {criteresEvaluation.map((critere) => (
              <div
                key={critere.key}
                className="bg-white rounded-lg border border-amber-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{critere.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-800">{critere.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{critere.description}</p>
                  </div>
                </div>
                <div className="sm:flex-shrink-0">
                  <NoteInput
                    value={evaluation[critere.key]}
                    onChange={(val) => handleEvalChange(critere.key, val)}
                    readOnly={!isAdmin}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Moyenne automatique */}
          <div className="mt-5 bg-white rounded-xl border-2 border-amber-300 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Moyenne générale de stage
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Calculée sur {filledCount} critère{filledCount > 1 ? 's' : ''} renseigné{filledCount > 1 ? 's' : ''} / {criteresEvaluation.length}
              </p>
            </div>
            <div className="text-right">
              {moyenne !== null ? (
                <>
                  <p className={`text-4xl font-extrabold ${getMoyenneColor(parseFloat(moyenne))}`}>
                    {moyenne}
                    <span className="text-lg font-medium text-gray-400">/20</span>
                  </p>
                  <p className={`text-sm font-semibold mt-1 ${getMoyenneColor(parseFloat(moyenne))}`}>
                    {getMoyenneMention(parseFloat(moyenne))}
                  </p>
                </>
              ) : (
                <p className="text-gray-400 text-sm italic">Aucune note saisie</p>
              )}
            </div>
          </div>

          {/* Commentaire général */}
          <div className="mt-4 bg-white rounded-lg border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💬</span>
              <p className="font-semibold text-gray-800">Commentaire général du maître de stage</p>
            </div>
            {isAdmin ? (
              <textarea
                value={evaluation.commentaire}
                onChange={(e) => handleEvalChange('commentaire', e.target.value)}
                rows={3}
                placeholder="Saisir un commentaire général sur le stagiaire..."
                className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            ) : (
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {evaluation.commentaire || <span className="text-gray-400 italic">Aucun commentaire saisi</span>}
              </p>
            )}
          </div>

          {isAdmin && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleSaveEval}
                className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
              >
                💾 Enregistrer l'évaluation
              </button>
              {evalSaved && (
                <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                  ✅ Évaluation enregistrée
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-sm text-gray-500">Statut actuel</span>
              <p className="text-lg font-semibold text-gray-900 mt-1">{candidate.statut}</p>
            </div>
            {isAdmin ? (
              <div className="flex gap-3">
                <button className="bg-white text-gray-700 px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium transition">
                  Modifier le statut
                </button>
                <button className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 font-medium transition">
                  Télécharger tous les documents
                </button>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-lg text-sm">
                ⚠️ Mode consultation uniquement - Modifications non autorisées
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CandidateDetailsPage