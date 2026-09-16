import { useEffect, useState } from 'react';

const API_URL = 'https://dummyjson.com';

const fetchJson = async (url) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error al cargar datos desde ${url}`);
  }

  return response.json();
};

export const useProducts = (page = 1, limit = 12) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page,
    limit,
    total: 0,
    pages: 1,
  });

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const skip = (page - 1) * limit;
        const data = await fetchJson(
          `${API_URL}/products?limit=${limit}&skip=${skip}`
        );

        if (!isMounted) return;

        setProducts(data.products || []);
        setPagination({
          page,
          limit,
          total: data.total || 0,
          pages: Math.ceil((data.total || 0) / limit) || 1,
        });
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'No se pudieron cargar los productos');
        setProducts([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [page, limit]);

  return { products, loading, error, pagination };
};

export const useProduct = (productId) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(Boolean(productId));
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (!productId) {
      setProduct(null);
      setLoading(false);
      setError(null);
      return;
    }

    const loadProduct = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchJson(`${API_URL}/products/${productId}`);

        if (!isMounted) return;

        setProduct(data);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'No se pudo cargar el producto');
        setProduct(null);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  return { product, loading, error };
};

export const useSearchProducts = (query = '') => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const normalizedQuery = query.trim();

    if (!normalizedQuery || normalizedQuery.length < 2) {
      setProducts([]);
      setLoading(false);
      setError(null);
      return;
    }

    const searchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchJson(
          `${API_URL}/products/search?q=${encodeURIComponent(normalizedQuery)}`
        );

        if (!isMounted) return;

        setProducts(data.products || []);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'No se pudieron buscar los productos');
        setProducts([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    searchProducts();

    return () => {
      isMounted = false;
    };
  }, [query]);

  return { products, loading, error };
};
