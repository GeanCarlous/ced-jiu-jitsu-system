import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  User,
  Mail,
  Lock,
  Camera,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import {
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../lib/firebase';
import { updateStudent, updateProfile as updateUserProfile } from '../lib/api';
import { toast } from 'sonner';

const Profile = ({ onBack }) => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fileInputRef = useRef(null);

  // Estados para formulários
  const [emailForm, setEmailForm] = useState({
    newEmail: user?.email || '',
    currentPassword: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    photoURL: user?.photoURL || ''
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState({});

  // Função para upload de foto
  const handlePhotoUpload = async (file) => {
    if (!file) return null;

    try {
      setLoading(true);
      const storageRef = ref(storage, `profile-photos/${user.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar foto de perfil
  const handleUpdatePhoto = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setErrors({ photo: 'Por favor, selecione apenas arquivos de imagem.' });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ photo: 'A imagem deve ter no máximo 5MB.' });
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      const photoURL = await handlePhotoUpload(file);
      
      // Atualizar perfil no Firebase Auth
      await updateProfile(auth.currentUser, { photoURL });
      
      // Atualizar no backend
      await updateUserProfile({ photoURL });
      
      setProfileForm(prev => ({ ...prev, photoURL }));
      setSuccess({ photo: 'Foto de perfil atualizada com sucesso!' });
      toast.success('Foto de perfil atualizada!');
      
    } catch (error) {
      console.error('Erro ao atualizar foto:', error);
      setErrors({ photo: 'Erro ao atualizar foto de perfil.' });
      toast.error('Erro ao atualizar foto de perfil.');
    } finally {
      setLoading(false);
    }
  };

  // Função para reautenticar usuário
  const reauthenticate = async (password) => {
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(auth.currentUser, credential);
  };

  // Função para atualizar email
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess({});

    try {
      // Validações
      if (!emailForm.newEmail) {
        setErrors({ email: 'Email é obrigatório.' });
        return;
      }

      if (!emailForm.currentPassword) {
        setErrors({ email: 'Senha atual é obrigatória para alterar o email.' });
        return;
      }

      if (emailForm.newEmail === user.email) {
        setErrors({ email: 'O novo email deve ser diferente do atual.' });
        return;
      }

      // Reautenticar
      await reauthenticate(emailForm.currentPassword);

      // Atualizar email no Firebase Auth
      await updateEmail(auth.currentUser, emailForm.newEmail);

      // Atualizar no backend
      await updateUserProfile({ email: emailForm.newEmail });

      setSuccess({ email: 'Email atualizado com sucesso!' });
      setEmailForm({ ...emailForm, currentPassword: '' });
      toast.success('Email atualizado com sucesso!');

    } catch (error) {
      console.error('Erro ao atualizar email:', error);
      let errorMessage = 'Erro ao atualizar email.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está sendo usado por outra conta.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Formato de email inválido.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha atual incorreta.';
      }
      
      setErrors({ email: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar senha
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess({});

    try {
      // Validações
      if (!passwordForm.currentPassword) {
        setErrors({ password: 'Senha atual é obrigatória.' });
        return;
      }

      if (!passwordForm.newPassword) {
        setErrors({ password: 'Nova senha é obrigatória.' });
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setErrors({ password: 'A nova senha deve ter pelo menos 6 caracteres.' });
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setErrors({ password: 'As senhas não coincidem.' });
        return;
      }

      if (passwordForm.currentPassword === passwordForm.newPassword) {
        setErrors({ password: 'A nova senha deve ser diferente da atual.' });
        return;
      }

      // Reautenticar
      await reauthenticate(passwordForm.currentPassword);

      // Atualizar senha
      await updatePassword(auth.currentUser, passwordForm.newPassword);

      setSuccess({ password: 'Senha atualizada com sucesso!' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('Senha atualizada com sucesso!');

    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      let errorMessage = 'Erro ao atualizar senha.';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha atual incorreta.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'A nova senha é muito fraca.';
      }
      
      setErrors({ password: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar nome
  const handleUpdateName = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess({});

    try {
      if (!profileForm.name.trim()) {
        setErrors({ name: 'Nome é obrigatório.' });
        return;
      }

      // Atualizar perfil no Firebase Auth
      await updateProfile(auth.currentUser, { displayName: profileForm.name });
      
      // Atualizar no backend
      await updateUserProfile({ name: profileForm.name });
      
      setSuccess({ name: 'Nome atualizado com sucesso!' });
      toast.success('Nome atualizado com sucesso!');

    } catch (error) {
      console.error('Erro ao atualizar nome:', error);
      setErrors({ name: 'Erro ao atualizar nome.' });
      toast.error('Erro ao atualizar nome.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        {onBack && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600 mt-2">Gerencie suas informações pessoais e configurações de conta</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="password">Senha</TabsTrigger>
        </TabsList>

        {/* Aba Perfil */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Perfil
              </CardTitle>
              <CardDescription>
                Atualize sua foto de perfil e informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Foto de Perfil */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileForm.photoURL} alt={user.name} />
                  <AvatarFallback className="text-lg">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    Alterar Foto
                  </Button>
                  <p className="text-sm text-gray-500">
                    JPG, PNG ou GIF. Máximo 5MB.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUpdatePhoto}
                    className="hidden"
                  />
                </div>
              </div>

              {errors.photo && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {errors.photo}
                  </AlertDescription>
                </Alert>
              )}

              {success.photo && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    {success.photo}
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Nome */}
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Seu nome completo"
                    disabled={loading}
                  />
                </div>

                {errors.name && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700">
                      {errors.name}
                    </AlertDescription>
                  </Alert>
                )}

                {success.name && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      {success.name}
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={loading} className="flex items-center gap-2">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Nome
                </Button>
              </form>

              {/* Informações do Aluno */}
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Faixa</Label>
                  <p className="font-medium">{user.belt || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Idade</Label>
                  <p className="font-medium">{user.age || 'Não informado'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Total de Presenças</Label>
                  <p className="font-medium">{user.total_presences || 0}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Presenças para Próximo Grau</Label>
                  <p className="font-medium">{user.presences_for_next_degree || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Email */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Alterar Email
              </CardTitle>
              <CardDescription>
                Atualize seu endereço de email. Você precisará confirmar sua senha atual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentEmail">Email Atual</Label>
                  <Input
                    id="currentEmail"
                    value={user.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newEmail">Novo Email</Label>
                  <Input
                    id="newEmail"
                    type="email"
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                    placeholder="novo@email.com"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailPassword">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="emailPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={emailForm.currentPassword}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-1"
                      onClick={() => setShowCurrentPassword(prev => !prev)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.email && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        {errors.email}
                      </AlertDescription>
                    </Alert>
                  )}
                  {success.email && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700">
                        {success.email}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <Button type="submit" disabled={loading} className="w-full flex items-center gap-2">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Atualizar Email
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Senha */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                Mantenha sua conta segura com uma senha forte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-1"
                      onClick={() => setShowCurrentPassword(prev => !prev)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && errors.password.includes('atual') && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        {errors.password}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-1"
                      onClick={() => setShowNewPassword(prev => !prev)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && !errors.password.includes('atual') && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        {errors.password}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      minLength={6}
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-1"
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full flex items-center gap-2">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Lock className="h-4 w-4" />
                  )}
                  Alterar Senha
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;


