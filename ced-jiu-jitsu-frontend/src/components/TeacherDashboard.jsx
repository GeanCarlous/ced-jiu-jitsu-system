import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllStudents,
  getStudentsCloseToGraduation,
  createStudent,
  markAttendance,
  updateStudent,
  addExtraActivity,
  removeExtraActivity
} from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  UserPlus,
  CheckCircle,
  Award,
  LogOut,
  Calendar,
  TrendingUp,
  AlertCircle,
  Edit,
  Loader2,
  Plus,
  Minus,
  Star
} from 'lucide-react';
import EditStudentModal from './EditStudentModal';

const TeacherDashboard = () => {
  const { user, signOut } = useAuth();
  const [students, setStudents] = useState([]);
  const [studentsCloseToGraduation, setStudentsCloseToGraduation] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);

  // Estados para cadastro de novo aluno
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    belt: '',
    age: '',
    address: '',
    education: '',
    degrees: 0,
    start_date: '',
    extra_activities: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsResponse, graduationResponse] = await Promise.all([
        getAllStudents(),
        getStudentsCloseToGraduation()
      ]);

      if (studentsResponse.data.success) {
        setStudents(studentsResponse.data.students);
      }

      if (graduationResponse.data.success) {
        setStudentsCloseToGraduation(graduationResponse.data.students);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar dados' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await createStudent(newStudent);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Aluno cadastrado com sucesso!' });
        setNewStudent({
          name: '',
          email: '',
          belt: '',
          age: '',
          address: '',
          education: '',
          degrees: 0,
          start_date: '',
          extra_activities: 0
        });
        loadData();
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Erro ao cadastrar aluno.' });
      }
    } catch (error) {
      console.error('Erro ao cadastrar aluno:', error);
      setMessage({ type: 'error', text: 'Erro ao cadastrar aluno' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (selectedStudents.length === 0) {
      setMessage({ type: 'error', text: 'Selecione pelo menos um aluno' });
      return;
    }

    setLoading(true);
    try {
      const response = await markAttendance({
        student_uids: selectedStudents,
        date: new Date().toISOString()
      });

      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: `Presença marcada para ${response.data.updated_students.length} aluno(s)` 
        });
        setSelectedStudents([]);
        loadData();
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Erro ao marcar presença.' });
      }
    } catch (error) {
      console.error('Erro ao marcar presença:', error);
      setMessage({ type: 'error', text: 'Erro ao marcar presença' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddExtraActivity = async (studentUid) => {
    try {
      const response = await addExtraActivity(studentUid);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Atividade extra adicionada!' });
        loadData();
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Erro ao adicionar atividade extra.' });
      }
    } catch (error) {
      console.error('Erro ao adicionar atividade extra:', error);
      setMessage({ type: 'error', text: 'Erro ao adicionar atividade extra' });
    }
  };

  const handleRemoveExtraActivity = async (studentUid) => {
    try {
      const response = await removeExtraActivity(studentUid);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Atividade extra removida!' });
        loadData();
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Erro ao remover atividade extra.' });
      }
    } catch (error) {
      console.error('Erro ao remover atividade extra:', error);
      setMessage({ type: 'error', text: 'Erro ao remover atividade extra' });
    }
  };

  const toggleStudentSelection = (studentUid) => {
    setSelectedStudents(prev => 
      prev.includes(studentUid) 
        ? prev.filter(uid => uid !== studentUid)
        : [...prev, studentUid]
    );
  };

  const getBeltColor = (belt) => {
    const colors = {
      'branca': 'bg-gray-100 text-gray-800',
      'cinza': 'bg-gray-300 text-gray-800',
      'amarela': 'bg-yellow-100 text-yellow-800',
      'laranja': 'bg-orange-100 text-orange-800',
      'verde': 'bg-green-100 text-green-800',
      'azul': 'bg-blue-100 text-blue-800',
      'roxa': 'bg-purple-100 text-purple-800',
      'marrom': 'bg-amber-100 text-amber-800',
      'preta': 'bg-gray-800 text-white'
    };
    return colors[belt] || 'bg-gray-100 text-gray-800';
  };

  const handleEditStudent = (student) => {
    setStudentToEdit(student);
    setIsEditModalOpen(true);
  };

  const handleSaveStudentSuccess = () => {
    loadData(); // Recarrega os dados após salvar
  };

  const getProgressPercentage = (student) => {
    if (!student.presences_for_next_degree) return 100;
    
    const requirements = {
      'branca': student.extra_activities > student.degrees ? 45 : 50,
      'azul': student.extra_activities > student.degrees ? 85 : 90,
      'roxa': student.extra_activities > student.degrees ? 65 : 70,
      'marrom': student.extra_activities > student.degrees ? 70 : 80,
      'preta': 0
    };
    
    const required = requirements[student.belt] || 50;
    const current = required - student.presences_for_next_degree;
    return Math.min((current / required) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CED Jiu-Jitsu</h1>
                <p className="text-sm text-gray-600">Dashboard do Professor</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600">Professor</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mensagens */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximos da Graduação</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{studentsCloseToGraduation.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aula de Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedStudents.length}</div>
              <p className="text-xs text-muted-foreground">alunos selecionados</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principais */}
        <Tabs defaultValue="attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="attendance">Presença</TabsTrigger>
            <TabsTrigger value="students">Alunos</TabsTrigger>
            <TabsTrigger value="graduation">Graduação</TabsTrigger>
            <TabsTrigger value="register">Cadastrar</TabsTrigger>
          </TabsList>

          {/* Aba de Presença */}
          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>Marcar Presença</span>
                </CardTitle>
                <CardDescription>
                  Selecione os alunos presentes na aula de hoje
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student) => (
                      <div
                        key={student.uid}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedStudents.includes(student.uid)
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleStudentSelection(student.uid)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getBeltColor(student.belt)}>
                                {student.belt}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {student.total_presences} presenças
                              </span>
                              {student.extra_activities > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  {student.extra_activities}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {selectedStudents.includes(student.uid) && (
                            <CheckCircle className="w-5 h-5 text-orange-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedStudents.length > 0 && (
                    <div className="flex justify-between items-center pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        {selectedStudents.length} aluno(s) selecionado(s)
                      </p>
                      <Button 
                        onClick={handleMarkAttendance}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirmar Presença
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Alunos */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Alunos</CardTitle>
                <CardDescription>
                  Todos os alunos cadastrados no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student.uid} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium text-gray-900">{student.name}</p>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getBeltColor(student.belt)}>
                              {student.belt} - {student.degrees} grau(s)
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {student.total_presences} presenças
                            </span>
                            {student.extra_activities > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Star className="w-3 h-3 mr-1" />
                                {student.extra_activities} atividades
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Botões de atividade extra */}
                        {student.belt !== 'preta' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleRemoveExtraActivity(student.uid)}
                              disabled={student.extra_activities <= 0}
                              title="Remover atividade extra"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-sm font-medium min-w-[20px] text-center">
                              {student.extra_activities}
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleAddExtraActivity(student.uid)}
                              title="Adicionar atividade extra"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditStudent(student)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Graduação */}
          <TabsContent value="graduation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Alunos Próximos da Graduação</span>
                </CardTitle>
                <CardDescription>
                  Alunos que estão a 10 presenças ou menos do próximo grau
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentsCloseToGraduation.length === 0 ? (
                    <p className="text-center text-gray-600 py-8">
                      Nenhum aluno próximo da graduação no momento
                    </p>
                  ) : (
                    studentsCloseToGraduation.map((student) => (
                      <div key={student.uid} className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 border-orange-200">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getBeltColor(student.belt)}>
                                {student.belt} - {student.degrees} grau(s)
                              </Badge>
                              {student.extra_activities > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  {student.extra_activities} atividades
                                </Badge>
                              )}
                            </div>
                            <div className="mt-2 w-48">
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Progresso</span>
                                <span>{Math.round(getProgressPercentage(student))}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${getProgressPercentage(student)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">
                            {student.presences_for_next_degree}
                          </p>
                          <p className="text-xs text-gray-600">presenças restantes</p>
                          {student.belt !== 'preta' && student.extra_activities <= student.degrees && (
                            <p className="text-xs text-green-600 mt-1">
                              Ou fazer atividade extra
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba de Cadastro */}
          <TabsContent value="register" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5" />
                  <span>Cadastrar Novo Aluno</span>
                </CardTitle>
                <CardDescription>
                  Adicione um novo aluno ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStudent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="belt">Faixa</Label>
                      <Select
                        value={newStudent.belt}
                        onValueChange={(value) => setNewStudent({...newStudent, belt: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a faixa" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="branca">Branca</SelectItem>
                          <SelectItem value="cinza">Cinza</SelectItem>
                          <SelectItem value="amarela">Amarela</SelectItem>
                          <SelectItem value="laranja">Laranja</SelectItem>
                          <SelectItem value="verde">Verde</SelectItem>
                          <SelectItem value="azul">Azul</SelectItem>
                          <SelectItem value="roxa">Roxa</SelectItem>
                          <SelectItem value="marrom">Marrom</SelectItem>
                          <SelectItem value="preta">Preta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Idade</Label>
                      <Input
                        id="age"
                        type="number"
                        value={newStudent.age}
                        onChange={(e) => setNewStudent({...newStudent, age: parseInt(e.target.value) || ''})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="degrees">Graus</Label>
                      <Input
                        id="degrees"
                        type="number"
                        value={newStudent.degrees}
                        onChange={(e) => setNewStudent({...newStudent, degrees: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="extra_activities">Atividades Extras</Label>
                      <Input
                        id="extra_activities"
                        type="number"
                        value={newStudent.extra_activities}
                        onChange={(e) => setNewStudent({...newStudent, extra_activities: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Data de Início</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={newStudent.start_date}
                        onChange={(e) => setNewStudent({...newStudent, start_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={newStudent.address}
                      onChange={(e) => setNewStudent({...newStudent, address: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="education">Escolaridade</Label>
                    <Input
                      id="education"
                      value={newStudent.education}
                      onChange={(e) => setNewStudent({...newStudent, education: e.target.value})}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cadastrando...</>
                    ) : (
                      'Cadastrar Aluno'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {studentToEdit && (
        <EditStudentModal 
          student={studentToEdit} 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          onSaveSuccess={handleSaveStudentSuccess}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;

