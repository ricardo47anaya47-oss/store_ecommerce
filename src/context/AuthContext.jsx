// ============================================================
// ARCHIVO: src/context/AuthContext.jsx
// Función: Administrar el estado de sesión y almacenamiento del Token JWT
// ============================================================

import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/apiService';

// 1. Creación del Contexto de Autenticación
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Estado para almacenar los datos del usuario autenticado
  const [user, setUser] = useState(null);
  
  // Estado para indicar si estamos leyendo el localStorage al iniciar
  const [loading, setLoading] = useState(true);

  // 2. Efecto de verificación al cargar o refrescar la aplicación
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Intentamos obtener el token y el usuario desde el almacenamiento del navegador
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
          // Si ambos existen, parseamos la información del usuario y restauramos la sesión
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error al restaurar la sesión desde localStorage:', error);
        // Si hay un error al leer o parsear, limpiamos el almacenamiento por seguridad
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        // Marcamos que la verificación inicial ha terminado
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 3. Función para iniciar sesión y procesar la respuesta del servidor
  const login = async (email, password) => {
    try {
      // Llamamos al servicio API que conecta con PHP
      const response = await authService.login({ email, password });

      // Verificamos si la respuesta del backend fue exitosa y contiene el token
      if (response && response.token) {
        const tokenReceived = response.token;
        const userData = response.user || { email };

        // Guardamos el Token y la información del usuario en localStorage
        localStorage.setItem('token', tokenReceived);
        localStorage.setItem('user', JSON.stringify(userData));

        // Actualizamos el estado global en React
        setUser(userData);

        return userData;
      } else {
        throw new Error(response.message || 'La respuesta del servidor no incluyó un token válido');
      }
    } catch (error) {
      console.error('Error en el proceso de login en AuthContext:', error);
      throw error;
    }
  };

  // 4. Función para registrar un nuevo usuario
  const register = async (nameOrData, lastName, email, password) => {
    try {
      const payload =
        typeof nameOrData === 'object' && nameOrData !== null
          ? nameOrData
          : { name: nameOrData, lastName, email, password };

      const response = await authService.register(payload);

      if (response && response.token) {
        const tokenReceived = response.token;
        const userData = response.user || {
          name: payload.name,
          email: payload.email,
        };

        // Guardamos el Token y la información del usuario en localStorage
        localStorage.setItem('token', tokenReceived);
        localStorage.setItem('user', JSON.stringify(userData));

        // Actualizamos el estado global en React
        setUser(userData);

        return userData;
      } else {
        throw new Error(response?.message || 'Error en el proceso de registro');
      }
    } catch (error) {
      console.error('Error en el proceso de registro en AuthContext:', error);
      throw error;
    }
  };

  // 5. Función para cerrar sesión y limpiar credenciales
  const logout = () => {
    // Eliminamos el token y los datos de usuario del almacenamiento local
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Restablecemos el estado de React
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};