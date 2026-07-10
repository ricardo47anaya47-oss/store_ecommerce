import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { purchaseService } from '../services/apiService';
import Toast from '../components/Toast';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { items: cartItems, removeFromCart, updateQuantity, clearCart, loading } = useContext(CartContext);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [creatingOrder, setCreatingOrder] = useState(false);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const handleRemoveItem = async (cartDetailId) => {
    await removeFromCart(cartDetailId);
  };

  const handleUpdateQuantity = async (cartDetailId, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(cartDetailId);
      return;
    }
    await updateQuantity(cartDetailId, quantity);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!shippingAddress.trim()) {
      addToast('Por favor ingresa una dirección de envío', 'warning');
      return;
    }

    try {
      setCreatingOrder(true);
      const response = await purchaseService.createPurchase(
        paymentMethod,
        shippingAddress
      );

      if (response.success) {
        addToast('¡Orden creada exitosamente!', 'success');
        await clearCart();
        setShowCheckoutForm(false);
        setTimeout(() => navigate('/orders'), 1500);
      } else {
        addToast('Error: ' + (response.message || 'No se pudo crear la orden'), 'error');
      }
    } catch (err) {
      addToast('Error al crear la orden: ' + err.message, 'error');
      console.error('Error:', err);
    } finally {
      setCreatingOrder(false);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 10 : 0;
  const tax = subtotal > 0 ? subtotal * 0.08 : 0;
  const total = subtotal + shipping + tax;

  if (loading) {
    return (
      <div className="cart-container">
        <h1>Carrito de Compras</h1>
        <p>Cargando carrito...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-container">
        <h1>Carrito de Compras</h1>
        <p className="error">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>Carrito de Compras</h1>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>Tu carrito está vacío</p>
          <Link to="/products" className="continue-shopping">
            Continuar comprando
          </Link>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            <h2>Tus artículos ({cartItems.length})</h2>
            {cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                {item.image && (
                  <img src={item.image} alt={item.name} className="item-image" />
                )}
                <div className="item-info">
                  <h3>{item.name}</h3>
                  <p>${parseFloat(item.price).toFixed(2)}</p>
                </div>
                <div className="item-quantity">
                  <label>Cantidad:</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                  />
                </div>
                <div className="item-total">
                  <p>${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => handleRemoveItem(item.id)}
                  title="Eliminar del carrito"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Resumen del Pedido</h2>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Envío:</span>
              <span>${shipping.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Impuestos (8%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <button 
              className="checkout-btn"
              onClick={() => setShowCheckoutForm(true)}
            >
              Proceder al Pago
            </button>
            <Link to="/products" className="continue-shopping-btn">
              Continuar Comprando
            </Link>
          </div>
        </div>
      )}

      {showCheckoutForm && (
        <div className="modal-overlay" onClick={() => setShowCheckoutForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => setShowCheckoutForm(false)}
            >
              ×
            </button>
            <h2>Completar Compra</h2>

            <form onSubmit={handleCheckout}>
              <div className="form-group">
                <label htmlFor="shipping">Dirección de Envío *</label>
                <textarea
                  id="shipping"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Calle, número, apartamento, ciudad, código postal"
                  required
                  disabled={creatingOrder}
                />
              </div>

              <div className="form-group">
                <label htmlFor="payment">Método de Pago *</label>
                <select
                  id="payment"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={creatingOrder}
                >
                  <option value="credit_card">Tarjeta de Crédito</option>
                  <option value="debit_card">Tarjeta de Débito</option>
                  <option value="paypal">PayPal</option>
                  <option value="bank_transfer">Transferencia Bancaria</option>
                </select>
              </div>

              <div className="order-preview">
                <h4>Resumen del Pedido</h4>
                <p>Subtotal: <strong>${subtotal.toFixed(2)}</strong></p>
                <p>Envío: <strong>${shipping.toFixed(2)}</strong></p>
                <p>Impuestos: <strong>${tax.toFixed(2)}</strong></p>
                <p className="order-total">Total: <strong>${total.toFixed(2)}</strong></p>
              </div>

              <button 
                type="submit"
                className="submit-btn"
                disabled={creatingOrder}
              >
                {creatingOrder ? 'Procesando...' : 'Confirmar y Crear Orden'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      <Toast toasts={toasts} setToasts={setToasts} />
    </div>
  );
};

export default Cart;
