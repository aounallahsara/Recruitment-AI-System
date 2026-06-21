import api from './api'

/**
 * Analyse une lettre de motivation (texte)
 * @param {string} contenuLettre - Le contenu de la lettre à analyser
 * @returns {Promise} Résultat de l'analyse
 */
export async function analyserLettre(contenuLettre) {
  try {
    const response = await api.post('/ai_analysis/analyse-lettre/', {
      text: contenuLettre,
    })
    return response.data
  } catch (error) {
    console.error('Erreur lors de l\'analyse de la lettre:', error)
    throw error
  }
}

/**
 * Analyse une lettre de motivation (PDF)
 * @param {File} fichierPdf - Le fichier PDF à analyser
 * @returns {Promise} Résultat de l'analyse
 */
export async function analyserLettrePdf(fichierPdf) {
  try {
    const formData = new FormData()
    formData.append('fichier', fichierPdf)

    const response = await api.post('/ai_analysis/analyse-lettre-pdf/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    console.error('Erreur lors de l\'analyse du PDF:', error)
    throw error
  }
}

/**
 * Analyse un CV
 * @param {File} fichierCv - Le fichier CV à analyser
 * @returns {Promise} Résultat de l'analyse
 */
export async function analyserCV(fichierCv, useBert = false) {
  try {
    const formData = new FormData()
    formData.append('fichier', fichierCv)
    // send use_bert flag so backend can run the heavier BERT-based extractor
    if (useBert) formData.append('use_bert', 'true')

    const response = await api.post('/ai_analysis/analyse-cv/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    console.error('Erreur lors de l\'analyse du CV:', error)
    throw error
  }
}
