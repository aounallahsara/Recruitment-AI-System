import { useState } from 'react'
import { exportToExcel, exportByStatus } from '../../utils/excelExport'

function ExportMenu({ candidates }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleExportAll = () => {
    exportToExcel(candidates)
    setIsOpen(false)
  }

  const handleExportByStatus = (statut) => {
    exportByStatus(candidates, statut)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition font-medium flex items-center gap-2"
      >
        <span className="text-xl">📊</span>
        Exporter Excel
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <>
          {/* Overlay pour fermer le menu */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu déroulant */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-2">
              <button
                onClick={handleExportAll}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
              >
                📊 Toutes les candidatures
              </button>
              
              <div className="border-t border-gray-200 my-2" />
              
              <p className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                Par statut
              </p>
              
              
              
              <button
                onClick={() => handleExportByStatus('Preselected')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
              >
                🔵 Présélectionnés
              </button>
              
              <button
                onClick={() => handleExportByStatus('Selected')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
              >
                🟢 Sélectionnés
              </button>
              
              <button
                onClick={() => handleExportByStatus('Rejected')}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
              >
                🔴 Rejetés
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ExportMenu