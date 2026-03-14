function Statistics({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg border-t-4 border-blue-500 shadow">
        <h3 className="text-gray-600 text-sm font-medium">Total Candidates</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        <p className="text-xs text-gray-500 mt-1">All this week</p>
      </div>

      <div className="bg-white p-6 rounded-lg border-t-4 border-yellow-500 shadow">
        <h3 className="text-gray-600 text-sm font-medium">Pending Review</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
        <p className="text-xs text-gray-500 mt-1">Pending review</p>
      </div>

      <div className="bg-white p-6 rounded-lg border-t-4 border-indigo-500 shadow">
        <h3 className="text-gray-600 text-sm font-medium">Preselected</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.preselected}</p>
        <p className="text-xs text-gray-500 mt-1">In process</p>
      </div>

      <div className="bg-white p-6 rounded-lg border-t-4 border-green-500 shadow">
        <h3 className="text-gray-600 text-sm font-medium">Final Selected</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.selected}</p>
        <p className="text-xs text-gray-500 mt-1">Done/Hired</p>
      </div>

      <div className="bg-white p-6 rounded-lg border-t-4 border-red-500 shadow">
        <h3 className="text-gray-600 text-sm font-medium">Rejected</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.rejected}</p>
        <p className="text-xs text-gray-500 mt-1">Not suitable</p>
      </div>
    </div>
  )
}

export default Statistics