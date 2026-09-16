import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/apiService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar si hay token guardado al cargar
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login({ email, password });
      
      if (!response.success) {
        throw new Error(response.message || 'Error en login');
      }

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setLoading(false);
      
      return response.user;
    } catch (err) {
      const errorMessage = err.message || 'Error en login';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  const register = async (name, lastName, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.register({ name, lastName, email, password });
      
      if (!response.success) {
        throw new Error(response.message || 'Error en registro');
      }

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      setLoading(false);
      
      return response.user;
    } catch (err) {
      const errorMessage = err.message || 'Error en registro';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

