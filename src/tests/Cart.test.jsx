// ============================================================
// ARCHIVO: src/tests/Cart.test.jsx
// Función: Pruebas unitarias de la página del Carrito de Compras
// ============================================================

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Cart from '../pages/Cart';
import { renderWithProviders } from './helpers/renderWithProviders';

// Mock de purchaseService
vi.mock('../services/apiService', () => ({
  purchaseService: {
    createPurchase: vi.fn(),
  },
}));

// Mock de Toast para evitar timers
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

// Datos de ejemplo para el carrito
const mockCartItems = [
  { id: 1, product_id: 101, name: 'Laptop Gamer Pro', price: 999.99, quantity: 1, image: '' },
  { id: 2, product_id: 202, name: 'Mouse Inalámbrico', price: 29.99, quantity: 2, image: '' },
];

describe('Cart Page', () => {
  beforeEach(async () => {
    mockNavigate.mockClear();
    const { purchaseService } = await import('../services/apiService');
    purchaseService.createPurchase.mockClear();
  });

  // ----------------------------------------------------------------
  // 1. Estado vacío
  // ----------------------------------------------------------------
  describe('Carrito Vacío', () => {
    it('debe renderizar "Tu carrito está vacío" cuando no hay items', () => {
      renderWithProviders(<Cart />, { cartValue: { items: [], loading: false } });
      expect(screen.getByText(/tu carrito está vacío/i)).toBeInTheDocument();
    });

    it('debe mostrar el enlace "Continuar comprando" cuando el carrito está vacío', () => {
      renderWithProviders(<Cart />, { cartValue: { items: [], loading: false } });
      expect(screen.getByRole('link', { name: /continuar comprando/i })).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 2. Estado de carga
  // ----------------------------------------------------------------
  describe('Estado de carga', () => {
    it('debe renderizar mensaje de carga mientras se obtiene el carrito', () => {
      renderWithProviders(<Cart />, { cartValue: { items: [], loading: true } });
      expect(screen.getByText(/cargando carrito/i)).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 3. Items del carrito
  // ----------------------------------------------------------------
  describe('Items del carrito', () => {
    it('debe renderizar todos los items del carrito', () => {
      renderWithProviders(<Cart />, { cartValue: { items: mockCartItems, loading: false } });
      expect(screen.getByText('Laptop Gamer Pro')).toBeInTheDocument();
      expect(screen.getByText('Mouse Inalámbrico')).toBeInTheDocument();
    });

    it('debe mostrar el precio de cada item', () => {
      renderWithProviders(<Cart />, { cartValue: { items: mockCartItems, loading: false } });
      expect(screen.getByText('$999.99')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
    });

    it('debe mostrar el conteo correcto de artículos en el título', () => {
      renderWithProviders(<Cart />, { cartValue: { items: mockCartItems, loading: false } });
      expect(screen.getByText(/tus artículos \(2\)/i)).toBeInTheDocument();
    });

    it('debe renderizar un botón de eliminar por cada item', () => {
      renderWithProviders(<Cart />, { cartValue: { items: mockCartItems, loading: false } });
      const removeButtons = screen.getAllByTitle(/eliminar del carrito/i);
      expect(removeButtons).toHaveLength(2);
    });
  });

  // ----------------------------------------------------------------
  // 4. Eliminar item
  // ----------------------------------------------------------------
  describe('Eliminar item del carrito', () => {
    it('debe llamar a removeFromCart() con el id correcto al eliminar', async () => {
      const user = userEvent.setup();
      const mockRemove = vi.fn().mockResolvedValue({ success: true });

      renderWithProviders(<Cart />, {
        cartValue: { items: mockCartItems, loading: false, removeFromCart: mockRemove },
      });

      const removeButtons = screen.getAllByTitle(/eliminar del carrito/i);
      await user.click(removeButtons[0]); // Eliminar primer item (id: 1)

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith(1);
      });
    });
  });

  // ----------------------------------------------------------------
  // 5. Actualización de cantidad
  // ----------------------------------------------------------------
  describe('Actualización de cantidad', () => {
    it('debe llamar a updateQuantity() al cambiar el número en el input', async () => {
      const user = userEvent.setup();
      const mockUpdate = vi.fn().mockResolvedValue({ success: true });

      renderWithProviders(<Cart />, {
        cartValue: { items: mockCartItems, loading: false, updateQuantity: mockUpdate },
      });

      const quantityInputs = screen.getAllByRole('spinbutton');
      await user.clear(quantityInputs[0]);
      await user.type(quantityInputs[0], '3');

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });
  });

  // ----------------------------------------------------------------
  // 6. Resumen del pedido y cálculos
  // ----------------------------------------------------------------
  describe('Resumen del Pedido', () => {
    it('debe renderizar la sección "Resumen del Pedido"', () => {
      renderWithProviders(<Cart />, { cartValue: { items: mockCartItems, loading: false } });
      expect(screen.getByText('Resumen del Pedido')).toBeInTheDocument();
    });

    it('debe mostrar Subtotal calculado correctamente', () => {
      // Subtotal: 999.99*1 + 29.99*2 = 1059.97
      renderWithProviders(<Cart />, { cartValue: { items: mockCartItems, loading: false } });
      expect(screen.getByText('$1059.97')).toBeInTheDocument();
    });

    it('debe mostrar Envío de $10.00 cuando hay productos', () => {
      renderWithProviders(<Cart />, { cartValue: { items: mockCartItems, loading: false } });
      expect(screen.getByText('$10.00')).toBeInTheDocument();
    });

    it('debe renderizar el botón "Proceder al Pago"', () => {
      renderWithProviders(<Cart />, { cartValue: { items: mockCartItems, loading: false } });
      expect(screen.getByRole('button', { name: /proceder al pago/i })).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 7. Modal de Checkout
  // ----------------------------------------------------------------
  describe('Modal de Checkout', () => {
    it('debe abrir el modal al hacer clic en "Proceder al Pago"', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Cart />, { cartValue: { items: mockCartItems, loading: false } });

      await user.click(screen.getByRole('button', { name: /proceder al pago/i }));

      await waitFor(() => {
        expect(screen.getByText('Completar Compra')).toBeInTheDocument();
      });
    });

    it('debe mostrar el campo "Dirección de Envío" en el modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Cart />, { cartValue: { items: mockCartItems, loading: false } });

      await user.click(screen.getByRole('button', { name: /proceder al pago/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/dirección de envío/i)).toBeInTheDocument();
      });
    });

    it('debe mostrar el campo "Método de Pago" en el modal', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Cart />, { cartValue: { items: mockCartItems, loading: false } });

      await user.click(screen.getByRole('button', { name: /proceder al pago/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/método de pago/i)).toBeInTheDocument();
      });
    });

    it('debe mostrar las opciones de método de pago en el select', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Cart />, { cartValue: { items: mockCartItems, loading: false } });

      await user.click(screen.getByRole('button', { name: /proceder al pago/i }));

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /tarjeta de crédito/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /tarjeta de débito/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /paypal/i })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /transferencia bancaria/i })).toBeInTheDocument();
      });
    });

    it('debe cerrar el modal al hacer clic en el botón ×', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Cart />, { cartValue: { items: mockCartItems, loading: false } });

      await user.click(screen.getByRole('button', { name: /proceder al pago/i }));
      await waitFor(() => expect(screen.getByText('Completar Compra')).toBeInTheDocument());

      const closeBtn = screen.getByRole('button', { name: /×/i });
      await user.click(closeBtn);

      await waitFor(() => {
        expect(screen.queryByText('Completar Compra')).not.toBeInTheDocument();
      });
    });

    it('debe llamar a createPurchase() al confirmar la orden con dirección válida', async () => {
      const user = userEvent.setup();
      const { purchaseService } = await import('../services/apiService');
      purchaseService.createPurchase.mockResolvedValue({ success: true });

      const mockClearCart = vi.fn().mockResolvedValue({ success: true });

      renderWithProviders(<Cart />, {
        cartValue: { items: mockCartItems, loading: false, clearCart: mockClearCart },
      });

      await user.click(screen.getByRole('button', { name: /proceder al pago/i }));
      await waitFor(() => expect(screen.getByText('Completar Compra')).toBeInTheDocument());

      await user.type(
        screen.getByLabelText(/dirección de envío/i),
        'Calle 123, Ciudad, CP 10000'
      );
      await user.click(screen.getByRole('button', { name: /confirmar y crear orden/i }));

      await waitFor(() => {
        expect(purchaseService.createPurchase).toHaveBeenCalledWith(
          'credit_card',
          'Calle 123, Ciudad, CP 10000'
        );
      });
    });
  });
});
