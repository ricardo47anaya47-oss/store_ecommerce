import React, { useState, useContext, useMemo } from 'react';
import { useProducts } from '../hooks/useProductsAPI';
import { CartContext } from '../context/CartContext';
import Breadcrumb from '../components/Breadcrumb';
import ProductFilters from '../components/ProductFilters';
import Toast from '../components/Toast';
import Skeleton from '../components/Skeleton';
import './Products.css';

const Products = () => {
  const [page, setPage] = useState(1);
  const [quantities, setQuantities] = useState({});
  const [toasts, setToasts] = useState([]);
  const [sortBy, setSortBy] = useState('default');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const { addToCart } = useContext(CartContext);

  const { products, loading, error, pagination } = useProducts(page, 12);

  // Filtrar y ordenar productos
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(p => {
      const price = parseFloat(p.price) || 0;
      return price >= minPrice && price <= maxPrice;
    });

    switch (sortBy) {
      case 'price-asc':
        return filtered.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
      case 'price-desc':
        return filtered.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
      case 'rating':
        return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest':
        return filtered.reverse();
      default:
        return filtered;
    }
  }, [products, sortBy, minPrice, maxPrice]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const handleQuantityChange = (productId, delta) => {
    const id = String(productId);
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, (prev[id] || 1) + delta)
    }));
  };

  const handleAddToCart = async (product) => {
    try {
      const quantity = quantities[String(product.id)] || 1;
      const response = await addToCart(product, quantity);
      
      if (response.success) {
        addToast(
          `${product.title || product.name} agregado al carrito (cantidad: ${quantity})`,
          'success'
        );
        setQuantities(prev => ({
          ...prev,
          [String(product.id)]: 1
        }));
      } else {
        addToast(response.message || 'Error al agregar al carrito', 'error');
      }
    } catch (err) {
      addToast('Error al agregar al carrito: ' + err.message, 'error');
    }
  };

  const goToPage = (newPage) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  if (loading && products.length === 0) {
    return (
      <div className="products-container">
        <Breadcrumb items={[{ label: 'Productos' }]} />
        <h1>Nuestros Productos</h1>
        <div className="products-list">
          <Skeleton variant="product" count={12} />
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="products-container">
        <Breadcrumb items={[{ label: 'Productos' }]} />
        <h1>Error: {error}</h1>
      </div>
    );
  }

  const totalPages = pagination?.pages || 1;

  return (
    <div className="products-container">
      <Breadcrumb items={[{ label: 'Productos' }]} />
      <h1>Nuestros Productos</h1>

      {/* Filtros y Ordenamiento */}
      <ProductFilters
        sortBy={sortBy}
        onSortChange={setSortBy}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onPriceChange={(min, max) => {
          setMinPrice(min);
          setMaxPrice(max);
          setPage(1);
        }}
        expanded={filtersExpanded}
        onToggle={() => setFiltersExpanded(!filtersExpanded)}
      />

      {/* Productos */}
      {filteredAndSortedProducts.length > 0 ? (
        <div className="products-list">
          {filteredAndSortedProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img 
                  src={product.thumbnail || product.image || 'https://placehold.co/300x300?text=No+Image'} 
                  alt={product.title || product.name}
                  className="product-img"
                />
                <div className="product-overlay">
                  <span className="overlay-text">Ver detalles</span>
                </div>
              </div>
              
              <div className="product-body">
                <h2 className="product-name">{product.title || product.name}</h2>
                <p className="product-description">{product.description}</p>
                
                <div className="product-info">
                  <div className="product-price">
                    ${parseFloat(product.price).toFixed(2)}
                  </div>
                  
                  {product.rating && (
                    <div className="product-rating">
                      <span className="stars-count">{product.rating.toFixed(1)} ★</span>
                    </div>
                  )}
                </div>

                <div className="product-stock">
                  Stock: <span className={parseInt(product.stock) > 0 ? 'in-stock' : 'out-stock'}>
                    {parseInt(product.stock) > 0 ? `${product.stock} unidades` : 'Agotado'}
                  </span>
                </div>
              </div>

              <div className="product-footer">
                <div className="quantity-selector">
                  <button 
                    className="qty-btn"
                    onClick={() => handleQuantityChange(product.id, -1)}
                    disabled={parseInt(product.stock) === 0}
                  >
                    −
                  </button>
                  <input 
                    type="number" 
                    className="qty-input"
                    value={quantities[String(product.id)] || 1}
                    onChange={(e) => setQuantities(prev => ({
                      ...prev,
                      [String(product.id)]: Math.max(1, parseInt(e.target.value) || 1)
                    }))}
                    disabled={parseInt(product.stock) === 0}
                  />
                  <button 
                    className="qty-btn"
                    onClick={() => handleQuantityChange(product.id, 1)}
                    disabled={parseInt(product.stock) === 0}
                  >
                    +
                  </button>
                </div>

                <button 
                  className="add-to-cart-btn"
                  onClick={() => handleAddToCart(product)}
                  disabled={parseInt(product.stock) === 0 || loading}
                >
                  + Agregar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-products">
          <p>No hay productos que coincidan con tus filtros</p>
          <button 
            className="reset-filters-btn"
            onClick={() => {
              setSortBy('default');
              setMinPrice(0);
              setMaxPrice(1000);
            }}
          >
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && filteredAndSortedProducts.length > 0 && (
        <div className="pagination">
          <button 
            className="pagination-btn"
            onClick={() => goToPage(page - 1)}
            disabled={page === 1}
          >
            ← Anterior
          </button>

          <div className="pagination-info">
            Página {page} de {totalPages}
          </div>

          <button 
            className="pagination-btn"
            onClick={() => goToPage(page + 1)}
            disabled={page === totalPages}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Toasts */}
      <Toast toasts={toasts} setToasts={setToasts} />
    </div>
  );
};

export default Products;
