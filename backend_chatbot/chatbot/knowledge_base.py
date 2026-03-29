class KnowledgeBase:
    """Base de connaissances sur les stages."""
    
    KNOWLEDGE = """
=== CANDIDATURES DE STAGES ===

📄 DOCUMENTS REQUIS (OBLIGATOIRES)
Pour candidater, vous devez fournir 3 documents au format PDF :
1. CV (Curriculum Vitae)
2. Lettre de motivation
3. Relevé de notes
Sans ces 3 documents, votre candidature ne sera pas traitée.

⏱️ DURÉE DES STAGES
- Minimum : 1 mois
- Maximum : 6 mois
- Options : 1, 2, 3, 4, 5 ou 6 mois

📝 PROCESSUS DE CANDIDATURE
1. Remplir le formulaire en ligne
2. Télécharger les 3 documents PDF
3. Soumettre la candidature
4. Attendre la réponse (sous 2 semaines)

✅ CRITÈRES DE SÉLECTION
- Moyenne recommandée : 12/20 (pas obligatoire)
- Cohérence domaine d'études / thème de stage
- Qualité de la lettre de motivation
- Disponibilité

📊 STATUTS DE CANDIDATURE
- Pending : En cours d'examen
- Preselected : Entretien prévu
- Selected : Stage accepté
- Rejected : Non retenu

📞 CONTACT
Email : stages@entreprise.dz
Téléphone : +213 XX XX XX XX
"""
    
    @classmethod
    def search(cls, question):
        """Retourne le contexte pertinent."""
        return cls.KNOWLEDGE