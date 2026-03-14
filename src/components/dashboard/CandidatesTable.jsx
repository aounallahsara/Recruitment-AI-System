import { useState } from 'react'

function CandidatesTable({ candidates, onViewDetails, isAdmin }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDomain, setFilterDomain] = useState('All Domains')
  const [filterStatus, setFilterStatus] = useState('All Statuses')

  const getStatusColor = (status) => {
    switch (status) {
      case 'Selected':
        return 'bg-green-100 text-green-700'
      case 'Preselected':
        return 'bg-indigo-100 text-indigo-700'
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700'
      case 'Rejected':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getGenreIcon = (genre) => {
    return genre === 'Masculin' ? '' : ''
  }

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      candidate.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.wilaya.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDomain = filterDomain === 'All Domains' || candidate.domaine === filterDomain
    const matchesStatus = filterStatus === 'All Statuses' || candidate.statut === filterStatus
    
    return matchesSearch && matchesDomain && matchesStatus
  })

  const uniqueDomains = ['All Domains', ...new Set(candidates.map(c => c.domaine))]
  const uniqueStatuses = ['All Statuses', 'Selected', 'Preselected', 'Pending', 'Rejected']

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Search and Filters */}
      <div className="p-4 border-b flex gap-4 items-center flex-wrap">
        <div className="flex-1 min-w-[250px]">
          <input
            type="text"
            placeholder="Rechercher par nom, email ou wilaya..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterDomain}
          onChange={(e) => setFilterDomain(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {uniqueDomains.map(domain => (
            <option key={domain} value={domain}>{domain}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {uniqueStatuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <button 
          onClick={() => {
            setSearchTerm('')
            setFilterDomain('All Domains')
            setFilterStatus('All Statuses')
          }}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        >
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Candidat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Localisation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Formation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCandidates.map((candidate) => (
              <tr key={candidate.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onViewDetails(candidate)}
                    className="text-blue-600 hover:text-blue-900 font-medium hover:underline"
                  >
                    {isAdmin ? 'Gérer →' : 'Consulter →'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getGenreIcon(candidate.genre)}</div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {candidate.prenom} {candidate.nom}
                      </div>
                      <div className="text-sm text-gray-500">{candidate.email}</div>
                      <div className="text-xs text-gray-400">{candidate.telephone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{candidate.wilaya}</div>
                    <div className="text-gray-500">{candidate.date_naissance}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{candidate.universite}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full bg-purple-100 text-purple-800">
                        {candidate.domaine}
                      </span>
                      <span className="text-xs text-gray-500">{candidate.niveau}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Moyenne: <strong>{candidate.moyenne}/20</strong>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{candidate.theme}</div>
                          <div className="text-xs text-gray-500 mt-1">📍 {candidate.adresse}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            {candidate.date_debut} → {candidate.date_fin}
                          </div>
                          {candidate.encadrant && (
                            <div className="text-xs text-blue-600 mt-1">
                              👤 {candidate.encadrant}
                            </div>
                          )}
                        </div>
                      </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(candidate.statut)}`}>
                    {candidate.statut}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => onViewDetails(candidate)}
                    className="text-blue-600 hover:text-blue-900 font-medium hover:underline"
                  >
                    Voir détails →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCandidates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucun candidat trouvé
        </div>
      )}

      {/* Stats en bas */}
      <div className="px-6 py-4 bg-gray-50 border-t text-sm text-gray-600">
        Affichage de <strong>{filteredCandidates.length}</strong> candidat(s) sur <strong>{candidates.length}</strong> au total
      </div>
    </div>
  )
}

export default CandidatesTable