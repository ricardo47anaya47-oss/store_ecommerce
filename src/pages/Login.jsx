import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateEmail = (value) => {
    if (!value) return 'El email es requerido';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
    return '';
  };

  const validatePassword = (value) => {
    if (!value) return 'La contraseña es requerida';
    if (value.length < 6) return 'Mínimo 6 caracteres';
    return '';
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setErrors({ ...errors, email: validateEmail(value) });
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setErrors({ ...errors, password: validatePassword(value) });
  };

  const hasErrors = Object.values(errors).some(e => e);
  const isFormEmpty = !email || !password;

  const addToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasErrors || isFormEmpty) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Toast toasts={toasts} setToasts={setToasts} />
      <div className="auth-card">
        <h1>Iniciar Sesión</h1>
        <p className="auth-subtitle">Accede a tu cuenta para continuar</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={handleEmailChange}
              className={errors.email ? 'has-error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={handlePasswordChange}
              className={errors.password ? 'has-error' : ''}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading || hasErrors || isFormEmpty}
          >
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
