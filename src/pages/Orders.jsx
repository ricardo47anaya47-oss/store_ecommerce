import React, { useState, useEffect } from 'react';
import { purchaseService } from '../services/apiService';
import './Orders.css';

export default function Orders() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const response = await purchaseService.getUserPurchases();
        
        if (response.success) {
          setPurchases(response.data);
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

    fetchPurchases();
  }, []);

  const handleViewDetails = async (purchaseId) => {
    try {
      const response = await purchaseService.getPurchaseById(purchaseId);
      if (response.success) {
        setSelectedPurchase(response.data);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'processing':
        return 'blue';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'processing':
        return 'En proceso';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="orders-container"><p>Cargando órdenes...</p></div>;
  }

  if (error) {
    return <div className="orders-container"><p className="error">Error: {error}</p></div>;
  }

  return (
    <main className="orders-container">
      <h1>Mis Órdenes de Compra</h1>
      
      {purchases.length === 0 ? (
        <p className="no-orders">No tienes órdenes de compra aún.</p>
      ) : (
        <div className="orders-list">
          {purchases.map(purchase => (
            <div key={purchase.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Orden #{purchase.id}</h3>
                  <p className="order-date">
                    {new Date(purchase.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="order-status">
                  <span className={`status-badge status-${getStatusColor(purchase.status)}`}>
                    {getStatusLabel(purchase.status)}
                  </span>
                </div>
              </div>
              <div className="order-body">
                <p className="order-total">Total: ${parseFloat(purchase.total).toFixed(2)}</p>
                <p className="order-method">Método: {purchase.payment_method === 'credit_card' ? 'Tarjeta de Crédito' : purchase.payment_method}</p>
              </div>
              <div className="order-footer">
                <button 
                  className="btn-details"
                  onClick={() => handleViewDetails(purchase.id)}
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPurchase && (
        <div className="modal-overlay" onClick={() => setSelectedPurchase(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPurchase(null)}>×</button>
            <h2>Detalles de la Orden #{selectedPurchase.id}</h2>
            
            <div className="order-details">
              <div className="detail-section">
                <h4>Información General</h4>
                <p><strong>Estado:</strong> {getStatusLabel(selectedPurchase.status)}</p>
                <p><strong>Fecha:</strong> {new Date(selectedPurchase.created_at).toLocaleDateString('es-ES')}</p>
                <p><strong>Método de Pago:</strong> {selectedPurchase.payment_method === 'credit_card' ? 'Tarjeta de Crédito' : selectedPurchase.payment_method}</p>
                {selectedPurchase.shipping_address && (
                  <p><strong>Dirección de Envío:</strong> {selectedPurchase.shipping_address}</p>
                )}
              </div>

              <div className="detail-section">
                <h4>Productos</h4>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Precio</th>
                      <th>Cantidad</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPurchase.items && selectedPurchase.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.product_name}</td>
                        <td>${parseFloat(item.price).toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td>${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="detail-section total-section">
                <h4>Total</h4>
                <p className="total-amount">${parseFloat(selectedPurchase.total).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
