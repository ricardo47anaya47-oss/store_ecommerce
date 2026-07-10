import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value) return 'El nombre es requerido';
        if (value.length < 2) return 'Mínimo 2 caracteres';
        return '';
      case 'lastName':
        if (!value) return 'El apellido es requerido';
        if (value.length < 2) return 'Mínimo 2 caracteres';
        return '';
      case 'email':
        if (!value) return 'El email es requerido';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
        return '';
      case 'password':
        if (!value) return 'La contraseña es requerida';
        if (value.length < 6) return 'Mínimo 6 caracteres';
        return '';
      case 'confirmPassword':
        if (!value) return 'Debe confirmar la contraseña';
        if (value !== formData.password) return 'Las contraseñas no coinciden';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const hasErrors = Object.values(errors).some(e => e);
  const isFormEmpty = !formData.name || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword;

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
      await register(
        formData.name,
        formData.lastName,
        formData.email,
        formData.password
      );
      addToast('¡Registro exitoso!', 'success');
      setTimeout(() => navigate('/dashboard'), 1500);
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
        <h1>Crear Cuenta</h1>
        <p className="auth-subtitle">Regístrate para empezar a comprar</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Nombre</label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="Tu nombre"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'has-error' : ''}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Apellido</label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              placeholder="Tu apellido"
              value={formData.lastName}
              onChange={handleChange}
              className={errors.lastName ? 'has-error' : ''}
            />
            {errors.lastName && <span className="field-error">{errors.lastName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'has-error' : ''}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'has-error' : ''}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'has-error' : ''}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading || hasErrors || isFormEmpty}
          >
            {loading ? 'Cargando...' : 'Registrarse'}
          </button>
        </form>

        <div className="auth-footer">
          <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
