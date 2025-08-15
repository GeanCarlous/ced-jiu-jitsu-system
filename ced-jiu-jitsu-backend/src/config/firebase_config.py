# Em src/config/firebase_config.py

import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

def initialize_firebase():
    # Verifica se o app já foi inicializado para evitar erros
    if not firebase_admin._apps:
        print("Inicializando Firebase Admin SDK...")
        try:
            # Pega as credenciais da variável de ambiente
            creds_json_str = os.getenv('FIREBASE_CREDENTIALS')

            if not creds_json_str:
                raise ValueError("A variável de ambiente FIREBASE_CREDENTIALS não foi definida.")

            creds_dict = json.loads(creds_json_str)

            cred = credentials.Certificate(creds_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK inicializado com sucesso.")
        except Exception as e:
            print(f"ERRO CRÍTICO ao inicializar Firebase: {e}")
            # Em um app real, você poderia querer que o app falhasse ao iniciar aqui
            # raise e 

# Uma função para obter a instância do banco de dados (opcional, mas boa prática)
def get_db():
    # Garante que o app está inicializado antes de pegar o db
    if not firebase_admin._apps:
        initialize_firebase()
    return firestore.client()