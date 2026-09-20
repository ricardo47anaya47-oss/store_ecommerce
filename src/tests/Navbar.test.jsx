// ============================================================
// ARCHIVO: src/tests/Navbar.test.jsx
// Función: Pruebas unitarias del componente Navbar
// ============================================================

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '../components/Navbar';
import { renderWithProviders } from './helpers/renderWithProviders';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Navbar Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ----------------------------------------------------------------
  // 1. Logo y marca
  // ----------------------------------------------------------------
  describe('Marca y Logo', () => {
    it('debe renderizar el texto de marca "eCommerce"', () => {
      renderWithProviders(<Navbar />);
      expect(screen.getByText('eCommerce')).toBeInTheDocument();
    });

    it('debe navegar a "/" al hacer clic en el logo', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Navbar />);
      const logo = screen.getByText('eCommerce');
      await user.click(logo);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  // ----------------------------------------------------------------
  // 2. Links siempre visibles (usuarios no autenticados)
  // ----------------------------------------------------------------
  describe('Links públicos (sin usuario autenticado)', () => {
    it('debe mostrar el link "Home"', () => {
      renderWithProviders(<Navbar />, { authValue: { user: null } });
      expect(screen.getByRole('link', { name: /^home$/i })).toBeInTheDocument();
    });

    it('debe mostrar el link "Productos"', () => {
      renderWithProviders(<Navbar />, { authValue: { user: null } });
      expect(screen.getByRole('link', { name: /productos/i })).toBeInTheDocument();
    });

    it('debe mostrar el link "Login" cuando no hay usuario', () => {
      renderWithProviders(<Navbar />, { authValue: { user: null } });
      expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
    });

    it('debe mostrar el link "Registrarse" cuando no hay usuario', () => {
      renderWithProviders(<Navbar />, { authValue: { user: null } });
      expect(screen.getByRole('link', { name: /registrarse/i })).toBeInTheDocument();
    });

    it('NO debe mostrar "Dashboard" cuando no hay usuario', () => {
      renderWithProviders(<Navbar />, { authValue: { user: null } });
      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 3. Links de usuario autenticado
  // ----------------------------------------------------------------
  describe('Links privados (usuario autenticado)', () => {
    const mockUser = { id: 1, name: 'María', email: 'maria@test.com' };

    it('debe mostrar el link "Dashboard" cuando hay usuario', () => {
      renderWithProviders(<Navbar />, { authValue: { user: mockUser } });
      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('debe mostrar el link "Mis Órdenes" cuando hay usuario', () => {
      renderWithProviders(<Navbar />, { authValue: { user: mockUser } });
      expect(screen.getByRole('link', { name: /mis órdenes/i })).toBeInTheDocument();
    });

    it('NO debe mostrar "Login" cuando hay usuario autenticado', () => {
      renderWithProviders(<Navbar />, { authValue: { user: mockUser } });
      expect(screen.queryByRole('link', { name: /^login$/i })).not.toBeInTheDocument();
    });

    it('NO debe mostrar "Registrarse" cuando hay usuario autenticado', () => {
      renderWithProviders(<Navbar />, { authValue: { user: mockUser } });
      expect(screen.queryByRole('link', { name: /^registrarse$/i })).not.toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 4. Badge del carrito
  // ----------------------------------------------------------------
  describe('Badge del carrito', () => {
    const mockUser = { id: 1, name: 'Test', email: 'test@test.com' };

    it('NO debe mostrar el badge cuando el carrito está vacío', () => {
      renderWithProviders(<Navbar />, {
        authValue: { user: mockUser },
        cartValue: { getItemCount: vi.fn(() => 0) },
      });
      expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
    });

    it('debe mostrar el badge con la cantidad cuando hay items en el carrito', () => {
      renderWithProviders(<Navbar />, {
        authValue: { user: mockUser },
        cartValue: { getItemCount: vi.fn(() => 5) },
      });
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('debe mostrar el número correcto de items en el badge', () => {
      renderWithProviders(<Navbar />, {
        authValue: { user: mockUser },
        cartValue: { getItemCount: vi.fn(() => 12) },
      });
      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 5. Función de logout
  // ----------------------------------------------------------------
  describe('Botón de Cerrar Sesión', () => {
    it('debe llamar a logout() y navegar a "/" al hacer clic', async () => {
      const user = userEvent.setup();
      const mockLogout = vi.fn();
      const mockUser = { id: 1, name: 'Test', email: 'test@test.com' };

      renderWithProviders(<Navbar />, {
        authValue: { user: mockUser, logout: mockLogout },
        cartValue: { getItemCount: vi.fn(() => 0) },
      });

      // El botón de logout usa el SVG de salida
      const logoutBtn = screen.getByTitle(/cerrar sesión/i);
      await user.click(logoutBtn);
      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
