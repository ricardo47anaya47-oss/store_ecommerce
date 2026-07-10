import React from 'react';
import { useProduct } from '../hooks/useProductsAPI';

const ProductDetail = ({ productId }) => {
  const { product, loading, error } = useProduct(productId);

  if (loading) return <div><h1>Cargando producto...</h1></div>;
  if (error) return <div><h1>Error: {error}</h1></div>;
  if (!product) return <div><h1>Producto no encontrado</h1></div>;

  return (
    <div className="product-detail">
      <div className="product-image">
        <img src={product.thumbnail} alt={product.title} />
      </div>
      <div className="product-info">
        <h1>{product.title}</h1>
        <p className="description">{product.description}</p>
        
        <div className="price-section">
          <span className="price">${product.price}</span>
          <span className="discount">{product.discountPercentage}% OFF</span>
        </div>

        <div className="rating-stock">
          <span className="rating">⭐ {product.rating} / 5</span>
          <span className="stock">Stock: {product.stock}</span>
        </div>

        <div className="brand-category">
          <span>Marca: {product.brand}</span>
          <span>Categoría: {product.category}</span>
        </div>

        <button className="add-to-cart-btn">Agregar al carrito</button>

        <div className="reviews">
          <h3>Reseñas:</h3>
          {product.reviews && product.reviews.length > 0 ? (
            <ul>
              {product.reviews.map((review, index) => (
                <li key={index}>
                  <strong>{review.reviewerName}:</strong> {review.comment}
                </li>
              ))}
            </ul>
          ) : (
            <p>No hay reseñas disponibles</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
