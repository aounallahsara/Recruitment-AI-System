import { useState, useEffect } from 'react'
    import CandidateCard from './CandidateCard'
    import { getCandidatures } from '../../services/dashboardService'

    function CandidateList() {
      const [candidates, setCandidates] = useState([])
      const [loading, setLoading] = useState(true)
      const [filter, setFilter] = useState('tous')

      useEffect(() => {
        loadCandidates()
      }, [])

      const loadCandidates = async () => {
        try {
          const data = await getCandidatures()
          setCandidates(data)
        } catch (error) {
          console.error('Erreur chargement candidatures:', error)
        } finally {
          setLoading(false)
        }
      }

      const filteredCandidates = candidates.filter(c => 
        filter === 'tous' || c.statut === filter
      )

      if (loading) {
        return <div className="text-center py-12">Chargement...</div>
      }

      return (
        <div>
          {/* Filtres */}
          <div className="mb-6 flex gap-4">
            <button
              onClick={() => setFilter('tous')}
              className={`px-4 py-2 rounded ${filter === 'tous' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Tous ({candidates.length})
            </button>
            <button
              onClick={() => setFilter('nouveau')}
              className={`px-4 py-2 rounded ${filter === 'nouveau' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              Nouveaux
            </button>
            <button
              onClick={() => setFilter('en_cours')}
              className={`px-4 py-2 rounded ${filter === 'en_cours' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
            >
              En cours
            </button>
          </div>

          {/* Liste des candidats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCandidates.map(candidate => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onView={(c) => console.log('Voir candidat:', c)}
              />
            ))}
          </div>
        </div>
      )
    }

    export default CandidateList