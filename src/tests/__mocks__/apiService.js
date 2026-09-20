// ============================================================
// ARCHIVO: src/tests/__mocks__/apiService.js
// Función: Mock completo de todos los servicios API
// ============================================================

import { vi } from 'vitest';

// ---------- authService ----------
export const authService = {
  login: vi.fn(),
  register: vi.fn(),
  profile: vi.fn(),
};

// ---------- productService ----------
export const productService = {
  getAll: vi.fn(),
  getById: vi.fn(),
  search: vi.fn(),
  getByCategory: vi.fn(),
  getCategories: vi.fn(),
};

// ---------- cartService ----------
export const cartService = {
  getCart: vi.fn(),
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
};

// ---------- purchaseService ----------
export const purchaseService = {
  createPurchase: vi.fn(),
  getUserPurchases: vi.fn(),
  getPurchaseById: vi.fn(),
  getAllPurchases: vi.fn(),
  getPurchaseStats: vi.fn(),
  updatePurchaseStatus: vi.fn(),
};
