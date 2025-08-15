from functools import wraps
from flask import request, jsonify
from firebase_admin import auth
from models.student import Student
from models.teacher import Teacher

def require_auth(f):
    """
    Decorator que requer autenticação válida
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token não fornecido'}), 401
        
        token = auth_header.split(" ").pop()
        try:
            decoded_token = auth.verify_id_token(token)
            uid = decoded_token['uid']
            
            # 1. Tenta encontrar como Aluno primeiro
            student = Student.get_by_uid(uid)
            if student:
                user_data = student.to_dict()
                user_data['role'] = 'aluno'
                request.current_user = user_data
                return f(*args, **kwargs)

            # 2. Se não for aluno, tenta encontrar como Professor
            teacher = Teacher.get_by_uid(uid)
            if teacher:
                user_data = teacher.to_dict()
                user_data['role'] = 'professor'
                request.current_user = user_data
                return f(*args, **kwargs)

            # 3. Se não encontrou em nenhuma coleção, o usuário não existe no sistema
            return jsonify({'error': 'Usuário não encontrado no sistema'}), 404

        except Exception as e:
            return jsonify({'error': 'Token inválido ou expirado', 'details': str(e)}), 401
            
    return decorated_function

# CÓDIGO CORRIGIDO
def require_teacher(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # CORREÇÃO: Usar 'current_user' em vez de 'user'
        user = getattr(request, 'current_user', None) 
        if not user or user.get('role') != 'professor':
            return jsonify({'error': 'Acesso restrito a professores'}), 403
        return f(*args, **kwargs)
    return decorated_function

def require_student(f):
    """
    Decorator que requer que o usuário seja um aluno
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(request, 'current_user') or request.current_user['role'] != 'aluno':
            return jsonify({'error': 'Acesso restrito a alunos'}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function