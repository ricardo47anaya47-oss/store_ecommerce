import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Bienvenido a nuestro eCommerce</h1>
          <p>Descubre los mejores productos al mejor precio</p>
          <Link to="/products" className="cta-button">
            Ver Productos
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>¿Por qué elegirnos?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">◆</div>
            <h3>Envío Rápido</h3>
            <p>Recibe tus compras en 24-48 horas</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Mejor Precio</h3>
            <p>Garantizamos los mejores precios del mercado</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Compra Segura</h3>
            <p>Tus datos están protegidos con nosotros</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Soporte 24/7</h3>
            <p>Estamos aquí para ayudarte siempre</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <h2>¿Listo para comenzar?</h2>
        <p>Crea una cuenta y obtén acceso a ofertas exclusivas</p>
        <div className="cta-buttons">
          <Link to="/register" className="btn btn-primary">
            Registrarse
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Iniciar Sesión
          </Link>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="home-footer">
        <p>&copy; 2026 eCommerce. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Home;
