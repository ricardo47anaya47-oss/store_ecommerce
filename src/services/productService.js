export const productService = {

  getAll: async (page = 1, limit = 12) => {
    return apiCall(`/products?page=${page}&limit=${limit}`, {
      method: 'GET'
    });
  },

  getById: async (id) => {
    return apiCall(`/products/${id}`, {
      method: 'GET'
    });
  },

  search: async (query) => {
    return apiCall(
      `/products/search?q=${encodeURIComponent(query)}`,
      {
        method: 'GET'
      }
    );
  },

  getByCategory: async (category, page = 1, limit = 12) => {
    return apiCall(
      `/products/category/${encodeURIComponent(category)}?page=${page}&limit=${limit}`,
      {
        method: 'GET'
      }
    );
  },

  getCategories: async () => {
    return apiCall('/products/categories/list', {
      method: 'GET'
    });
  }
};

/*export const productService = {
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
}; */
