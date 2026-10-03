import axios from 'axios';
import { ConversationSession, ConversationSummary, ImageItem } from '../types';

const API = axios.create({
  baseURL: '', // Handled via Vite proxy or absolute URL
});

// Interceptor to inject JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sar_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: async (email: string, password: string) => {
    const res = await API.post('/auth/register', { email, password });
    return res.data;
  },
  login: async (email: string, password: string) => {
    const res = await API.post('/auth/login', { email, password });
    return res.data;
  },
  getMe: async () => {
    const res = await API.get('/auth/me');
    return res.data;
  },
};

export const conversationsAPI = {
  create: async (title?: string): Promise<ConversationSession> => {
    const res = await API.post('/conversations', { title });
    return res.data;
  },
  getAll: async (): Promise<ConversationSummary[]> => {
    const res = await API.get('/conversations');
    return res.data;
  },
  getById: async (id: string): Promise<ConversationSession> => {
    const res = await API.get(`/conversations/${id}`);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await API.delete(`/conversations/${id}`);
  },
  uploadImage: async (id: string, file: File): Promise<ImageItem> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await API.post(`/conversations/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  processImage: async (id: string): Promise<ConversationSession> => {
    const res = await API.post(`/conversations/${id}/process`);
    return res.data;
  },
};
