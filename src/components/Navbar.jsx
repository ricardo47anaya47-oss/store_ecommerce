import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const { getItemCount } = useContext(CartContext);
  const itemCount = getItemCount();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="logo" onClick={() => navigate('/')}>
          <svg className="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          eCommerce
        </h1>
        <ul className="nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/products">Productos</a></li>
          {user && (
            <>
              <li><a href="/dashboard">Dashboard</a></li>
              <li>
                <a href="/cart" className="icon-link" title="Carrito">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
                </a>
              </li>
              <li><a href="/orders">Mis Órdenes</a></li>
              <li>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="icon-link" title="Cerrar Sesión">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </a>
              </li>
            </>
          )}
          {!user && (
            <>
              <li><a href="/login">Login</a></li>
              <li><a href="/register">Registrarse</a></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;