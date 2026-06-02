import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyserLettre, analyserLettrePdf, analyserCV } from '../services/aiService'
import { isAuthenticated } from '../utils/auth'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers visuels
// ─────────────────────────────────────────────────────────────────────────────

function scoreColor(score, max = 4) {
  const ratio = score / max
  if (ratio >= 0.75) return 'bg-green-500'
  if (ratio >= 0.50) return 'bg-yellow-400'
  return 'bg-red-400'
}

function scoreTextColor(score, max = 4) {
  const ratio = score / max
  if (ratio >= 0.75) return 'text-green-700'
  if (ratio >= 0.50) return 'text-yellow-600'
  return 'text-red-600'
}

function noteColor(note) {
  if (note >= 14) return 'text-green-600'
  if (note >= 10) return 'text-yellow-500'
  return 'text-red-500'
}

function noteBg(note) {
  if (note >= 14) return 'bg-green-50 border-green-200'
  if (note >= 10) return 'bg-yellow-50 border-yellow-200'
  return 'bg-red-50 border-red-200'
}

const STYLE_CONFIG = {
  humain:       { label: 'Humain',              color: 'bg-blue-100 text-blue-800',     dot: 'bg-blue-500'   },
  ia:           { label: 'Généré par IA',       color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  hybride:      { label: 'Hybride (IA+Humain)', color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  suspicion_ia: { label: 'Suspicion IA',        color: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
}

const SCORE_LABELS = {
  clarity_score:          'Clarté',
  motivation_score:       'Motivation',
  personalization_score:  'Personnalisation',
  formality_score:        'Formalité',
  lexical_richness_score: 'Richesse lexicale',
  genericity_score:       'Généricité',
}

// ─────────────────────────────────────────────────────────────────────────────
// Composants réutilisables
// ─────────────────────────────────────────────────────────────────────────────

function ScoreBar({ label, score, isGenericity = false }) {
  const displayScore = isGenericity ? 4 - score : score
  const barColor     = isGenericity
    ? (score <= 1 ? 'bg-green-500' : score <= 2 ? 'bg-yellow-400' : 'bg-red-400')
    : scoreColor(score)
  const textColor    = isGenericity
    ? (score <= 1 ? 'text-green-700' : score <= 2 ? 'text-yellow-600' : 'text-red-600')
    : scoreTextColor(score)

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">
          {label}
          {isGenericity && <span className="ml-1 text-xs text-gray-400">(0=générique)</span>}
        </span>
        <span className={`text-sm font-bold ${textColor}`}>{score}/4</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${(displayScore / 4) * 100}%` }}
        />
      </div>
    </div>
  )
}

function DropZone({ accept, label, hint, onFile, file, loading }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }, [onFile])

  return (
    <div
      onClick={() => !loading && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-blue-50'}
        ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        ${file    ? 'border-green-400 bg-green-50' : ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
        disabled={loading}
      />
      <div className="text-3xl mb-2">
        {file
          ? <span className="text-green-600 font-bold text-lg">Fichier sélectionné</span>
          : <span className="text-gray-400 text-base">Glisser-déposer ou cliquer</span>
        }
      </div>
      {file ? (
        <p className="text-sm font-medium text-green-700">{file.name}</p>
      ) : (
        <>
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-xs text-gray-400 mt-1">{hint}</p>
        </>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      <p className="text-sm text-gray-500">Analyse en cours...</p>
    </div>
  )
}

function ErrorBox({ message, onClose }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm text-red-700 font-medium">Erreur</p>
        <p className="text-sm text-red-600 mt-0.5">{message}</p>
      </div>
      <button onClick={onClose} className="text-red-400 hover:text-red-600 font-bold text-lg leading-none">&times;</button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel Lettre de motivation
// ─────────────────────────────────────────────────────────────────────────────

function LettrePanel() {
  const [mode, setMode]       = useState('text')
  const [text, setText]       = useState('')
  const [file, setFile]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)

  const canAnalyze = mode === 'text' ? text.trim().length > 30 : !!file

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = mode === 'text'
        ? await analyserLettre(text)
        : await analyserLettrePdf(file)
      setResult(data)
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setResult(null); setFile(null); setText(''); setError(null) }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
      {/* En-tête */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Lettre de motivation</h2>
          <p className="text-xs text-gray-400">Scoring 6 dimensions + style IA/humain</p>
        </div>
        {result && (
          <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1">
            Réinitialiser
          </button>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col gap-4">
        {!result && (
          <>
            {/* Sélecteur de mode */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
              {[['text', 'Texte'], ['pdf', 'PDF']].map(([m, l]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition
                    ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {l}
                </button>
              ))}
            </div>

            {mode === 'text' ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Collez ici le texte de la lettre de motivation..."
                className="flex-1 min-h-48 w-full border border-gray-200 rounded-xl p-4 text-sm text-gray-700
                           placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                disabled={loading}
              />
            ) : (
              <DropZone
                accept=".pdf"
                label="Déposez le PDF de la lettre ici"
                hint="ou cliquez pour parcourir — PDF uniquement"
                onFile={setFile}
                file={file}
                loading={loading}
              />
            )}

            {error && <ErrorBox message={error} onClose={() => setError(null)} />}

            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze || loading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition
                ${canAnalyze && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              {loading ? 'Analyse en cours...' : 'Analyser la lettre'}
            </button>
          </>
        )}

        {loading && <Spinner />}
        {result  && <LettreResults result={result} />}
      </div>
    </div>
  )
}

function LettreResults({ result }) {
  const { scores, note_globale, mention, style, metriques } = result
  const styleConf = STYLE_CONFIG[style?.prediction] || STYLE_CONFIG.humain


  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Note globale */}
      <div className={`rounded-xl border p-5 flex items-center gap-5 ${noteBg(note_globale)}`}>
        <div className="text-center">
          <div className={`text-5xl font-extrabold ${noteColor(note_globale)}`}>{note_globale}</div>
          <div className="text-xs text-gray-500 mt-0.5">/20</div>
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold text-gray-900">{mention}</div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${styleConf.color}`}>
              <span className={`w-2 h-2 rounded-full ${styleConf.dot}`} />
              {style?.prediction_fr || styleConf.label}
              <span className="text-gray-400">· {Math.round(style.confidence * 100)}%</span>
            </span>
            {style?.niveau_confiance && style.niveau_confiance !== 'standard' && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                style.niveau_confiance === 'haute'   ? 'bg-green-100 text-green-700' :
                style.niveau_confiance === 'moyenne' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                confiance {style.niveau_confiance}
              </span>
            )}
          </div>
          <div className="flex gap-3 mt-2 text-xs text-gray-400">
            <span>{metriques.word_count} mots</span>
          </div>
        </div>
      </div>

      {/* Scores 6 dimensions */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Scores détaillés</h3>
        {Object.entries(scores).map(([key, val]) => (
          <ScoreBar
            key={key}
            label={SCORE_LABELS[key] || key}
            score={val}
            isGenericity={key === 'genericity_score'}
          />
        ))}
      </div>

      {/* Spectre stylistique */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Spectre stylistique</h3>
        {Object.entries(style.spectre).map(([cls, p]) => {
          const cfg = STYLE_CONFIG[cls]
          return (
            <div key={cls} className="flex items-center gap-3 mb-2">
              <span className="text-xs w-36 text-gray-600">{cfg?.label || cls}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${cfg?.dot || 'bg-gray-400'}`}
                  style={{ width: `${Math.round(p * 100)}%` }} />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">{Math.round(p * 100)}%</span>
            </div>
          )
        })}
      </div>

      {/* Signaux détectés */}
      {style.signaux?.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Signaux détectés</h3>
          <ul className="space-y-1">
            {style.signaux.map((s, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className="text-gray-300 mt-0.5">·</span>{s}
              </li>
            ))}
          </ul>
        </div>
      )}


    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel CV
// ─────────────────────────────────────────────────────────────────────────────

function CVPanel() {
  const [file, setFile]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await analyserCV(file, true)
      setResult(data)
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setResult(null); setFile(null); setError(null) }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col">
      {/* En-tête */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Analyse du CV</h2>
        </div>
        {result && (
          <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-3 py-1">
            Réinitialiser
          </button>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col gap-4">
        {!result && (
          <>
            <DropZone
              accept=".pdf"
              label="Déposez le CV en PDF ici"
              hint="ou cliquez pour parcourir — PDF uniquement"
              onFile={setFile}
              file={file}
              loading={loading}
            />

            {error && <ErrorBox message={error} onClose={() => setError(null)} />}

            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition
                ${file && !loading
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
            >
              {loading ? 'Analyse en cours...' : 'Analyser le CV'}
            </button>
          </>
        )}

        {loading && <Spinner />}
        {result  && <CVResults result={result} />}
      </div>
    </div>
  )
}

const LEVEL_CONFIG = {
  junior: { label: 'Junior',    color: 'bg-orange-100 text-orange-700', bar: 'bg-orange-400' },
  mid:    { label: 'Mid-level', color: 'bg-blue-100 text-blue-700',     bar: 'bg-blue-500'   },
  senior: { label: 'Senior',    color: 'bg-green-100 text-green-700',   bar: 'bg-green-500'  },
}

const BREAKDOWN_LABELS = {
  competences: 'Compétences',
  formation:   'Formation',
  experience:  'Expérience',
  soft_skills: 'Soft skills',
}

function ScoreCV({ score }) {
  const pct      = Math.round(score.score_cv)
  const lvl      = LEVEL_CONFIG[score.level] || LEVEL_CONFIG.junior
  const bd       = score.breakdown || {}
  const bonusTotal = (score.bonuses?.certifications || 0) + (score.bonuses?.projets || 0)
  const scoreColor = pct >= 75 ? 'text-green-600' : pct >= 50 ? 'text-blue-600' : 'text-orange-500'
  const ringColor  = pct >= 75 ? '#16a34a'        : pct >= 50 ? '#2563eb'       : '#f97316'

  const radius = 36
  const circ   = 2 * Math.PI * radius
  const offset = circ * (1 - pct / 100)

  return (
    <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Score CV</h3>

      {/* Score global + level */}
      <div className="flex items-center gap-5 mb-4">
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="44" cy="44" r={radius} fill="none"
            stroke={ringColor} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 44 44)"
            style={{ transition: 'stroke-dashoffset 0.7s ease' }}
          />
          <text x="44" y="48" textAnchor="middle" fontSize="16" fontWeight="bold" fill={ringColor}>
            {pct}
          </text>
        </svg>
        <div>
          <p className={`text-3xl font-bold ${scoreColor}`}>{pct}<span className="text-base font-normal text-gray-400">/100</span></p>
          <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${lvl.color}`}>
            {lvl.label}
          </span>
          {bonusTotal > 0 && (
            <p className="text-xs text-gray-400 mt-1">+{Math.round(bonusTotal)} pts bonus</p>
          )}
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2.5">
        {Object.entries(bd).map(([key, val]) => {
          const maxes = { competences: 100, formation: 100, experience: 100, soft_skills: 100 }
          const pctBar = Math.min(100, Math.round((val / (maxes[key] || 100)) * 100))
          return (
            <div key={key}>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>{BREAKDOWN_LABELS[key] || key}</span>
                <span className="font-semibold">{Math.round(val)}</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${lvl.bar}`}
                  style={{ width: `${pctBar}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CVResults({ result }) {
  const { fields, skills, domain, domain_confidence, summary, score_cv } = result

  return (
    <div className="flex flex-col gap-5 animate-fade-in">

      {/* Identité */}
      <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-lg">
          {fields?.name?.charAt(0) || '?'}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{fields?.name || 'Nom non détecté'}</p>
          <p className="text-sm text-gray-500">{fields?.degree || 'Diplôme non détecté'}</p>
          <p className="text-xs text-gray-400">{fields?.university || ''}</p>
        </div>
      </div>

      {/* Domaine */}
      {domain && domain !== 'Unknown' && domain !== 'Inconnu' && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Domaine professionnel</h3>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{domain}</p>
              <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${Math.round(domain_confidence * 100)}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-bold text-indigo-600">
              {Math.round(domain_confidence * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Compétences */}
      {skills?.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Compétences détectées <span className="text-gray-300">({skills.length})</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((s, i) => (
              <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-100">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Langues */}
      {fields?.languages?.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Langues</h3>
          <div className="flex flex-wrap gap-2">
            {fields.languages.map((l, i) => (
              <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-100">
                {l}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Projets */}
      {fields?.projects?.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Projets extraits</h3>
          <ul className="space-y-1.5">
            {fields.projects.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-indigo-400 mt-0.5">▸</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Résumé extractif */}
      {summary && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Résumé extractif</h3>
          <blockquote className="border-l-4 border-indigo-200 pl-4 text-sm text-gray-600 italic leading-relaxed">
            {summary}
          </blockquote>
        </div>
      )}

      {/* Score CV */}
      {score_cv && <ScoreCV score={score_cv} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────────────────────────────────────

export default function AnalysePage() {
  const navigate = useNavigate()

  if (!isAuthenticated()) {
    navigate('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
            >
              Tableau de bord
            </button>
            <span className="text-gray-200">|</span>
            <h1 className="text-lg font-bold text-gray-900">Analyse IA</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Analyse de documents</h2>
          <p className="text-sm text-gray-500 mt-1">
            Déposez un CV ou une lettre de motivation pour obtenir une analyse automatique par les modèles locaux.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LettrePanel />
          <CVPanel />
        </div>
      </main>
    </div>
  )
}
