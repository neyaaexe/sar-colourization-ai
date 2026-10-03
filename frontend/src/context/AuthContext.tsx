import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('sar_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const u = await authAPI.getMe();
        setUser(u);
      } catch (err) {
        console.error('Failed to load user session', err);
        localStorage.removeItem('sar_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('sar_token', data.access_token);
    setToken(data.access_token);
    const u = await authAPI.getMe();
    setUser(u);
  };

  const register = async (email: string, password: string) => {
    const data = await authAPI.register(email, password);
    localStorage.setItem('sar_token', data.access_token);
    setToken(data.access_token);
    const u = await authAPI.getMe();
    setUser(u);
  };

  const loginDemo = async () => {
    const demoEmail = "researcher@nasa-esa-sar.ai";
    const demoPassword = "DemoUserPassword123!";
    try {
      await login(demoEmail, demoPassword);
    } catch {
      await register(demoEmail, demoPassword);
    }
  };

  const logout = () => {
    localStorage.removeItem('sar_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, loginDemo, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
