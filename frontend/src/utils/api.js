import axios from 'axios';
import { auth } from './firebase';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const getUserReports = async (userId, limit = 50) => {
  const response = await api.get(`/reports/${userId}`, {
    params: { limit }
  });
  return response.data;
};

export const getReportDetail = async (reportId, userId) => {
  const response = await api.get(`/report/${reportId}`, {
    params: { user_id: userId }
  });
  return response.data;
};

export default api;
