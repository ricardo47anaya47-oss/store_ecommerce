// ============================================================
// COMPONENTE: Login.jsx
// Función: Manejar el inicio de sesión y guardar el Token JWT
// ============================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Login = () => {
  // 1. Definición de Estados
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Hook para redirigir al usuario a otra página después de iniciar sesión
  const navigate = useNavigate();

  const API_URL = 'https://stroreecommerce.infinityfreeapp.com/api';

  // 2. Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault(); // Evita que la página se recargue al enviar el formulario
    setLoading(true);
    setError(null);

    try {
      // 3. Petición POST hacia el endpoint de login en PHP
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Convertimos los datos del estado a formato JSON para enviarlos
        body: JSON.stringify({
          email: email,
          password: password
        }),
      });

      const data = await response.json();

      // 4. Evaluar la respuesta del backend
      if (data.success) {
        // ¡Éxito! Guardamos el token en el navegador
        localStorage.setItem('token', data.token);
        
        // Opcional: También puedes guardar los datos del usuario si tu API los devuelve
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirigir al usuario a la página principal del catálogo
        navigate('/'); 
      } else {
        // Si el correo o contraseña son incorrectos, mostramos el mensaje del backend
        setError(data.message);
      }
    } catch (err) {
      setError('Ocurrió un error al intentar conectar con el servidor.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Iniciar Sesión</h2>

      <form onSubmit={handleSubmit}>
        <div style={styles.inputGroup}>
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Entrar a la Tienda'}
        </button>
      </form>
    </div>
  );
};

export default Login;