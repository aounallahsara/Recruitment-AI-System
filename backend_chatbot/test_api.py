import requests
import json

url = "http://127.0.0.1:8000/api/chatbot/ask/"
data = {"question": "Quels documents dois-je fournir ?"}

response = requests.post(url, json=data)
print(json.dumps(response.json(), indent=2, ensure_ascii=False))