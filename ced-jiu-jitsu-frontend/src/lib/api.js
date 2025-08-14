import axios from 'axios';
import { auth } from './firebase';

// URL base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ced-jiu-jitsu-backend.onrender.com';

// Criar instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação real do Firebase
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // if (error.response?.status === 401) {
    //   // Token expirado ou inválido
    //   auth.signOut();
    // }
    return Promise.reject(error);
  }
);

// Funções da API

// Autenticação
export const verifyToken = (idToken) => {
  return api.post('/api/auth/verify-token', { idToken });
};

export const registerStudent = (studentData) => {
  // Não enviar uid, o backend irá gerar
  const { uid, ...data } = studentData;
  return api.post('/api/auth/register-student', data);
};

export const registerTeacher = (teacherData) => {
  return api.post('/api/auth/register-teacher', teacherData);
};

export const updateProfile = (profileData) => {
  return api.put('/api/auth/update-profile', profileData);
};

export const changePassword = (passwordData) => {
  return api.put('/api/auth/change-password', passwordData);
};

export const updateEmail = (emailData) => {
  return api.put('/api/auth/update-email', emailData);
};

export const uploadPhoto = (photoData) => {
  return api.post('/api/auth/upload-photo', photoData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Estudantes
export const getAllStudents = () => {
  return api.get('/api/students/');
};

export const getStudent = (uid) => {
  return api.get(`/api/students/${uid}`);
};

export const createStudent = (studentData) => {
  return api.post('/api/students/', studentData);
};

export const updateStudent = (uid, studentData) => {
  return api.put(`/api/students/${uid}`, studentData);
};

export const getStudentsCloseToGraduation = (maxPresences = 10) => {
  return api.get(`/api/students/close-to-graduation?max_presences=${maxPresences}`);
};

// Atividades Extras
export const addExtraActivity = (studentUid) => {
  return api.post(`/api/students/${studentUid}/extra-activity`);
};

export const removeExtraActivity = (studentUid) => {
  return api.post(`/api/students/${studentUid}/remove-extra-activity`);
};

// Presença
export const markAttendance = (attendanceData) => {
  return api.post('/api/students/attendance', attendanceData);
};

export const getAttendanceHistory = (uid, limit = 50, offset = 0) => {
  return api.get(`/api/students/${uid}/attendance-history?limit=${limit}&offset=${offset}`);
};

export const getClassAttendance = (classId) => {
  return api.get(`/api/attendance/class/${classId}`);
};

export const getClasses = (startDate, endDate) => {
  return api.get(`/api/attendance/classes?start_date=${startDate}&end_date=${endDate}`);
};

// Autenticação real com Firebase
import { signInWithEmailAndPassword } from "firebase/auth";

export const loginWithFirebase = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const token = await userCredential.user.getIdToken();
  return { user: userCredential.user, token };
};

export default api;

