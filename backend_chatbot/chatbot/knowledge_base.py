class KnowledgeBase:
    """Base de connaissances sur les stages."""
    
    KNOWLEDGE = """
=== CANDIDATURES DE STAGES ===

 DOCUMENTS REQUIS (2 OBLIGATOIRES)
Pour candidater, vous devez fournir  3 documents au format PDF :
1. CV (Curriculum Vitae)
2. Lettre de motivation
3. Relevé de notes (optionnel mais recommandé)


 DURÉE DES STAGES
- Minimum : 1 mois
- Maximum : 6 mois
- Options : 1, 2, 3, 4, 5 ou 6 mois

 PROCESSUS DE CANDIDATURE
1. Remplir le formulaire en ligne
2. Télécharger les 3 documents PDF
3. Soumettre la candidature
4. Attendre la réponse (sous 2 semaines)

 CRITÈRES DE SÉLECTION
- Moyenne recommandée : 12/20 (pas obligatoire)
- Cohérence domaine d'études / thème de stage
- Qualité de la lettre de motivation
- Disponibilité du Service d'accueil

 STATUTS DE CANDIDATURE
-
- Preselected : Entretien prévu
- Selected : Stage accepté
- Rejected : Non retenu

 CONTACT
Email : recrutementhas.noreply@gmail.com
Téléphone : +213 560 74 75 86

Q: Quels niveaux d'études sont acceptés ?
R: Nous acceptons les niveaux suivants :
   Licence 1, 2, 3 — Master 1, 2 — Doctorat
   Ingénieur 1, 2, 3, 4, 5

Q: Comment puis-je connaître le statut de ma candidature ?
R: Vous serez notifié par email dès que votre statut change.
   Pour toute question, contactez-nous à :
   recrutementhas.noreply@gmail.com   

Q: Puis-je postuler depuis n'importe quelle wilaya ?
R: Oui ! Les candidatures sont ouvertes pour toutes
   les 58 wilayas d'Algérie.


Q: Puis-je choisir mon encadrant de stage ?
R: Vous pouvez indiquer un encadrant souhaité dans le
   formulaire, mais ce choix reste à la discrétion de
   l'équipe interne.


"""
    
    @classmethod
    def search(cls, question):
        """Retourne le contexte pertinent."""
        return cls.KNOWLEDGE