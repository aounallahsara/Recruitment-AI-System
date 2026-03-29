import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class GeminiService:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY non trouvée dans le fichier .env")
        
        genai.configure(api_key=api_key)
        # On utilise 2.0-flash (2.5 n'existe pas encore ou est en preview)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def generate_response(self, question, context):
        prompt = f"""Tu es un assistant virtuel pour une plateforme de candidatures de stages.
CONTEXTE : {context}
RÈGLES :
- Réponds UNIQUEMENT en français
- Maximum 3-4 phrases
QUESTION : {question}"""

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Erreur Gemini: {str(e)}")
            return "Désolé, j'ai un problème technique."