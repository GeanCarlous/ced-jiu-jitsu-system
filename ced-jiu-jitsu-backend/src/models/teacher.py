from typing import Dict, Optional
from config.firebase_config import get_db

class Teacher:
    """
    Modelo para representar um professor de jiu-jitsu
    """
    
    def __init__(self, uid: str, name: str, email: str):
        self.uid = uid
        self.name = name
        self.email = email
    
    def to_dict(self) -> Dict:
        """
        Converte o objeto Teacher para um dicionário
        """
        return {
            'uid': self.uid,
            'name': self.name,
            'email': self.email
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Teacher':
        """
        Cria um objeto Teacher a partir de um dicionário
        """
        return cls(
            uid=data.get('uid', ''),
            name=data.get('name', ''),
            email=data.get('email', '')
        )
    
        # CÓDIGO CORRIGIDO PARA USAR A COLEÇÃO 'teachers'
    def save(self) -> bool:
        """
        Salva o professor no Firestore
        """
        try:
            db = get_db()
            # ALTERAÇÃO: Salvar na coleção 'teachers'
            teacher_ref = db.collection('teachers').document(self.uid)
            # O método self.to_dict() já formata os dados corretamente
            teacher_ref.set(self.to_dict(), merge=True)
            return True
        except Exception as e:
            print(f"Erro ao salvar professor: {e}")
            return False
        
        # CÓDIGO CORRIGIDO PARA USAR A COLEÇÃO 'teachers'
    @classmethod
     def get_by_uid(cls, uid: str) -> Optional['Teacher']:
        try:
            db = get_db()
            # ALTERAÇÃO: Procurar na coleção 'teachers' em vez de 'users'
            teacher_ref = db.collection('teachers').document(uid)
            doc = teacher_ref.get()

            if doc.exists:
                # Não precisamos mais verificar o 'role' aqui
                return cls.from_dict(doc.to_dict())
            return None
        except Exception as e:
            print(f"Erro ao buscar professor: {e}")
            return None

