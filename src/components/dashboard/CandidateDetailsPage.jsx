
import { useState, useEffect } from 'react'
import { updateStatut } from '../../services/dashboardService'
import api from '../../services/api'

function EvaluationForm({ candidateId, existing, onSaved }) {
  const [form, setForm] = useState({
    Comprehension_et_apprentissage: existing?.Comprehension_et_apprentissage || 0,
    Competences_techniques_de_base: existing?.Competences_techniques_de_base || 0,
    Capacite_adaptation:            existing?.Capacite_adaptation            || 0,
    Motivation_et_implication:      existing?.Motivation_et_implication      || 0,
    Esprit_analyse_et_reflexion:    existing?.Esprit_analyse_et_reflexion    || 0,
    Communication_et_comportement:  existing?.Communication_et_comportement  || 0,
    Autonomie_et_initiative:        existing?.Autonomie_et_initiative        || 0,
    commentaire:                    existing?.commentaire || '',
  })
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await api.post(
        `/candidatures/${candidateId}/evaluation/`, form
      )
      onSaved(response.data)
      setShowForm(false)
    } catch (error) {
      console.error('Erreur évaluation:', error)
    } finally {
      setSaving(false)
    }
  }

  const criteria = [
    { key: 'Comprehension_et_apprentissage', label: 'Compréhension et apprentissage', max: 20 },
    { key: 'Competences_techniques_de_base', label: 'Compétences techniques',          max: 20 },
    { key: 'Capacite_adaptation',            label: "Capacité d'adaptation",           max: 15 },
    { key: 'Motivation_et_implication',      label: 'Motivation et implication',       max: 15 },
    { key: 'Esprit_analyse_et_reflexion',    label: "Esprit d'analyse et réflexion",   max: 10 },
    { key: 'Communication_et_comportement',  label: 'Communication et comportement',   max: 10 },
    { key: 'Autonomie_et_initiative',        label: 'Autonomie et initiative',         max: 10 },
  ]

  return (
    <div>
      <button
        onClick={() => setShowForm(!showForm)}
        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        {existing ? " Modifier l'évaluation" : '+ Ajouter une évaluation'}
      </button>

      {showForm && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {criteria.map(({ key, label, max }) => (
              <div key={key} className="flex flex-col">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {label}
                </label>
                <select
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: parseInt(e.target.value) })}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: max + 1 }, (_, n) => (
                    <option key={n} value={n}>Note : {n} / {max}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commentaire (optionnel)
            </label>
            <textarea
              value={form.commentaire}
              onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Observations du maître de stage..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
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
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // ── Analyse IA ────────────────────────────────────────────────────
  const [analyseCv, setAnalyseCv] = useState(null)
  const [analyseLettre, setAnalyseLettre] = useState(null)
  const [scoreCv, setScoreCv] = useState(null)
  const [loadingAnalyseCv, setLoadingAnalyseCv] = useState(false)
  const [loadingAnalyseLettre, setLoadingAnalyseLettre] = useState(false)

  // ── Popup motif de refus ──────────────────────────────
  const [showRefusModal, setShowRefusModal] = useState(false)
  const [motifRefus, setMotifRefus] = useState('')

  // Charger les analyses existantes au montage
  useEffect(() => {
    loadAnalyses()
  }, [candidate.id])

  const loadAnalyses = async () => {
    try {
      const resCv = await api.get(`/ai_analysis/candidatures/${candidate.id}/cv/result/`)
      setAnalyseCv(resCv.data)
      if (resCv.data.score_cv) {
        setScoreCv(resCv.data.score_cv)
      }
    } catch (error) {
      console.log('Pas d\'analyse CV encore')
    }

    try {
      const resLettre = await api.get(`/ai_analysis/candidatures/${candidate.id}/lettre/result/`)
      setAnalyseLettre(resLettre.data)
    } catch (error) {
      console.log('Pas d\'analyse lettre encore')
    }
  }

  const handleAnalyzeCv = async () => {
    setLoadingAnalyseCv(true)
    setMessage({ type: 'info', text: '⏳ Analyse en cours... (peut prendre 1-2 min à la première exécution)' })
    try {
      const response = await api.post(`/ai_analysis/candidatures/${candidate.id}/cv/`)
      setAnalyseCv(response.data)
      if (response.data.score_cv) {
        setScoreCv(response.data.score_cv)
      }
      setMessage({ type: 'success', text: '✅ Analyse CV réalisée avec succès !' })
    } catch (error) {
      const msg = error.response?.data?.error || 'Erreur lors de l\'analyse CV'
      setMessage({ type: 'error', text: `❌ ${msg}` })
      console.error('Erreur analyse CV:', error)
    } finally {
      setLoadingAnalyseCv(false)
    }
  }

  const handleAnalyzeLettre = async () => {
    setLoadingAnalyseLettre(true)
    try {
      const response = await api.post(`/ai_analysis/candidatures/${candidate.id}/lettre/`)
      setAnalyseLettre(response.data)
      setMessage({ type: 'success', text: '✅ Analyse lettre réalisée avec succès !' })
    } catch (error) {
      const msg = error.response?.data?.error || 'Erreur lors de l\'analyse lettre'
      setMessage({ type: 'error', text: `❌ ${msg}` })
      console.error('Erreur analyse lettre:', error)
    } finally {
      setLoadingAnalyseLettre(false)
    }
  }

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
    // Si rejet → afficher le popup motif d'abord
    if (nouveauStatut === 'Rejected') {
      setShowStatutMenu(false)
      setShowRefusModal(true)
      return
    }

    setShowStatutMenu(false)
    setIsUpdating(true)
    setMessage({ type: '', text: '' })

    try {
      await updateStatut(candidate.id, nouveauStatut)
      setCurrentStatut(nouveauStatut)
      setMessage({ type: 'success', text: `✅ Statut mis à jour : ${nouveauStatut}` })
      setTimeout(() => onUpdate(), 1500)
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Erreur lors de la mise à jour.' })
    } finally {
      setIsUpdating(false)
    }
  }

  // Confirmer le rejet avec motif
  const handleConfirmRejet = async () => {
    setShowRefusModal(false)
    setIsUpdating(true)
    setMessage({ type: '', text: '' })

    try {
      await api.patch(`/candidatures/${candidate.id}/statut/`, {
        statut_nom:  'Rejected',
        motif_refus: motifRefus,
      })
      setMessage({ type: 'success', text: '✅ Candidature rejetée.' })
      setTimeout(() => onUpdate(), 2000)
    } catch (error) {
      setMessage({ type: 'error', text: '❌ Erreur lors du rejet.' })
    } finally {
      setIsUpdating(false)
    }
  }

  // Envoyer email acceptation
  const handleSendAcceptanceEmail = async () => {
    setIsSendingEmail(true)
    try {
      const response = await api.post(
        `/candidatures/${candidate.id}/send-acceptance/`
      )
      setMessage({ type: 'success', text: response.data.message })
    } catch (error) {
      const msg = error.response?.data?.error || 'Erreur envoi email'
      setMessage({ type: 'error', text: `❌ ${msg}` })
    } finally {
      setIsSendingEmail(false)
    }
  }

  // Envoyer email refus
  const handleSendRejectionEmail = async () => {
    setIsSendingEmail(true)
    try {
      const response = await api.post(
        `/candidatures/${candidate.id}/send-rejection/`
      )
      setMessage({ type: 'success', text: response.data.message })
    } catch (error) {
      const msg = error.response?.data?.error || 'Erreur envoi email'
      setMessage({ type: 'error', text: `❌ ${msg}` })
    } finally {
      setIsSendingEmail(false)
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

      {/* ── Modal Motif de Refus ─────────────────────── */}
      {showRefusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Motif de refus
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Ce motif sera envoyé au candidat par email s'il demande une explication.
            </p>
            <textarea
              value={motifRefus}
              onChange={(e) => setMotifRefus(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 mb-4"
              placeholder="Ex: Le profil ne correspond pas aux critères requis pour ce poste..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRefusModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRejet}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={onBack}
        className="mb-6 text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
        ← Retour au tableau de bord
      </button>

      {message.text && (
        <div className={`max-w-4xl mx-auto mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 
          message.type === 'error' ? 'bg-red-100 text-red-800' :
          'bg-blue-100 text-blue-800'
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
        <div className="p-6 border-b">
          <div className="flex items-start gap-4">
            {candidate.photo_url ? (
              <img src={candidate.photo_url} alt={`${candidate.prenom} ${candidate.nom}`}
                className="w-20 h-20 rounded-full object-cover border-2 border-blue-300" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                {getInitials(candidate.prenom, candidate.nom)}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {candidate.prenom} {candidate.nom}
              </h3>
              <p className="text-gray-600">{candidate.email}</p>
              <p className="text-gray-600">{candidate.telephone}</p>
              <span className={`mt-3 inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentStatut)}`}>
                {currentStatut}
              </span>
            </div>
          </div>
        </div>

        {/* Informations Personnelles */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">Informations Personnelles</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="text-gray-500">Date de naissance</span><p className="text-gray-900 font-medium">{candidate.date_naissance}</p></div>
            <div><span className="text-gray-500">Wilaya</span><p className="text-gray-900 font-medium">{candidate.wilaya}</p></div>
            <div><span className="text-gray-500">Genre</span><p className="text-gray-900 font-medium">{candidate.genre}</p></div>
            <div><span className="text-gray-500">Téléphone</span><p className="text-gray-900 font-medium">{candidate.telephone}</p></div>
            <div className="col-span-2"><span className="text-gray-500">Adresse</span><p className="text-gray-900 font-medium">{candidate.adresse}</p></div>
          </div>
        </div>

        {/* Informations Académiques */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">Parcours Académique</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="col-span-2 md:col-span-3"><span className="text-gray-500">Université</span><p className="text-gray-900 font-medium">{candidate.universite}</p></div>
            <div><span className="text-gray-500">Domaine</span><p className="text-gray-900 font-medium">{candidate.domaine}</p></div>
            <div><span className="text-gray-500">Niveau</span><p className="text-gray-900 font-medium">{candidate.niveau}</p></div>
            <div><span className="text-gray-500">Moyenne</span><p className="text-gray-900 font-medium"><span className="text-blue-600">{candidate.moyenne}</span>/20</p></div>
          </div>
        </div>

        {/* Détails du Stage */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">Informations du Stage</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="col-span-2"><span className="text-gray-500">Thème</span><p className="text-gray-900 font-medium">{candidate.theme}</p></div>
            {candidate.encadrant && <div className="col-span-2"><span className="text-gray-500">Encadrant</span><p className="text-gray-900 font-medium">{candidate.encadrant}</p></div>}
            <div><span className="text-gray-500">Durée</span><p className="text-gray-900 font-medium">{candidate.duree}</p></div>
            <div><span className="text-gray-500">Période</span><p className="text-gray-900 font-medium">{candidate.date_debut} → {candidate.date_fin}</p></div>
            <div className="col-span-2">
              <span className="text-gray-500">Soumis le</span>
              <p className="text-gray-900 font-medium">
                {new Date(candidate.date_soumission).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Motif de refus si rejeté */}
        {currentStatut === 'Rejected' && candidate.motif_refus && (
          <div className="p-6 border-b bg-red-50">
            <h4 className="text-sm font-semibold text-red-500 mb-2 uppercase">Motif de refus</h4>
            <p className="text-red-700 text-sm">{candidate.motif_refus}</p>
          </div>
        )}

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
              { type: 'cv',     label: 'CV.pdf',                  bg: 'red'   },
              { type: 'lettre', label: 'Lettre_Motivation.pdf',   bg: 'blue'  },
              { type: 'releve', label: 'Releve_Notes.pdf',        bg: 'green' },
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
                  <button onClick={() => handleDownloadDocument(url, label)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-4 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition">
                    Télécharger
                  </button>
                </div>
              ) : null
            })}
          </div>
        </div>

        {/* ── ANALYSE IA ─────────────────────────────────── */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">Analyse IA</h4>
          
          {/* Boutons d'analyse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleAnalyzeCv}
              disabled={loadingAnalyseCv}
              className="flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 font-medium transition disabled:opacity-50 disabled:cursor-wait"
            >
              {loadingAnalyseCv ? '⏳ Analyse CV...' : ' Analyser le CV'}
            </button>
            <button
              onClick={handleAnalyzeLettre}
              disabled={loadingAnalyseLettre}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition disabled:opacity-50 disabled:cursor-wait"
            >
              {loadingAnalyseLettre ? '⏳ Analyse lettre...' : ' Analyser la lettre'}
            </button>
          </div>

          {/* Résultats Analyse CV */}
          {analyseCv && (
            <div className="mb-6 space-y-4">
              <div className="p-5 bg-white rounded-lg border-2 border-red-200">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="text-lg font-bold text-red-700"> Analyse CV</h5>
                  <span className="text-xs text-gray-500">{new Date(analyseCv.date_analyse).toLocaleDateString('fr-FR')}</span>
                </div>
                
                {/* Score CV si disponible */}
                {scoreCv && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-xs uppercase font-bold">Score CV Global</p>
                        <p className="text-sm opacity-90">Niveau: <span className="font-bold uppercase">{scoreCv.level}</span></p>
                      </div>
                      <div className="text-4xl font-black">{scoreCv.score_cv}<span className="text-lg opacity-70">/100</span></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                      <div className="bg-red-600 bg-opacity-50 p-2 rounded">
                        <p className="opacity-75">Compétences</p>
                        <p className="font-bold">{scoreCv.score_competences}</p>
                      </div>
                      <div className="bg-red-600 bg-opacity-50 p-2 rounded">
                        <p className="opacity-75">Formation</p>
                        <p className="font-bold">{scoreCv.score_formation}</p>
                      </div>
                      <div className="bg-red-600 bg-opacity-50 p-2 rounded">
                        <p className="opacity-75">Expérience</p>
                        <p className="font-bold">{scoreCv.score_experience}</p>
                      </div>
                      <div className="bg-red-600 bg-opacity-50 p-2 rounded">
                        <p className="opacity-75">Soft Skills</p>
                        <p className="font-bold">{scoreCv.score_soft_skills}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informations personnelles et académiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-red-50 rounded">
                    <p className="text-xs text-gray-500 font-semibold mb-1">NOM DÉTECTÉ</p>
                    <p className="text-gray-900">{analyseCv.nom_detecte || '—'}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <p className="text-xs text-gray-500 font-semibold mb-1">DOMAINE DÉTECTÉ</p>
                    <p className="text-gray-900 font-medium">{analyseCv.domaine_detecte || '—'}</p>
                    {analyseCv.domaine_confiance && (
                      <p className="text-xs text-gray-600 mt-1">Confiance: {(analyseCv.domaine_confiance * 100).toFixed(0)}%</p>
                    )}
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <p className="text-xs text-gray-500 font-semibold mb-1">DIPLÔME</p>
                    <p className="text-gray-900">{analyseCv.diplome || '—'}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <p className="text-xs text-gray-500 font-semibold mb-1">UNIVERSITÉ</p>
                    <p className="text-gray-900">{analyseCv.universite_detectee || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Compétences */}
              {analyseCv.competences && analyseCv.competences.length > 0 && (
                <div className="p-4 bg-white rounded-lg border-2 border-red-100">
                  <p className="text-sm font-bold text-red-700 mb-3">🎯 Compétences Détectées ({analyseCv.competences.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {analyseCv.competences.map((skill, idx) => (
                      <span key={idx} className="text-xs bg-red-200 text-red-800 px-3 py-1.5 rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Éducation */}
              {analyseCv.education && (
                <div className="p-4 bg-white rounded-lg border-2 border-red-100">
                  <p className="text-sm font-bold text-red-700 mb-3">🎓 Éducation</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{analyseCv.education}</p>
                </div>
              )}

              {/* Langues */}
              {analyseCv.langues && analyseCv.langues.length > 0 && (
                <div className="p-4 bg-white rounded-lg border-2 border-red-100">
                  <p className="text-sm font-bold text-red-700 mb-3">🗣️ Langues</p>
                  <div className="flex flex-wrap gap-2">
                    {analyseCv.langues.map((lang, idx) => (
                      <span key={idx} className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-medium">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Projets */}
              {analyseCv.projets && analyseCv.projets.length > 0 && (
                <div className="p-4 bg-white rounded-lg border-2 border-red-100">
                  <p className="text-sm font-bold text-red-700 mb-3">📁 Projets ({analyseCv.projets.length})</p>
                  <div className="space-y-2">
                    {analyseCv.projets.map((projet, idx) => (
                      <div key={idx} className="p-2 bg-red-50 rounded text-sm text-gray-700">
                        <p className="font-medium">▸ {typeof projet === 'string' ? projet : projet.title || JSON.stringify(projet)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Résumé extractif */}
              {analyseCv.resume && (
                <div className="p-4 bg-white rounded-lg border-2 border-red-100">
                  <p className="text-sm font-bold text-red-700 mb-3">📝 Résumé Extractif</p>
                  <p className="text-sm text-gray-700 italic leading-relaxed">{analyseCv.resume}</p>
                </div>
              )}
            </div>
          )}

          {/* Résultats Analyse Lettre */}
          {analyseLettre && (
            <div className="p-5 bg-white rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-lg font-bold text-blue-700">📋 Analyse Lettre de Motivation</h5>
                <span className="text-xs text-gray-500">{new Date(analyseLettre.date_analyse).toLocaleDateString('fr-FR')}</span>
              </div>

              {/* Note globale */}
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs uppercase font-bold">Note Globale</p>
                    <p className="text-sm opacity-90">Mention: {analyseLettre.mention}</p>
                  </div>
                  <div className="text-4xl font-black">{analyseLettre.note_globale}<span className="text-lg opacity-70">/20</span></div>
                </div>
              </div>

              {/* 6 scores de dimension */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Clarté', val: analyseLettre.clarity_score, max: 4 },
                  { label: 'Motivation', val: analyseLettre.motivation_score, max: 4 },
                  { label: 'Personnalisation', val: analyseLettre.personalization_score, max: 4 },
                  { label: 'Formalité', val: analyseLettre.formality_score, max: 4 },
                  { label: 'Richesse lexicale', val: analyseLettre.lexical_richness_score, max: 4 },
                  { label: 'Généricité', val: analyseLettre.genericity_score, max: 4 },
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-100">
                    <p className="text-xs text-gray-600 font-semibold">{item.label}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="w-12 h-6 bg-blue-200 rounded overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${(item.val / item.max) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-blue-700">{item.val}/{item.max}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Analyse de style */}
              {analyseLettre.style_prediction && (
                <div className="p-3 bg-blue-50 rounded border border-blue-100 mb-3">
                  <p className="text-xs text-gray-500 font-semibold mb-2">STYLE DÉTECTÉ</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-blue-700">{analyseLettre.style_prediction_fr}</p>
                      <p className="text-xs text-gray-600">{analyseLettre.style_description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Confiance</p>
                      <p className="text-lg font-bold text-blue-700">{(analyseLettre.style_confidence * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Amélioration proposées */}
              {analyseLettre.ameliorations && Object.keys(analyseLettre.ameliorations).length > 0 && (
                <div className="p-3 bg-blue-50 rounded border border-blue-100">
                  <p className="text-xs text-gray-500 font-semibold mb-2">POINTS À AMÉLIORER</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {Object.entries(analyseLettre.ameliorations).map(([key, value]) => (
                      <li key={key} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">▸</span>
                        <span>{value}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!analyseCv && !analyseLettre && (
            <div className="p-6 text-center bg-white rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-500 text-sm mb-2">Aucune analyse réalisée pour ce candidat.</p>
              <p className="text-xs text-gray-400">Cliquez sur les boutons ci-dessus pour analyser le CV et la lettre.</p>
            </div>
          )}
        </div>

        {/* Évaluation */}
        {isAdmin && currentStatut !== 'Rejected'&&currentStatut !== 'Preselected'&& (
          <div className="p-6 border-b">
            <h4 className="text-sm font-semibold text-gray-500 mb-4 uppercase">
              Évaluation du Maître de Stage
            </h4>
            {candidate.evaluation ? (
              <div className="space-y-3 mb-6">
                {[
                  { label: 'Compréhension et Apprentissage', value: candidate.evaluation.Comprehension_et_apprentissage, max: 20, color: 'blue' },
                  { label: 'Compétences Techniques',         value: candidate.evaluation.Competences_techniques_de_base, max: 20, color: 'indigo' },
                  { label: "Capacité d'Adaptation",          value: candidate.evaluation.Capacite_adaptation,            max: 15, color: 'purple' },
                  { label: 'Motivation et Implication',      value: candidate.evaluation.Motivation_et_implication,      max: 15, color: 'orange' },
                  { label: "Esprit d'Analyse",               value: candidate.evaluation.Esprit_analyse_et_reflexion,    max: 10, color: 'cyan'   },
                  { label: 'Communication',                  value: candidate.evaluation.Communication_et_comportement,  max: 10, color: 'teal'   },
                  { label: 'Autonomie',                      value: candidate.evaluation.Autonomie_et_initiative,        max: 10, color: 'emerald'},
                ].map(item => (
                  <div key={item.label} className={`flex items-center justify-between p-4 bg-${item.color}-50 rounded-lg border border-${item.color}-100`}>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <span className={`text-lg font-bold text-${item.color}-700`}>
                      {item.value}<span className="text-gray-400 text-sm ml-1">/ {item.max}</span>
                    </span>
                  </div>
                ))}
                <div className="mt-4 p-5 bg-green-600 rounded-xl flex justify-between items-center text-white">
                  <div>
                    <p className="text-green-100 text-xs uppercase font-bold">Moyenne Générale</p>
                    <p className="text-sm opacity-90">Sur l'ensemble des critères</p>
                  </div>
                  <div className="text-3xl font-black">
                    {candidate.evaluation.note_globale}<span className="text-lg opacity-70"> / 20</span>
                  </div>
                </div>
                {candidate.evaluation.commentaire && (
                  <div className="p-4 bg-gray-50 border rounded-lg">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Commentaire</p>
                    <p className="text-gray-700 italic">"{candidate.evaluation.commentaire}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center mb-4">
                <p className="text-gray-400">Aucune évaluation enregistrée.</p>
              </div>
            )}
            <EvaluationForm
              candidateId={candidate.id}
              existing={candidate.evaluation}
              onSaved={(newEval) => {
                candidate.evaluation = newEval
                setMessage({ type: 'success', text: '✅ Évaluation enregistrée !' })
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
              <div className="flex flex-wrap gap-3 relative">

                {/* Bouton email selon statut */}
                {currentStatut === 'Selected' && (
                  <button
                    onClick={handleSendAcceptanceEmail}
                    disabled={isSendingEmail}
                    className="bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 font-medium transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSendingEmail ? '⏳ Envoi...' : '📧 Email acceptation'}
                  </button>
                )}

                {currentStatut === 'Rejected' && (
                  <button
                    onClick={handleSendRejectionEmail}
                    disabled={isSendingEmail}
                    className="bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 font-medium transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSendingEmail ? '⏳ Envoi...' : '📧 Email refus'}
                  </button>
                )}

                {/* Menu statut */}
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
                      <button onClick={() => handleUpdateStatut('Preselected')}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-indigo-700 font-medium text-sm border-b">
                        Préselectionné
                      </button>
                      <button onClick={() => handleUpdateStatut('Selected')}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 text-green-700 font-medium text-sm border-b">
                        Sélectionné ✅
                      </button>
                      <button onClick={() => handleUpdateStatut('Rejected')}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-700 font-medium text-sm">
                        Rejeter ❌
                      </button>
                    </div>
                  )}
                </div>

                {/* Télécharger tout */}
                <button
                  onClick={() => {
                    getDocumentUrl('cv')     && handleDownloadDocument(getDocumentUrl('cv'),     'CV.pdf')
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