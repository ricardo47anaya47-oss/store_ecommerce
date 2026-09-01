const DEFAULT_API_URL =
  window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1')
    ? 'http://localhost/store_ecommerce/api'
    : 'https://store-ecommerce.infinityfree.me/api';

const API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '');

const getToken = () => localStorage.getItem("token");

const apiCall = async (endpoint, options = {}) => {
  const headers = {
    ...(options.headers || {}),
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const text = await response.text();

    let data = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(
        `Respuesta inválida del servidor:\n${text}`
      );
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      throw new Error(
        data.message || `Error HTTP ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error("API:", error);

    return {
      success: false,
      message: error.message || "Error de conexión con la API",
    };
  }
};

// Product Services
export const productService = {
  getAll: async (page = 1, limit = 12) => {
    return apiCall(`/products?page=${page}&limit=${limit}`, {
      method: "GET",
    });
  },

  getById: async (id) => {
    return apiCall(`/products/${id}`, {
      method: "GET",
    });
  },

  search: async (query) => {
    return apiCall(
      `/products/search?q=${encodeURIComponent(query)}`,
      {
        method: "GET",
      }
    );
  },

  getByCategory: async (category, page = 1, limit = 12) => {
    return apiCall(
      `/products/category/${encodeURIComponent(category)}?page=${page}&limit=${limit}`,
      {
        method: "GET",
      }
    );
  },

  getCategories: async () => {
    return apiCall("/products/categories/list", {
      method: "GET",
    });
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