const API_URL = 'https://dummyjson.com';

export const productService = {
  // Obtener todos los productos
  getAllProducts: async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
     console.log('Response from getAllProducts:', response);
      if (!response.ok) {
        throw new Error('Error al obtener los productos');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en getAllProducts:', error);
      throw error;
    }
  },

  // Obtener un producto por ID
  getProductById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/products/${id}`);
      if (!response.ok) {
        throw new Error('Error al obtener el producto');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en getProductById:', error);
      throw error;
    }
  },

  // Buscar productos
  searchProducts: async (query) => {
    try {
      const response = await fetch(`${API_URL}/products/search?q=${query}`);
      if (!response.ok) {
        throw new Error('Error al buscar productos');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en searchProducts:', error);
      throw error;
    }
  },

  // Obtener productos por categoría
  getProductsByCategory: async (category) => {
    try {
      const response = await fetch(`${API_URL}/products/category/${category}`);
      if (!response.ok) {
        throw new Error('Error al obtener productos por categoría');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en getProductsByCategory:', error);
      throw error;
    }
  },

  // Obtener todas las categorías
  getAllCategories: async () => {
    try {
      const response = await fetch(`${API_URL}/products/categories`);
      if (!response.ok) {
        throw new Error('Error al obtener categorías');
      }
      return await response.json();
    } catch (error) {
      console.error('Error en getAllCategories:', error);
      throw error;
    }
  },
};
