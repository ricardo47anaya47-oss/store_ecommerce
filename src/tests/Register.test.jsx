// ============================================================
// ARCHIVO: src/tests/Register.test.jsx
// Función: Pruebas unitarias de la página de Registro
// ============================================================

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from '../pages/Register';
import { renderWithProviders } from './helpers/renderWithProviders';

// Mock Toast para evitar timers asíncronos en tests
vi.mock('../components/Toast', () => ({
  default: ({ toasts }) => (
    <div data-testid="toast-container">
      {toasts.map((t) => (
        <div key={t.id} data-testid={`toast-${t.type}`}>{t.message}</div>
      ))}
    </div>
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Register Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  // ----------------------------------------------------------------
  // 1. Renderizado del formulario
  // ----------------------------------------------------------------
  describe('Renderizado del formulario', () => {
    it('debe renderizar el título "Crear Cuenta"', () => {
      renderWithProviders(<Register />);
      expect(screen.getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument();
    });

    it('debe renderizar campo Nombre', () => {
      renderWithProviders(<Register />);
      expect(screen.getByLabelText(/^nombre$/i)).toBeInTheDocument();
    });

    it('debe renderizar campo Apellido', () => {
      renderWithProviders(<Register />);
      expect(screen.getByLabelText(/apellido/i)).toBeInTheDocument();
    });

    it('debe renderizar campo Email', () => {
      renderWithProviders(<Register />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('debe renderizar campo Contraseña (tipo password)', () => {
      renderWithProviders(<Register />);
      const passwordInputs = screen.getAllByDisplayValue('');
      const passField = screen.getByLabelText(/^contraseña$/i);
      expect(passField).toHaveAttribute('type', 'password');
    });

    it('debe renderizar campo Confirmar Contraseña', () => {
      renderWithProviders(<Register />);
      expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    });

    it('debe renderizar el botón "Registrarse"', () => {
      renderWithProviders(<Register />);
      expect(screen.getByRole('button', { name: /registrarse/i })).toBeInTheDocument();
    });

    it('debe renderizar el enlace "Inicia sesión aquí"', () => {
      renderWithProviders(<Register />);
      expect(screen.getByRole('link', { name: /inicia sesión aquí/i })).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 2. Validación de campos individuales
  // ----------------------------------------------------------------
  describe('Validaciones de campos', () => {
    it('debe mostrar error cuando el nombre tiene menos de 2 caracteres', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);
      const nameInput = screen.getByLabelText(/^nombre$/i);
      await user.type(nameInput, 'A');
      await user.tab(); // Salir del campo para activar validación
      await waitFor(() => {
        expect(screen.getByText(/mínimo 2 caracteres/i)).toBeInTheDocument();
      });
    });

    it('debe mostrar error cuando el email tiene formato inválido', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'correo-invalido');
      await user.tab();
      await waitFor(() => {
        expect(screen.getByText(/email inválido/i)).toBeInTheDocument();
      });
    });

    it('debe mostrar error cuando la contraseña tiene menos de 6 caracteres', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);
      const passInput = screen.getByLabelText(/^contraseña$/i);
      await user.type(passInput, '123');
      await user.tab();
      await waitFor(() => {
        expect(screen.getByText(/mínimo 6 caracteres/i)).toBeInTheDocument();
      });
    });

    it('debe mostrar error cuando las contraseñas no coinciden', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'diferente456');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument();
      });
    });

    it('NO debe mostrar errores con datos válidos', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      await user.type(screen.getByLabelText(/^nombre$/i), 'Juan');
      await user.type(screen.getByLabelText(/apellido/i), 'Pérez');
      await user.type(screen.getByLabelText(/email/i), 'juan@test.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');

      expect(screen.queryByText(/mínimo/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/inválido/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/no coinciden/i)).not.toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 3. Estado del botón de submit
  // ----------------------------------------------------------------
  describe('Estado del botón Registrarse', () => {
    it('el botón debe estar deshabilitado cuando el formulario está vacío', () => {
      renderWithProviders(<Register />);
      expect(screen.getByRole('button', { name: /registrarse/i })).toBeDisabled();
    });

    it('el botón debe estar deshabilitado cuando hay errores de validación', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      // Solo nombre con 1 char (inválido)
      await user.type(screen.getByLabelText(/^nombre$/i), 'A');
      await user.tab();

      expect(screen.getByRole('button', { name: /registrarse/i })).toBeDisabled();
    });

    it('el botón debe habilitarse con todos los campos válidos', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      await user.type(screen.getByLabelText(/^nombre$/i), 'Juan');
      await user.type(screen.getByLabelText(/apellido/i), 'Pérez');
      await user.type(screen.getByLabelText(/email/i), 'juan@test.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /registrarse/i })).not.toBeDisabled();
      });
    });
  });

  // ----------------------------------------------------------------
  // 4. Envío del formulario
  // ----------------------------------------------------------------
  describe('Envío del formulario', () => {
    it('debe llamar a register() con los datos correctos al enviar', async () => {
      const user = userEvent.setup();
      const mockRegister = vi.fn().mockResolvedValue({ id: 99, name: 'Juan' });

      renderWithProviders(<Register />, { authValue: { register: mockRegister } });

      await user.type(screen.getByLabelText(/^nombre$/i), 'Juan');
      await user.type(screen.getByLabelText(/apellido/i), 'Pérez');
      await user.type(screen.getByLabelText(/email/i), 'juan@test.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');

      await user.click(screen.getByRole('button', { name: /registrarse/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          'Juan',
          'Pérez',
          'juan@test.com',
          'password123'
        );
      });
    });

    it('debe mostrar toast de error cuando el registro falla', async () => {
      const user = userEvent.setup();
      const mockRegister = vi.fn().mockRejectedValue(new Error('El email ya está registrado'));

      renderWithProviders(<Register />, { authValue: { register: mockRegister } });

      await user.type(screen.getByLabelText(/^nombre$/i), 'Juan');
      await user.type(screen.getByLabelText(/apellido/i), 'Pérez');
      await user.type(screen.getByLabelText(/email/i), 'existente@test.com');
      await user.type(screen.getByLabelText(/^contraseña$/i), 'password123');
      await user.type(screen.getByLabelText(/confirmar contraseña/i), 'password123');

      await user.click(screen.getByRole('button', { name: /registrarse/i }));

      await waitFor(() => {
        expect(screen.getByText('El email ya está registrado')).toBeInTheDocument();
      });
    });
  });
});
