import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

export type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  xp: number;
  level: number;
  role: { id: number; name: string };
  country?: string;
  avatar?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (data: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: User) => void;
  isGlobalLoading: boolean;
  setGlobalLoading: (val: boolean) => void;
};

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGlobalLoading, setGlobalLoading] = useState(false);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await api.get('/profile');
        setUser(response.data.data);
      }
    } catch (e) {
      console.log('Error fetching profile:', e);
      await AsyncStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User, token: string) => {
    await AsyncStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = async () => {
    setGlobalLoading(true);
    try {
      await api.post('/logout');
    } catch (e) {
      console.log('Error logging out:', e);
    }
    await AsyncStorage.removeItem('token');
    setUser(null);
    setGlobalLoading(false);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser, isGlobalLoading, setGlobalLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
