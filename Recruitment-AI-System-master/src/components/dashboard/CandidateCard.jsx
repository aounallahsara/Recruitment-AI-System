function CandidateCard({ candidate, onView }) {
      return (
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">
                {candidate.prenom} {candidate.nom}
              </h3>
              <p className="text-gray-600">{candidate.email}</p>
              <p className="text-gray-600">{candidate.telephone}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              candidate.statut === 'nouveau' ? 'bg-blue-100 text-blue-700' :
              candidate.statut === 'en_cours' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {candidate.statut}
            </span>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">Documents :</p>
            <div className="flex gap-2">
              {candidate.cv && (
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">CV</span>
              )}
              {candidate.lettre_motivation && (
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">Lettre</span>
              )}
              {candidate.releve_notes && (
                <span className="bg-gray-100 px-2 py-1 rounded text-xs">Relevé</span>
              )}
            </div>
          </div>

          <button
            onClick={() => onView(candidate)}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Voir le détail
          </button>
        </div>
      )
    }

    export default CandidateCard