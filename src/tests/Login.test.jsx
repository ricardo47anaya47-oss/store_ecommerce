// ============================================================
// ARCHIVO: src/tests/Login.test.jsx
// Función: Pruebas unitarias de la página de Login
// ============================================================

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../pages/Login';
import { renderWithProviders } from './helpers/renderWithProviders';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ----------------------------------------------------------------
  // 1. Renderizado de elementos del formulario
  // ----------------------------------------------------------------
  describe('Renderizado del formulario', () => {
    it('debe renderizar el título "Iniciar Sesión"', () => {
      renderWithProviders(<Login />);
      expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument();
    });

    it('debe renderizar el campo de Correo Electrónico', () => {
      renderWithProviders(<Login />);
      expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    });

    it('debe renderizar el campo de Contraseña (tipo password)', () => {
      renderWithProviders(<Login />);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('debe renderizar el botón "Entrar a la Tienda"', () => {
      renderWithProviders(<Login />);
      expect(
        screen.getByRole('button', { name: /entrar a la tienda/i })
      ).toBeInTheDocument();
    });

    it('debe renderizar el enlace "Regístrate aquí"', () => {
      renderWithProviders(<Login />);
      const registerLink = screen.getByRole('link', { name: /regístrate aquí/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('debe renderizar el enlace "Volver a la tienda"', () => {
      renderWithProviders(<Login />);
      expect(screen.getByRole('link', { name: /volver a la tienda/i })).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 2. Interacción con el formulario
  // ----------------------------------------------------------------
  describe('Interacción del usuario', () => {
    it('debe actualizar el campo de email al escribir', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);
      const emailInput = screen.getByLabelText(/correo electrónico/i);
      await user.type(emailInput, 'test@example.com');
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('debe actualizar el campo de contraseña al escribir', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Login />);
      const passwordInput = screen.getByLabelText(/contraseña/i);
      await user.type(passwordInput, 'miPassword123');
      expect(passwordInput).toHaveValue('miPassword123');
    });
  });

  // ----------------------------------------------------------------
  // 3. Submit y llamada a login()
  // ----------------------------------------------------------------
  describe('Envío del formulario', () => {
    it('debe llamar a login() con email y contraseña correctos al enviar', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });

      renderWithProviders(<Login />, { authValue: { login: mockLogin } });

      await user.type(screen.getByLabelText(/correo electrónico/i), 'usuario@test.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'password123');
      await user.click(screen.getByRole('button', { name: /entrar a la tienda/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('usuario@test.com', 'password123');
      });
    });

    it('debe navegar a "/" después de un login exitoso', async () => {
      const user = userEvent.setup();
      const mockLogin = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });

      renderWithProviders(<Login />, { authValue: { login: mockLogin } });

      await user.type(screen.getByLabelText(/correo electrónico/i), 'usuario@test.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'password123');
      await user.click(screen.getByRole('button', { name: /entrar a la tienda/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });
  });

  // ----------------------------------------------------------------
  // 4. Manejo de errores
  // ----------------------------------------------------------------
  describe('Manejo de errores', () => {
    it('debe mostrar mensaje de error cuando el login falla', async () => {
      const user = userEvent.setup();
      const errorMsg = 'Credenciales incorrectas';
      const mockLogin = vi.fn().mockRejectedValue(new Error(errorMsg));

      renderWithProviders(<Login />, { authValue: { login: mockLogin } });

      await user.type(screen.getByLabelText(/correo electrónico/i), 'malo@test.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'wrongpass');
      await user.click(screen.getByRole('button', { name: /entrar a la tienda/i }));

      await waitFor(() => {
        expect(screen.getByText(errorMsg)).toBeInTheDocument();
      });
    });

    it('debe deshabilitar el botón mientras se procesa el envío (isSubmitting)', async () => {
      const user = userEvent.setup();
      // Login que nunca resuelve para mantener el estado submitting
      const mockLogin = vi.fn(() => new Promise(() => {}));

      renderWithProviders(<Login />, { authValue: { login: mockLogin } });

      await user.type(screen.getByLabelText(/correo electrónico/i), 'test@test.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'pass123');
      await user.click(screen.getByRole('button', { name: /entrar a la tienda/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /verificando datos/i })).toBeDisabled();
      });
    });
  });
});
