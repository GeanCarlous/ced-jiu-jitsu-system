import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStudent, getAttendanceHistory } from '../lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Award, 
  Calendar, 
  TrendingUp, 
  LogOut,
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  Settings
} from 'lucide-react';
import Profile from './Profile';

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGraduationAlert, setShowGraduationAlert] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' ou 'profile'

  useEffect(() => {
    loadStudentData();
  }, [user]);

  const loadStudentData = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const [studentResponse, historyResponse] = await Promise.all([
        getStudent(user.uid),
        getAttendanceHistory(user.uid, 10)
      ]);

      if (studentResponse.data.success) {
        const student = studentResponse.data.student;
        setStudentData(student);
        
        // Verificar se o aluno completou as presenças para graduação
        if (student.presences_for_next_degree === 0) {
          setShowGraduationAlert(true);
        }
      }

      if (historyResponse.data.success) {
        setAttendanceHistory(historyResponse.data.history);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do aluno:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBeltColor = (belt) => {
    const colors = {
      'branca': 'bg-gray-100 text-gray-800 border-gray-300',
      'cinza': 'bg-gray-300 text-gray-800 border-gray-400',
      'amarela': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'laranja': 'bg-orange-100 text-orange-800 border-orange-300',
      'verde': 'bg-green-100 text-green-800 border-green-300',
      'azul': 'bg-blue-100 text-blue-800 border-blue-300',
      'roxa': 'bg-purple-100 text-purple-800 border-purple-300',
      'marrom': 'bg-amber-100 text-amber-800 border-amber-300',
      'preta': 'bg-gray-800 text-white border-gray-700'
    };
    return colors[belt] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getNextBelt = (currentBelt, age) => {
    if (age <= 6) {
      return 'cinza/branca';
    } else if (age <= 13) {
      if (currentBelt === 'branca') return 'cinza';
      if (currentBelt === 'cinza') return 'amarela';
      if (currentBelt === 'amarela') return 'laranja';
      if (currentBelt === 'laranja') return 'verde';
      return 'azul';
    } else {
      if (currentBelt === 'branca' || currentBelt === 'cinza' || currentBelt === 'amarela' || currentBelt === 'laranja' || currentBelt === 'verde') {
        return 'azul';
      }
      if (currentBelt === 'azul') return 'roxa';
      if (currentBelt === 'roxa') return 'marrom';
      if (currentBelt === 'marrom') return 'preta';
      return 'preta';
    }
  };

  const calculateProgress = () => {
    if (!studentData) return 0;
    
    let totalNeeded = 0;
    
    if (studentData.age <= 6) {
      if (studentData.degrees === 0) totalNeeded = 10;
      else if (studentData.degrees === 1) totalNeeded = 15;
      else if (studentData.degrees === 2) totalNeeded = 15;
      else if (studentData.degrees === 3) totalNeeded = 20;
    } else if (studentData.age <= 13) {
      totalNeeded = (studentData.degrees + 1) * 25;
    } else {
      if (studentData.belt === 'branca') totalNeeded = 50;
      else if (['cinza', 'amarela', 'laranja', 'verde'].includes(studentData.belt)) totalNeeded = 35;
      else totalNeeded = (studentData.degrees + 1) * 50;
    }

    const currentProgress = totalNeeded - studentData.presences_for_next_degree;
    return Math.min((currentProgress / totalNeeded) * 100, 100);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Renderizar perfil se selecionado
  if (currentView === 'profile') {
    return <Profile onBack={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CED Jiu-Jitsu</h1>
                <p className="text-sm text-gray-600">Meu Progresso</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-600">Aluno</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentView('profile')}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Perfil</span>
              </Button>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerta de Graduação */}
        {showGraduationAlert && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <Trophy className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              <strong>Parabéns!</strong> Você completou as presenças necessárias para o próximo grau! 
              Sua nova faixa é: <strong>{getNextBelt(studentData?.belt, studentData?.age)}</strong>
            </AlertDescription>
          </Alert>
        )}

        {/* Card Principal do Perfil */}
        <Card className="mb-8 bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{studentData?.name}</h2>
                  <p className="text-orange-100 mb-2">{studentData?.age} anos</p>
                  <Badge className={`${getBeltColor(studentData?.belt)} text-sm`}>
                    Faixa {studentData?.belt} - {studentData?.degrees} grau(s)
                  </Badge>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-bold">{studentData?.total_presences}</div>
                <p className="text-orange-100">Total de Presenças</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximo Grau</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {studentData?.presences_for_next_degree || 0}
              </div>
              <p className="text-xs text-muted-foreground">presenças restantes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(calculateProgress())}%</div>
              <Progress value={calculateProgress()} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próxima Faixa</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold capitalize">
                {getNextBelt(studentData?.belt, studentData?.age)}
              </div>
              <p className="text-xs text-muted-foreground">objetivo atual</p>
            </CardContent>
          </Card>
        </div>

        {/* Progresso Detalhado */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>Progresso para o Próximo Grau</span>
            </CardTitle>
            <CardDescription>
              Acompanhe seu progresso rumo à próxima graduação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progresso Atual</span>
                <span className="text-sm text-gray-600">
                  {Math.round(calculateProgress())}% completo
                </span>
              </div>
              
              <Progress value={calculateProgress()} className="h-3" />
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>Faixa {studentData?.belt} - {studentData?.degrees} grau(s)</span>
                <span>
                  {studentData?.presences_for_next_degree === 0 
                    ? 'Pronto para graduação!' 
                    : `${studentData?.presences_for_next_degree} presenças restantes`
                  }
                </span>
              </div>

              {studentData?.presences_for_next_degree === 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Parabéns! Você está pronto para receber sua nova graduação!
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Presenças */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Últimas Presenças</span>
            </CardTitle>
            <CardDescription>
              Suas 10 presenças mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceHistory.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma presença registrada ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendanceHistory.map((date, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Aula de Jiu-Jitsu</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatDate(date)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;

