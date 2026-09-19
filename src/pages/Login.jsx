// ============================================================
// ARCHIVO: src/pages/Login.jsx
// Función: Formulario de inicio de sesión con prevención estricta de recarga
// ============================================================

import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    // 1. PRIMERA LÍNEA OBLIGATORIA: Detiene la recarga por defecto del navegador HTML
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Evitamos envíos dobles mientras la petición está en proceso
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      console.log('Iniciando proceso de autenticación para:', email);

      // 2. Ejecutamos la función login definida en AuthContext
      await login(email, password);

      console.log('Inicio de sesión exitoso. Redirigiendo a la tienda...');

      // 3. Navegación fluida dentro de la SPA (sin recargar la página)
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Error durante el inicio de sesión:', err);

      // Si la API en PHP o la red fallan, mostramos el mensaje en pantalla sin recargar
      setErrorMessage(
        err.message || 'No se pudo iniciar sesión. Revisa tus credenciales o conexión.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Iniciar Sesión</h1>
        <p className="auth-subtitle">Ingresa tus credenciales para acceder a la tienda</p>

        {/* Mensaje de error visible en pantalla en lugar de recargar */}
        {errorMessage && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '15px',
            fontSize: '14px',
            textAlign: 'center',
            border: '1px solid #ef9a9a'
          }}>
            {errorMessage}
          </div>
        )}

        {/* El evento onSubmit debe llamar a handleSubmit */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* El botón debe ser de tipo submit */}
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Verificando datos...' : 'Entrar a la Tienda'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></p>
          <Link to="/">Volver a la tienda</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;