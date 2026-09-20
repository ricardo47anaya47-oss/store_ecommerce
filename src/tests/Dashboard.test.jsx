// ============================================================
// ARCHIVO: src/tests/Dashboard.test.jsx
// Función: Pruebas unitarias del Panel de Control (Dashboard)
// ============================================================

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../pages/Dashboard';
import { renderWithProviders } from './helpers/renderWithProviders';

// Mock del servicio de compras
vi.mock('../services/apiService', () => ({
  purchaseService: {
    getUserPurchases: vi.fn(),
  },
}));

vi.mock('../components/Toast', () => ({
  default: ({ toasts }) => (
    <div data-testid="toast-container">
      {toasts.map((t) => <div key={t.id} data-testid={`toast-${t.type}`}>{t.message}</div>)}
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

// Usuario de prueba
const mockUser = {
  id: 1,
  name: 'Carlos',
  last_name: 'Rodríguez',
  email: 'carlos@test.com',
  phone: '+1 234 567 8900',
  address: 'Av. Principal 456',
};

// Compras de prueba
const mockPurchases = [
  {
    id: 10,
    total: '150.00',
    created_at: '2026-01-15T10:00:00Z',
    status: 'completed',
    shipping_address: 'Calle 1, Ciudad',
    payment_method: 'credit_card',
  },
  {
    id: 11,
    total: '89.99',
    created_at: '2026-02-20T14:00:00Z',
    status: 'shipped',
    shipping_address: 'Calle 2, Ciudad',
    payment_method: 'paypal',
  },
  {
    id: 12,
    total: '200.00',
    created_at: '2026-03-10T09:00:00Z',
    status: 'pending',
    shipping_address: 'Calle 3, Ciudad',
    payment_method: 'debit_card',
  },
];

describe('Dashboard Page', () => {
  let purchaseService;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    const module = await import('../services/apiService');
    purchaseService = module.purchaseService;
    // Por defecto retornar compras vacías
    purchaseService.getUserPurchases.mockResolvedValue({ success: true, data: [] });
  });

  // ----------------------------------------------------------------
  // 1. Redirección cuando no hay usuario
  // ----------------------------------------------------------------
  describe('Sin usuario autenticado', () => {
    it('debe mostrar mensaje de inicio de sesión requerido', () => {
      renderWithProviders(<Dashboard />, { authValue: { user: null } });
      expect(
        screen.getByText(/por favor inicia sesión para ver tu panel/i)
      ).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 2. Mensaje de bienvenida
  // ----------------------------------------------------------------
  describe('Mensaje de Bienvenida', () => {
    it('debe renderizar el mensaje de bienvenida con el nombre del usuario', async () => {
      purchaseService.getUserPurchases.mockResolvedValue({ success: true, data: [] });
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        expect(screen.getByText(/¡Bienvenido, Carlos Rodríguez!/i)).toBeInTheDocument();
      });
    });

    it('debe renderizar el título "Mi Panel de Control"', () => {
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      expect(screen.getByRole('heading', { name: /mi panel de control/i })).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 3. Tarjetas de métricas (Stats Grid)
  // ----------------------------------------------------------------
  describe('Tarjetas de Métricas', () => {
    beforeEach(() => {
      purchaseService.getUserPurchases.mockResolvedValue({
        success: true,
        data: mockPurchases,
      });
    });

    it('debe renderizar la tarjeta "Total de Compras"', async () => {
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        expect(screen.getByText('Total de Compras')).toBeInTheDocument();
      });
    });

    it('debe renderizar la tarjeta "Gastado Total"', async () => {
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        expect(screen.getByText('Gastado Total')).toBeInTheDocument();
      });
    });

    it('debe renderizar la tarjeta "Órdenes Completadas"', async () => {
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        expect(screen.getByText('Órdenes Completadas')).toBeInTheDocument();
      });
    });

    it('debe renderizar la tarjeta "En Camino"', async () => {
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        expect(screen.getByText('En Camino')).toBeInTheDocument();
      });
    });

    it('debe calcular correctamente el número de órdenes completadas', async () => {
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        // 1 orden completada de mockPurchases
        const completedCard = screen.getByText('Órdenes Completadas').closest('.stat-card');
        expect(completedCard).toHaveTextContent('1');
      });
    });

    it('debe calcular correctamente las órdenes en camino', async () => {
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        // 1 orden en camino (shipped) de mockPurchases
        const shippedCard = screen.getByText('En Camino').closest('.stat-card');
        expect(shippedCard).toHaveTextContent('1');
      });
    });
  });

  // ----------------------------------------------------------------
  // 4. Información de cuenta
  // ----------------------------------------------------------------
  describe('Información de Cuenta', () => {
    it('debe mostrar el nombre del usuario en la sección de cuenta', async () => {
      purchaseService.getUserPurchases.mockResolvedValue({ success: true, data: [] });
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        expect(screen.getAllByText('Carlos').length).toBeGreaterThan(0);
      });
    });

    it('debe mostrar el email del usuario', async () => {
      purchaseService.getUserPurchases.mockResolvedValue({ success: true, data: [] });
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        expect(screen.getByText('carlos@test.com')).toBeInTheDocument();
      });
    });

    it('debe renderizar el botón "Editar Información"', async () => {
      purchaseService.getUserPurchases.mockResolvedValue({ success: true, data: [] });
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar información/i })).toBeInTheDocument();
      });
    });
  });

  // ----------------------------------------------------------------
  // 5. Modo de Edición
  // ----------------------------------------------------------------
  describe('Modo Edición de Información', () => {
    it('debe mostrar el formulario de edición al hacer clic en "Editar Información"', async () => {
      const user = userEvent.setup();
      purchaseService.getUserPurchases.mockResolvedValue({ success: true, data: [] });
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /editar información/i })).toBeInTheDocument()
      );

      await user.click(screen.getByRole('button', { name: /editar información/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      });
    });

    it('debe cancelar la edición y volver a la vista normal', async () => {
      const user = userEvent.setup();
      purchaseService.getUserPurchases.mockResolvedValue({ success: true, data: [] });
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /editar información/i })).toBeInTheDocument()
      );
      await user.click(screen.getByRole('button', { name: /editar información/i }));
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument()
      );
      await user.click(screen.getByRole('button', { name: /cancelar/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar información/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /guardar/i })).not.toBeInTheDocument();
      });
    });
  });

  // ----------------------------------------------------------------
  // 6. Tabla de órdenes recientes
  // ----------------------------------------------------------------
  describe('Tabla de Órdenes Recientes', () => {
    it('debe mostrar "No tienes órdenes aún" cuando no hay compras', async () => {
      purchaseService.getUserPurchases.mockResolvedValue({ success: true, data: [] });
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        expect(screen.getByText(/no tienes órdenes aún/i)).toBeInTheDocument();
      });
    });

    it('debe renderizar la tabla cuando hay compras', async () => {
      purchaseService.getUserPurchases.mockResolvedValue({
        success: true,
        data: mockPurchases,
      });
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    it('debe mostrar los encabezados de la tabla correctamente', async () => {
      purchaseService.getUserPurchases.mockResolvedValue({
        success: true,
        data: mockPurchases,
      });
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        expect(screen.getByText('ID')).toBeInTheDocument();
        expect(screen.getByText('Total')).toBeInTheDocument();
        expect(screen.getByText('Fecha')).toBeInTheDocument();
        expect(screen.getByText('Estado')).toBeInTheDocument();
      });
    });

    it('debe mostrar las órdenes con su estado traducido', async () => {
      purchaseService.getUserPurchases.mockResolvedValue({
        success: true,
        data: mockPurchases,
      });
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        expect(screen.getByText('Entregado')).toBeInTheDocument(); // completed
        expect(screen.getByText('En camino')).toBeInTheDocument();  // shipped
        expect(screen.getByText('Pendiente')).toBeInTheDocument(); // pending
      });
    });

    it('debe mostrar botones "Ver Detalles" por cada orden', async () => {
      purchaseService.getUserPurchases.mockResolvedValue({
        success: true,
        data: mockPurchases,
      });
      renderWithProviders(<Dashboard />, { authValue: { user: mockUser } });
      await waitFor(() => {
        const viewBtns = screen.getAllByRole('button', { name: /ver detalles/i });
        expect(viewBtns).toHaveLength(3);
      });
    });
  });

  // ----------------------------------------------------------------
  // 7. Cerrar Sesión
  // ----------------------------------------------------------------
  describe('Cerrar Sesión', () => {
    it('debe llamar a logout() y navegar a /login al hacer clic en "Cerrar Sesión"', async () => {
      const user = userEvent.setup();
      const mockLogout = vi.fn();
      purchaseService.getUserPurchases.mockResolvedValue({ success: true, data: [] });

      renderWithProviders(<Dashboard />, {
        authValue: { user: mockUser, logout: mockLogout },
      });

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument()
      );

      await user.click(screen.getByRole('button', { name: /cerrar sesión/i }));

      expect(mockLogout).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
