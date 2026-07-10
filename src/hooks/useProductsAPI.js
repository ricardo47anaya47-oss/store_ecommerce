import { useState, useEffect } from 'react';
import { productService } from '../services/apiService';

export const useProducts = (page = 1, limit = 12) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await productService.getAll(page, limit);
        if (response.success) {
          setProducts(response.data);
          setPagination(response.pagination);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, limit]);

  return { products, loading, error, pagination };
};

export const useProduct = (id) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await productService.getById(id);
        if (response.success) {
          setProduct(response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  return { product, loading, error };
};

export const useSearchProducts = (query) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const searchProducts = async () => {
      if (!query.trim()) {
        setProducts([]);
        return;
      }

      try {
        setLoading(true);
        const response = await productService.search(query);
        if (response.success) {
          setProducts(response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchProducts, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { products, loading, error };
};

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await productService.getCategories();
        if (response.success) {
          setCategories(response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};

export const useProductsByCategory = (category, page = 1, limit = 12) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!category) {
        setProducts([]);
        return;
      }

      try {
        setLoading(true);
        const response = await productService.getByCategory(category, page, limit);
        if (response.success) {
          setProducts(response.data);
          setPagination(response.pagination);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, page, limit]);

  return { products, loading, error, pagination };
};
