import React, { createContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/apiService';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar el carrito cuando se monta el componente
  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartService.getCart();
      if (response.success) {
        setItems(response.data.items || []);
      }
    } catch (err) {
      // Silenciosamente fallar si no hay carrito o no está autenticado
      console.log('Carrito no disponible');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadCart();
    }
  }, [loadCart]);

  // Agregar producto al carrito
  const addToCart = useCallback(async (product, quantity = 1) => {
    try {
      const productId = parseInt(product.id) || product.id;
      const price = parseFloat(product.price) || 0;
      const productName = product.title || product.name || 'Producto';
      const image = product.thumbnail || product.image || '';
      
      const response = await cartService.addToCart(productId, quantity, price, productName, image);

      if (response.success) {
        // Actualizar el estado local con el nuevo producto o cantidad
        setItems(prevItems => {
          const existingItem = prevItems.find(item => item.product_id === productId);
          if (existingItem) {
            return prevItems.map(item =>
              item.product_id === productId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            return [...prevItems, {
              id: Date.now(), // ID temporal
              product_id: productId,
              name: productName,
              image: image,
              price: price,
              quantity: quantity
            }];
          }
        });
        return { success: true, message: 'Producto agregado al carrito' };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMessage = 'Error al agregar al carrito: ' + err.message;
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, []);

  // Remover producto del carrito
  const removeFromCart = useCallback(async (cartDetailId) => {
    try {
      const response = await cartService.removeFromCart(cartDetailId);
      if (response.success) {
        setItems(prevItems => prevItems.filter(item => item.id !== cartDetailId));
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, []);

  // Actualizar cantidad de un producto
  const updateQuantity = useCallback(async (cartDetailId, quantity) => {
    try {
      if (quantity <= 0) {
        return removeFromCart(cartDetailId);
      }

      const response = await cartService.updateQuantity(cartDetailId, quantity);
      if (response.success) {
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === cartDetailId ? { ...item, quantity } : item
          )
        );
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, [removeFromCart]);

  // Limpiar el carrito
  const clearCart = useCallback(async () => {
    try {
      const response = await cartService.clearCart();
      if (response.success) {
        setItems([]);
        return { success: true };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  }, []);

  // Calcular el total del carrito
  const getTotal = useCallback(() => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [items]);

  // Contar el número total de items
  const getItemCount = useCallback(() => {
    return items.reduce((count, item) => count + item.quantity, 0);
  }, [items]);

  const value = {
    items,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    loadCart,
    getTotal,
    getItemCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
