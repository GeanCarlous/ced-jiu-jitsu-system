import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { verifyToken } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          const response = await verifyToken(idToken); // Envia o idToken para o backend
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            setUser(null);
            setError(response.data.error || 'Erro ao carregar dados do usuário.');
          }
        } catch (err) {
          console.error('Erro ao verificar token no backend:', err);
          setError('Erro ao autenticar com o servidor.');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      const response = await verifyToken(idToken); // Envia o idToken para o backend
      if (response.data.success) {
        setUser(response.data.user);
        return { success: true };
      } else {
        setError(response.data.error || 'Erro ao carregar dados do usuário.');
        return { success: false, error: response.data.error || 'Erro ao carregar dados do usuário.' };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Email ou senha inválidos.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Formato de email inválido.';
      }
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      setError("Erro ao fazer logout.");
    }
  };

  const value = {
    user,
    loading,
    error,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isTeacher: user?.role === 'professor',
    isStudent: user?.role === 'aluno'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

