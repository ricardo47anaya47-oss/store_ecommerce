// ============================================================
// ARCHIVO: src/tests/setup.js
// Función: Configuración global para la suite de pruebas
// ============================================================

import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Limpiar el DOM después de cada prueba para evitar fugas de estado
afterEach(() => {
  cleanup();
});

// Mock global de CSS imports (evita errores al importar .css en tests)
vi.mock('*.css', () => ({}));

// Mock de window.scrollTo (no disponible en jsdom)
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock de localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});
