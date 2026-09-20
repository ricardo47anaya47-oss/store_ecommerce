// ============================================================
// ARCHIVO: src/tests/helpers/renderWithProviders.jsx
// Función: Helper para renderizar componentes con todos los providers necesarios
// ============================================================

import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { CartContext } from '../../context/CartContext';

/**
 * Valores por defecto del contexto de autenticación (usuario no autenticado)
 */
const defaultAuthValue = {
  user: null,
  loading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
};

/**
 * Valores por defecto del contexto del carrito (vacío)
 */
const defaultCartValue = {
  items: [],
  loading: false,
  error: null,
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
  loadCart: vi.fn(),
  getTotal: vi.fn(() => 0),
  getItemCount: vi.fn(() => 0),
};

/**
 * Renderiza un componente envuelto en MemoryRouter, AuthContext y CartContext.
 *
 * @param {React.ReactElement} ui - El componente a renderizar
 * @param {object} options
 * @param {string}   options.initialRoute - Ruta inicial del MemoryRouter (default: '/')
 * @param {object}   options.authValue    - Valores a inyectar en AuthContext
 * @param {object}   options.cartValue    - Valores a inyectar en CartContext
 */
export function renderWithProviders(
  ui,
  {
    initialRoute = '/',
    authValue = {},
    cartValue = {},
  } = {}
) {
  const mergedAuth = { ...defaultAuthValue, ...authValue };
  const mergedCart = { ...defaultCartValue, ...cartValue };

  function Wrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthContext.Provider value={mergedAuth}>
          <CartContext.Provider value={mergedCart}>
            {children}
          </CartContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  }

  return render(ui, { wrapper: Wrapper });
}
