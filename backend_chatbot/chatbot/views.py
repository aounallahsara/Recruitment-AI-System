from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .gemini_service import GeminiService
from .knowledge_base import KnowledgeBase
import traceback

@api_view(['POST'])
def chatbot_ask(request):
    """
    Endpoint pour le chatbot.
    POST /api/chatbot/ask/
    Body: {"question": "..."}
    """
    try:
        # Récupérer la question
        question = request.data.get('question', '').strip()
        
        if not question:
            return Response(
                {"error": "Question vide", "success": False},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Limiter la longueur
        if len(question) > 500:
            return Response(
                {"error": "Question trop longue", "success": False},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        print(f"Question reçue : {question}")  # Debug
        
        # Rechercher le contexte
        context = KnowledgeBase.search(question)
        print(f"Contexte trouvé : {len(context)} caractères")  # Debug
        
        # Générer la réponse
        gemini = GeminiService()
        answer = gemini.generate_response(question, context)
        print(f"Réponse générée : {answer[:100]}...")  # Debug
        
        return Response({
            "answer": answer,
            "success": True
        }, status=status.HTTP_200_OK)
    
    except ValueError as e:
        # Erreur de clé API
        print(f"Erreur ValueError: {str(e)}")
        return Response(
            {"error": f"Configuration: {str(e)}", "success": False},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    except Exception as e:
        # Autre erreur
        print(f"Erreur inattendue: {str(e)}")
        print(traceback.format_exc())  # Stack trace complète
        return Response(
            {"error": f"Erreur serveur: {str(e)}", "success": False},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )