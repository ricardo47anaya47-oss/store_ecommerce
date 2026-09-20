// ============================================================
// ARCHIVO: src/tests/Products.test.jsx
// Función: Pruebas unitarias de la página de Productos
// ============================================================

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Products from '../pages/Products';
import { renderWithProviders } from './helpers/renderWithProviders';

// Mock del hook de productos para controlar datos en tests
vi.mock('../hooks/useProductsAPI', () => ({
  useProducts: vi.fn(),
}));

// Mock de componentes secundarios que no son el foco de estas pruebas
vi.mock('../components/Breadcrumb', () => ({
  default: ({ items }) => <nav data-testid="breadcrumb">{items[0]?.label}</nav>,
}));
vi.mock('../components/ProductFilters', () => ({
  default: ({ onSortChange, onPriceChange, onToggle, expanded }) => (
    <div data-testid="product-filters">
      <button onClick={() => onSortChange('price-asc')}>Ordenar por precio</button>
    </div>
  ),
}));
vi.mock('../components/Toast', () => ({
  default: ({ toasts }) => (
    <div data-testid="toast-container">
      {toasts.map((t) => <div key={t.id} data-testid={`toast-${t.type}`}>{t.message}</div>)}
    </div>
  ),
}));
vi.mock('../components/Skeleton', () => ({
  default: ({ count }) => (
    <div data-testid="skeleton-loader">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} data-testid="skeleton-card" />
      ))}
    </div>
  ),
}));

// Datos de ejemplo de productos
const mockProducts = [
  {
    id: 1,
    title: 'iPhone 15 Pro',
    description: 'El último smartphone de Apple con chip A17 Pro',
    price: 999.99,
    rating: 4.8,
    stock: 50,
    thumbnail: 'https://dummyjson.com/image/1',
  },
  {
    id: 2,
    title: 'Samsung Galaxy S24',
    description: 'El flagship de Samsung con IA integrada',
    price: 799.99,
    rating: 4.5,
    stock: 30,
    thumbnail: 'https://dummyjson.com/image/2',
  },
  {
    id: 3,
    title: 'Producto Agotado',
    description: 'Este producto no tiene stock',
    price: 49.99,
    rating: 3.5,
    stock: 0,
    thumbnail: '',
  },
];

describe('Products Page', () => {
  let useProducts;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('../hooks/useProductsAPI');
    useProducts = module.useProducts;
  });

  // ----------------------------------------------------------------
  // 1. Estado de carga (Skeleton)
  // ----------------------------------------------------------------
  describe('Estado de Carga', () => {
    it('debe mostrar los skeletons mientras carga y no hay productos', () => {
      useProducts.mockReturnValue({
        products: [],
        loading: true,
        error: null,
        pagination: null,
      });

      renderWithProviders(<Products />);
      expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
      expect(screen.getAllByTestId('skeleton-card')).toHaveLength(12);
    });
  });

  // ----------------------------------------------------------------
  // 2. Estado de error
  // ----------------------------------------------------------------
  describe('Estado de Error', () => {
    it('debe mostrar el mensaje de error cuando falla la carga', () => {
      useProducts.mockReturnValue({
        products: [],
        loading: false,
        error: 'Error al conectar con el servidor',
        pagination: null,
      });

      renderWithProviders(<Products />);
      expect(screen.getByText(/error al conectar con el servidor/i)).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 3. Renderizado de tarjetas de productos
  // ----------------------------------------------------------------
  describe('Catálogo de Productos', () => {
    beforeEach(() => {
      useProducts.mockReturnValue({
        products: mockProducts,
        loading: false,
        error: null,
        pagination: { page: 1, pages: 1, total: 3, limit: 12 },
      });
    });

    it('debe renderizar el título "Nuestros Productos"', () => {
      renderWithProviders(<Products />);
      expect(screen.getByRole('heading', { name: /nuestros productos/i })).toBeInTheDocument();
    });

    it('debe renderizar el título de cada producto', () => {
      renderWithProviders(<Products />);
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
      expect(screen.getByText('Samsung Galaxy S24')).toBeInTheDocument();
    });

    it('debe mostrar el precio de cada producto', () => {
      renderWithProviders(<Products />);
      expect(screen.getByText('$999.99')).toBeInTheDocument();
      expect(screen.getByText('$799.99')).toBeInTheDocument();
    });

    it('debe mostrar el rating de cada producto', () => {
      renderWithProviders(<Products />);
      expect(screen.getByText(/4\.8 ★/)).toBeInTheDocument();
      expect(screen.getByText(/4\.5 ★/)).toBeInTheDocument();
    });

    it('debe mostrar "X unidades" para productos con stock', () => {
      renderWithProviders(<Products />);
      expect(screen.getByText('50 unidades')).toBeInTheDocument();
      expect(screen.getByText('30 unidades')).toBeInTheDocument();
    });

    it('debe mostrar "Agotado" para productos sin stock', () => {
      renderWithProviders(<Products />);
      expect(screen.getByText('Agotado')).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------------
  // 4. Selector de cantidad
  // ----------------------------------------------------------------
  describe('Selector de Cantidad', () => {
    beforeEach(() => {
      useProducts.mockReturnValue({
        products: mockProducts,
        loading: false,
        error: null,
        pagination: { page: 1, pages: 1, total: 3, limit: 12 },
      });
    });

    it('debe iniciar con cantidad 1 para cada producto', () => {
      renderWithProviders(<Products />);
      const quantityInputs = screen.getAllByRole('spinbutton');
      quantityInputs.forEach((input) => {
        expect(input).toHaveValue(1);
      });
    });

    it('debe incrementar la cantidad al hacer clic en el botón "+"', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Products />);

      // El primer par de botones corresponde al primer producto (iPhone)
      const incrementBtns = screen.getAllByText('+');
      await user.click(incrementBtns[0]);

      const quantityInputs = screen.getAllByRole('spinbutton');
      expect(quantityInputs[0]).toHaveValue(2);
    });

    it('debe decrementar la cantidad al hacer clic en el botón "−" (mínimo 1)', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Products />);

      // Primero incrementar a 2
      const incrementBtns = screen.getAllByText('+');
      await user.click(incrementBtns[0]);

      // Luego decrementar
      const decrementBtns = screen.getAllByText('−');
      await user.click(decrementBtns[0]);

      const quantityInputs = screen.getAllByRole('spinbutton');
      expect(quantityInputs[0]).toHaveValue(1);
    });

    it('NO debe bajar de 1 al hacer clic en "−" cuando ya está en 1', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Products />);

      const decrementBtns = screen.getAllByText('−');
      await user.click(decrementBtns[0]);

      const quantityInputs = screen.getAllByRole('spinbutton');
      expect(quantityInputs[0]).toHaveValue(1);
    });

    it('los botones de cantidad deben estar deshabilitados para productos agotados', () => {
      renderWithProviders(<Products />);
      // El tercer producto tiene stock 0
      const decrementBtns = screen.getAllByText('−');
      const incrementBtns = screen.getAllByText('+');
      expect(decrementBtns[2]).toBeDisabled();
      expect(incrementBtns[2]).toBeDisabled();
    });
  });

  // ----------------------------------------------------------------
  // 5. Agregar al carrito
  // ----------------------------------------------------------------
  describe('Agregar al Carrito', () => {
    beforeEach(() => {
      useProducts.mockReturnValue({
        products: mockProducts,
        loading: false,
        error: null,
        pagination: { page: 1, pages: 1, total: 3, limit: 12 },
      });
    });

    it('debe renderizar un botón "+ Agregar" por producto', () => {
      renderWithProviders(<Products />);
      const addButtons = screen.getAllByRole('button', { name: /\+ agregar/i });
      // 2 productos con stock (el 3er está agotado pero igual se renderiza)
      expect(addButtons.length).toBeGreaterThan(0);
    });

    it('debe llamar a addToCart() al hacer clic en "+ Agregar"', async () => {
      const user = userEvent.setup();
      const mockAddToCart = vi.fn().mockResolvedValue({ success: true });

      renderWithProviders(<Products />, {
        cartValue: { addToCart: mockAddToCart },
      });

      const addButtons = screen.getAllByRole('button', { name: /\+ agregar/i });
      await user.click(addButtons[0]); // iPhone 15 Pro

      await waitFor(() => {
        expect(mockAddToCart).toHaveBeenCalledWith(
          expect.objectContaining({ id: 1, title: 'iPhone 15 Pro' }),
          1
        );
      });
    });

    it('debe mostrar toast de éxito tras agregar al carrito', async () => {
      const user = userEvent.setup();
      const mockAddToCart = vi.fn().mockResolvedValue({ success: true });

      renderWithProviders(<Products />, {
        cartValue: { addToCart: mockAddToCart },
      });

      const addButtons = screen.getAllByRole('button', { name: /\+ agregar/i });
      await user.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('toast-success')).toBeInTheDocument();
      });
    });

    it('el botón "+ Agregar" debe estar deshabilitado para productos agotados', () => {
      renderWithProviders(<Products />);
      const addButtons = screen.getAllByRole('button', { name: /\+ agregar/i });
      // El tercer producto (índice 2) está agotado
      expect(addButtons[2]).toBeDisabled();
    });
  });

  // ----------------------------------------------------------------
  // 6. Paginación
  // ----------------------------------------------------------------
  describe('Paginación', () => {
    it('debe mostrar controles de paginación cuando hay más de 1 página', () => {
      useProducts.mockReturnValue({
        products: mockProducts,
        loading: false,
        error: null,
        pagination: { page: 1, pages: 3, total: 36, limit: 12 },
      });

      renderWithProviders(<Products />);
      expect(screen.getByRole('button', { name: /← anterior/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /siguiente →/i })).toBeInTheDocument();
    });

    it('el botón "← Anterior" debe estar deshabilitado en la primera página', () => {
      useProducts.mockReturnValue({
        products: mockProducts,
        loading: false,
        error: null,
        pagination: { page: 1, pages: 3, total: 36, limit: 12 },
      });

      renderWithProviders(<Products />);
      expect(screen.getByRole('button', { name: /← anterior/i })).toBeDisabled();
    });

    it('el botón "Siguiente →" debe estar deshabilitado en la última página', () => {
      useProducts.mockReturnValue({
        products: mockProducts,
        loading: false,
        error: null,
        pagination: { page: 3, pages: 3, total: 36, limit: 12 },
      });

      renderWithProviders(<Products />);
      expect(screen.getByRole('button', { name: /siguiente →/i })).toBeDisabled();
    });

    it('NO debe mostrar paginación cuando solo hay 1 página', () => {
      useProducts.mockReturnValue({
        products: mockProducts,
        loading: false,
        error: null,
        pagination: { page: 1, pages: 1, total: 3, limit: 12 },
      });

      renderWithProviders(<Products />);
      expect(screen.queryByRole('button', { name: /← anterior/i })).not.toBeInTheDocument();
    });

    it('debe mostrar el número de página actual', () => {
      useProducts.mockReturnValue({
        products: mockProducts,
        loading: false,
        error: null,
        pagination: { page: 2, pages: 5, total: 60, limit: 12 },
      });

      renderWithProviders(<Products />);
      expect(screen.getByText(/página 2 de 5/i)).toBeInTheDocument();
    });
  });
});
