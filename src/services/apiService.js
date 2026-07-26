const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost/store_ecommerce/api";

const getToken = () => localStorage.getItem("token");

const apiCall = async (endpoint, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    const text = await response.text();

    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Respuesta inválida del servidor:\n${text}`);
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      throw new Error(data.message || "Error del servidor");
    }

    return data;
  } catch (error) {
    console.error("API:", error);

    return {
      success: false,
      message: error.message
    };
  }
};

// Product Services
export const productService = {
  getAll: async (page = 1, limit = 12) => {
    try {
      const skip = (page - 1) * limit;
      const response = await fetch(`https://dummyjson.com/products?skip=${skip}&limit=${limit}`);
      const data = await response.json();
      
      return {
        success: true,
        data: data.products,
        pagination: {
          page: page,
          limit: limit,
          total: data.total,
          pages: Math.ceil(data.total / limit)
        }
      };
    } catch (err) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  getById: async (id) => {
    try {
      const response = await fetch(`https://dummyjson.com/products/${id}`);
      const data = await response.json();
      
      if (data.id) {
        return {
          success: true,
          data: data
        };
      } else {
        return {
          success: false,
          message: 'Producto no encontrado'
        };
      }
    } catch (err) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  search: async (query) => {
    try {
      const response = await fetch(`https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      return {
        success: true,
        data: data.products,
        pagination: {
          page: 1,
          limit: data.products.length,
          total: data.total,
          pages: 1
        }
      };
    } catch (err) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  getByCategory: async (category, page = 1, limit = 12) => {
    try {
      const response = await fetch(`https://dummyjson.com/products/category/${encodeURIComponent(category)}`);
      const data = await response.json();
      
      const skip = (page - 1) * limit;
      const paginatedProducts = data.products.slice(skip, skip + limit);
      
      return {
        success: true,
        data: paginatedProducts,
        pagination: {
          page: page,
          limit: limit,
          total: data.products.length,
          pages: Math.ceil(data.products.length / limit)
        }
      };
    } catch (err) {
      return {
        success: false,
        message: err.message
      };
    }
  },

  getCategories: async () => {
    try {
      const response = await fetch('https://dummyjson.com/products/categories');
      const categories = await response.json();
      
      return {
        success: true,
        data: categories
      };
    } catch (err) {
      return {
        success: false,
        message: err.message
      };
    }
  },
};

// Cart Services
export const cartService = {
  getCart: async () => {
    return apiCall('/cart', {
      method: 'GET',
    });
  },

  addToCart: async (productId, quantity = 1, price = 0, productName = '', image = '') => {
    return apiCall('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, price, productName, image }),
    });
  },

  removeFromCart: async (cartDetailId) => {
    return apiCall('/cart/remove', {
      method: 'POST',
      body: JSON.stringify({ cartDetailId }),
    });
  },

  updateQuantity: async (cartDetailId, quantity) => {
    return apiCall('/cart/update', {
      method: 'POST',
      body: JSON.stringify({ cartDetailId, quantity }),
    });
  },

  clearCart: async () => {
    return apiCall('/cart/clear', {
      method: 'POST',
    });
  },
};

// Purchase Services
export const purchaseService = {
  createPurchase: async (paymentMethod = 'credit_card', shippingAddress = '') => {
    return apiCall('/purchases/create', {
      method: 'POST',
      body: JSON.stringify({ paymentMethod, shippingAddress, status: 'pending' }),
    });
  },

  getUserPurchases: async () => {
    return apiCall('/purchases', {
      method: 'GET',
    });
  },

  getPurchaseById: async (id) => {
    return apiCall(`/purchases/${id}`, {
      method: 'GET',
    });
  },

  getAllPurchases: async () => {
    return apiCall('/purchases/admin/list', {
      method: 'GET',
    });
  },

  getPurchaseStats: async () => {
    return apiCall('/purchases/admin/stats', {
      method: 'GET',
    });
  },

  updatePurchaseStatus: async (purchaseId, status) => {
    return apiCall('/purchases/admin/update-status', {
      method: 'POST',
      body: JSON.stringify({ purchaseId, status }),
    });
  },
};


// Authentication Services

export const authService = {
  register: async (userData) => {
    return apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials) => {
    return apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  profile: async () => {
    return apiCall("/auth/profile", {
      method: "GET",
    });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};