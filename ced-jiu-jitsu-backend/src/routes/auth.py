from middleware.auth import require_auth, require_teacher
from flask import Blueprint, request, jsonify
from firebase_admin import auth
from models.student import Student
from models.teacher import Teacher

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/verify-token', methods=['POST'])
@require_auth # <--- O middleware faz todo o trabalho de verificação aqui!
def verify_token():
    """
    Verifica o token e retorna os dados do usuário já validados pelo middleware
    """
    # Se o código chegou até aqui, o usuário é válido.
    # Agora só precisamos retornar os dados que o middleware preparou em request.current_user
    return jsonify({
        'success': True,
        'user': request.current_user
    }), 200

@auth_bp.route('/register-student', methods=['POST'])
@require_auth
@require_teacher
def register_student():
    """
    Permite que um professor cadastre um novo estudante no sistema
    """
    try:
        data = request.get_json()

        # CORREÇÃO: Adicionar 'uid' aos campos obrigatórios
        required_fields = ['uid', 'name', 'email', 'belt', 'age']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo obrigatório: {field}'}), 400

        # REMOVER a geração de UUID aleatório
        # import uuid
        # uid = str(uuid.uuid4())

        # Criar novo estudante com o UID recebido do Firebase Auth
        student = Student(
            uid=data['uid'], # <--- USAR O UID QUE VEIO DO FRONT-END
            name=data['name'],
            email=data['email'],
            belt=data['belt'],
            age=int(data['age']),
            address=data.get('address', ''),
            education=data.get('education', ''),
            degrees=int(data.get('degrees', 0))
        )

        
        # Salvar no Firestore
        if student.save():
            return jsonify({
                'success': True,
                'message': 'Estudante registrado com sucesso',
                'student': student.to_dict()
            }), 201
        else:
            return jsonify({'error': 'Erro ao salvar estudante'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@auth_bp.route('/register-teacher', methods=['POST'])
@require_auth     # <--- ADICIONE (no mínimo)
@require_teacher  # <--- ADICIONE (idealmente, para que só professores possam cadastrar outros)

def register_teacher():
    """
    Registra um novo professor no sistema
    """
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['uid', 'name', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Campo obrigatório: {field}'}), 400
        
        # Criar novo professor
        teacher = Teacher(
            uid=data['uid'],
            name=data['name'],
            email=data['email']
        )
        
        # Salvar no Firestore
        if teacher.save():
            return jsonify({
                'success': True,
                'message': 'Professor registrado com sucesso',
                'teacher': teacher.to_dict()
            }), 201
        else:
            return jsonify({'error': 'Erro ao salvar professor'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

