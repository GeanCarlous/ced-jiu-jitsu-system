# Este é o conteúdo COMPLETO para o arquivo:
# src/config/firebase_config.py

import firebase_admin
from firebase_admin import credentials, firestore
import os
import json

db = None # Variável global para a conexão com o banco de dados

def initialize_firebase():
    """Inicializa o SDK do Firebase e a conexão com o Firestore."""
    global db
    # Evita inicializar múltiplas vezes
    if not firebase_admin._apps:
        print("Inicializando Firebase Admin SDK...")
        try:
            # Pega as credenciais da variável de ambiente ÚNICA
            creds_json_str = os.getenv('FIREBASE_CREDENTIALS')

            if not creds_json_str:
                raise ValueError("A variável de ambiente FIREBASE_CREDENTIALS não foi definida ou está vazia.")

            creds_dict = json.loads(creds_json_str)

            cred = credentials.Certificate(creds_dict)
            firebase_admin.initialize_app(cred)
            db = firestore.client() # Armazena a conexão na variável global
            print("Firebase Admin SDK inicializado com sucesso.")
        except Exception as e:
            print(f"ERRO CRÍTICO ao inicializar Firebase: {e}")
            # Força a aplicação a parar se não conseguir conectar ao DB
            raise e 

def get_db():
    """Retorna a instância do Firestore, garantindo que foi inicializada."""
    if db is None:
        # Isso não deveria acontecer se a ordem de chamada estiver correta,
        # mas é uma salvaguarda.
        initialize_firebase()
    return db