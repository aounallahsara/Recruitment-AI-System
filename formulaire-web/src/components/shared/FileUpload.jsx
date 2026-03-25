import { useState } from 'react'

function FileUpload({ label, accept, onChange, required = false }) {
  // État local pour stocker le nom du fichier sélectionné
  const [fileName, setFileName] = useState('')

  // Fonction appelée quand l'utilisateur sélectionne un fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0]  // Récupère le premier fichier
    
    if (file) {
      setFileName(file.name)  // Met à jour le nom affiché
      onChange(file)          // Envoie le fichier au composant parent
    }
  }

  return (
    <div className="mb-4">
      {/* Label du champ */}
      <label className="block text-gray-700 font-semibold mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {/* Zone de dépôt de fichier */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition cursor-pointer">
        {/* Input file caché */}
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id={`file-${label}`}
          required={required}
        />
        
        {/* Label cliquable pour ouvrir l'explorateur de fichiers */}
        <label
          htmlFor={`file-${label}`}
          className="cursor-pointer text-blue-600 hover:text-blue-800 block"
        >
          {fileName || 'Cliquez pour sélectionner un fichier'}
        </label>
        
        {/* Indication du format accepté */}
        <p className="text-xs text-gray-500 mt-2">
          Formats acceptés : {accept}
        </p>
      </div>
    </div>
  )
}

export default FileUpload