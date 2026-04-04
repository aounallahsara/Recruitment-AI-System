function CandidateCard({ candidate, onView }) {
  const getInitials = (prenom, nom) => {
    return `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase()
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
      {/* Photo du candidat */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-shrink-0">
          {candidate.photo ? (
            <img
              src={candidate.photo}
              alt={`${candidate.prenom} ${candidate.nom}`}
              className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold border-2 border-blue-200">
              {getInitials(candidate.prenom, candidate.nom)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold truncate">
                {candidate.prenom} {candidate.nom}
              </h3>
              <p className="text-gray-600 text-sm truncate">{candidate.email}</p>
              <p className="text-gray-600 text-sm">{candidate.telephone}</p>
            </div>
            <span className={`ml-2 flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
              candidate.statut === 'Selected' ? 'bg-green-100 text-green-700' :
              candidate.statut === 'Preselected' ? 'bg-indigo-100 text-indigo-700' :
              candidate.statut === 'Rejected' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {candidate.statut}
            </span>
          </div>
        </div>
      </div>

      {/* Domaine & Université */}
      {(candidate.domaine || candidate.universite) && (
        <div className="mb-3 text-sm text-gray-600">
          {candidate.universite && <p className="font-medium">{candidate.universite}</p>}
          {candidate.domaine && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
              {candidate.domaine}
            </span>
          )}
        </div>
      )}

      {/* Documents */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">Documents :</p>
        <div className="flex gap-2 flex-wrap">
          {candidate.cv && (
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">📄 CV</span>
          )}
          {candidate.lettre_motivation && (
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">✉️ Lettre</span>
          )}
          {candidate.releve_notes && (
            <span className="bg-gray-100 px-2 py-1 rounded text-xs">📊 Relevé</span>
          )}
        </div>
      </div>

      <button
        onClick={() => onView(candidate)}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition font-medium"
      >
        Voir le détail
      </button>
    </div>
  )
}

export default CandidateCard