// ============================================================
// ARCHIVO: src/tests/Home.test.jsx
// Función: Pruebas unitarias de la página de inicio (Home)
// ============================================================

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../pages/Home';
import { renderWithProviders } from './helpers/renderWithProviders';

// Mock de react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Home Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ----------------------------------------------------------------
  // 1. Renderizado del Hero Section
  // ----------------------------------------------------------------
  describe('Hero Section', () => {
    it('debe renderizar el título de bienvenida', () => {
      renderWithProviders(<Home />);
      expect(
        screen.getByText('Bienvenido a nuestro eCommerce')
      ).toBeInTheDocument();
    });

    it('debe renderizar el subtítulo descriptivo', () => {
      renderWithProviders(<Home />);
      expect(
        screen.getByText('Descubre los mejores productos al mejor precio')
      ).toBeInTheDocument();
    });

    it('debe renderizar el botón "Ver Productos" como enlace hacia /products', () => {
      renderWithProviders(<Home />);
      const verProductosLink = screen.getByRole('link', { name: /ver productos/i });
      expect(verProductosLink).toBeInTheDocument();
      expect(verProductosLink).toHaveAttribute('href', '/products');
    });
  });

  // ----------------------------------------------------------------
  // 2. Tarjetas de ventajas (Features)
  // ----------------------------------------------------------------
  describe('Features Section — 4 tarjetas de ventajas', () => {
    it('debe renderizar la tarjeta "Envío Rápido"', () => {
      renderWithProviders(<Home />);
      expect(screen.getByText('Envío Rápido')).toBeInTheDocument();
      expect(screen.getByText(/recibe tus compras en 24-48 horas/i)).toBeInTheDocument();
    });

    it('debe renderizar la tarjeta "Mejor Precio"', () => {
      renderWithProviders(<Home />);
      expect(screen.getByText('Mejor Precio')).toBeInTheDocument();
      expect(screen.getByText(/garantizamos los mejores precios/i)).toBeInTheDocument();
    });

    it('debe renderizar la tarjeta "Compra Segura"', () => {
      renderWithProviders(<Home />);
      expect(screen.getByText('Compra Segura')).toBeInTheDocument();
      expect(screen.getByText(/tus datos están protegidos/i)).toBeInTheDocument();
    });

    it('debe renderizar la tarjeta "Soporte 24/7"', () => {
      renderWithProviders(<Home />);
      expect(screen.getByText('Soporte 24/7')).toBeInTheDocument();
      expect(screen.getByText(/estamos aquí para ayudarte/i)).toBeInTheDocument();
    });

    it('debe renderizar exactamente 4 tarjetas de ventajas', () => {
      renderWithProviders(<Home />);
      const featureCards = document.querySelectorAll('.feature-card');
      expect(featureCards).toHaveLength(4);
    });
  });

  // ----------------------------------------------------------------
  // 3. Sección Call to Action (CTA)
  // ----------------------------------------------------------------
  describe('Call to Action Section', () => {
    it('debe renderizar el encabezado "¿Listo para comenzar?"', () => {
      renderWithProviders(<Home />);
      expect(screen.getByText('¿Listo para comenzar?')).toBeInTheDocument();
    });

    it('debe renderizar el botón "Registrarse" con enlace a /register', () => {
      renderWithProviders(<Home />);
      const registerLink = screen.getByRole('link', { name: /registrarse/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('debe renderizar el botón "Iniciar Sesión" con enlace a /login', () => {
      renderWithProviders(<Home />);
      const loginLink = screen.getByRole('link', { name: /iniciar sesión/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  // ----------------------------------------------------------------
  // 4. Footer
  // ----------------------------------------------------------------
  describe('Footer', () => {
    it('debe renderizar el footer con el texto de derechos reservados', () => {
      renderWithProviders(<Home />);
      expect(screen.getByText(/todos los derechos reservados/i)).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 5. Redirección si el usuario está autenticado
  // ----------------------------------------------------------------
  describe('Redirección de usuario autenticado', () => {
    it('debe redirigir a /dashboard cuando el usuario está logueado', () => {
      const mockUser = { id: 1, name: 'Juan', email: 'juan@test.com' };
      renderWithProviders(<Home />, { authValue: { user: mockUser } });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('NO debe redirigir cuando no hay usuario autenticado', () => {
      renderWithProviders(<Home />, { authValue: { user: null } });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
