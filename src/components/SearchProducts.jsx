import React, { useState } from 'react';
import { useSearchProducts } from '../hooks/useProductsAPI';
import '../pages/Products.css';

const SearchProducts = () => {
  const [query, setQuery] = useState('');
  const { products, loading, error } = useSearchProducts(query);

  return (
    <div className="search-products-container">
      <div className="search-box">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <div className="error-message">Error: {error}</div>}

      {loading && query && <div>Buscando...</div>}

      {query && (
        <div className="search-results">
          <h2>Resultados de búsqueda para "{query}"</h2>
          {products.length > 0 ? (
            <div className="products-list">
              {products.map((product) => (
                <div key={product.id} className="product-card">
                  <img src={product.thumbnail} alt={product.title} />
                  <h2>{product.title}</h2>
                  <p>{product.description}</p>
                  <div className="product-info">
                    <span className="price">${product.price}</span>
                    <span className="rating">⭐ {product.rating}</span>
                  </div>
                  <button className="add-to-cart">Agregar al carrito</button>
                </div>
              ))}
            </div>
          ) : (
            <p>No se encontraron productos</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchProducts;
