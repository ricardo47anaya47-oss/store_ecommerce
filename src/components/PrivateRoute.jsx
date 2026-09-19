import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const PrivateRoute = ({ children }) => {
  // Extraemos el usuario y el estado de verificación desde el contexto
  const { user, loading } = useContext(AuthContext);

  // 1. Mientras se verifica la sesión en localStorage, mostramos la pantalla de carga
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Cargando sesión...
      </div>
    );
  }

  // 2. Si el usuario está autenticado, mostramos la página protegida; si no, redirigimos al login
  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;