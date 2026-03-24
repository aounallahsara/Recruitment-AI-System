import ExcelJS from 'exceljs'

/**
 * Exporter les candidatures en fichier Excel
 * @param {Array} candidates - Liste des candidatures
 * @param {string} filename - Nom du fichier (optionnel)
 */
export const exportToExcel = async (candidates, filename) => {
  // Nom du fichier avec date
  const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')
  const defaultFilename = `candidatures_${date}.xlsx`
  const finalFilename = filename || defaultFilename

  // Préparer les données pour Excel
  const excelData = candidates.map((candidate, index) => ({
    'N°': index + 1,
    'Statut': candidate.statut || 'N/A',
    'Prénom': candidate.prenom || '',
    'Nom': candidate.nom || '',
    'Email': candidate.email || '',
    'Téléphone': candidate.telephone || '',
    'Date de naissance': candidate.date_naissance || '',
    'Wilaya': candidate.wilaya || '',
    'Genre': candidate.genre || '',
    'Adresse': candidate.adresse || '',
    'Université': candidate.universite || '',
    'Domaine': candidate.domaine || '',
    'Niveau': candidate.niveau || '',
    'Moyenne': candidate.moyenne || '',
    'Thème du stage': candidate.theme || '',
    'Durée': candidate.duree || '',
    'Date début': candidate.date_debut || '',
    'Date fin': candidate.date_fin || '',
    'Encadrant': candidate.encadrant || 'N/A',
    'Date de soumission': candidate.date_soumission 
      ? new Date(candidate.date_soumission).toLocaleDateString('fr-FR')
      : ''
  }))

  // Créer le classeur et la feuille
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Candidatures')

  // Définir les colonnes et leurs largeurs (équivalent de wch)
  worksheet.columns = [
    { header: 'N°', key: 'N°', width: 5 },
    { header: 'Statut', key: 'Statut', width: 15 },
    { header: 'Prénom', key: 'Prénom', width: 15 },
    { header: 'Nom', key: 'Nom', width: 15 },
    { header: 'Email', key: 'Email', width: 25 },
    { header: 'Téléphone', key: 'Téléphone', width: 15 },
    { header: 'Date de naissance', key: 'Date de naissance', width: 15 },
    { header: 'Wilaya', key: 'Wilaya', width: 20 },
    { header: 'Genre', key: 'Genre', width: 10 },
    { header: 'Adresse', key: 'Adresse', width: 40 },
    { header: 'Université', key: 'Université', width: 30 },
    { header: 'Domaine', key: 'Domaine', width: 20 },
    { header: 'Niveau', key: 'Niveau', width: 15 },
    { header: 'Moyenne', key: 'Moyenne', width: 10 },
    { header: 'Thème du stage', key: 'Thème du stage', width: 40 },
    { header: 'Durée', key: 'Durée', width: 10 },
    { header: 'Date début', key: 'Date début', width: 12 },
    { header: 'Date fin', key: 'Date fin', width: 12 },
    { header: 'Encadrant', key: 'Encadrant', width: 20 },
    { header: 'Date de soumission', key: 'Date de soumission', width: 15 }
  ]

  // Ajouter les données
  worksheet.addRows(excelData)

  // Générer le fichier et déclencher le téléchargement
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = finalFilename
  anchor.click()
  window.URL.revokeObjectURL(url)
}

/**
 * Exporter uniquement les candidatures sélectionnées
 * @param {Array} candidates - Liste des candidatures à exporter
 * @param {Array} selectedIds - IDs des candidatures sélectionnées
 * @param {string} filename - Nom du fichier
 */
export const exportSelectedToExcel = async (candidates, selectedIds, filename) => {
  const selectedCandidates = candidates.filter(c => selectedIds.includes(c.id))
  await exportToExcel(selectedCandidates, filename)
}

/**
 * Exporter les candidatures par statut
 * @param {Array} candidates - Liste de toutes les candidatures
 * @param {string} statut - 
 * @param {string} filename - Nom du fichier
 */
export const exportByStatus = async (candidates, statut, filename) => {
  const filteredCandidates = candidates.filter(c => c.statut === statut)
  const date = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')
  const defaultFilename = `candidatures_${statut}_${date}.xlsx`
  
  await exportToExcel(filteredCandidates, filename || defaultFilename)
}