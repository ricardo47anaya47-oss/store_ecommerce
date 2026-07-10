import React, { useState, useEffect } from 'react';
import { purchaseService } from '../services/apiService';
import './AdminPanel.css';

export default function AdminPanel() {
  const [purchases, setPurchases] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [purchasesData, statsData] = await Promise.all([
          purchaseService.getAllPurchases(),
          purchaseService.getPurchaseStats(),
        ]);

        if (purchasesData.success) {
          setPurchases(purchasesData.data);
        } else {
          setError(purchasesData.message);
        }

        if (statsData.success) {
          setStats(statsData.data);
        }
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusChange = async (purchaseId, newStatus) => {
    try {
      const response = await purchaseService.updatePurchaseStatus(purchaseId, newStatus);
      
      if (response.success) {
        // Actualizar la lista local
        setPurchases(purchases.map(p => 
          p.id === purchaseId ? { ...p, status: newStatus } : p
        ));

        if (selectedPurchase && selectedPurchase.id === purchaseId) {
          setSelectedPurchase({ ...selectedPurchase, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleViewDetails = (purchase) => {
    setSelectedPurchase(purchase);
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
    return <div className="admin-container"><p>Cargando...</p></div>;
  }

  return (
    <main className="admin-container">
      <h1>Panel de Administración</h1>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">□</div>
            <div className="stat-content">
              <h3>Total de Órdenes</h3>
              <p className="stat-value">{stats.totalOrders}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">◐</div>
            <div className="stat-content">
              <h3>Ingresos Totales</h3>
              <p className="stat-value">${parseFloat(stats.totalRevenue || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">○</div>
            <div className="stat-content">
              <h3>Órdenes Pendientes</h3>
              <p className="stat-value">{stats.pendingOrders}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✓</div>
            <div className="stat-content">
              <h3>Órdenes Completadas</h3>
              <p className="stat-value">{stats.completedOrders}</p>
            </div>
          </div>
        </div>
      )}

      <div className="purchases-section">
        <h2>Todas las Órdenes</h2>
        
        {purchases.length === 0 ? (
          <p className="no-purchases">No hay órdenes registradas.</p>
        ) : (
          <div className="purchases-table-wrapper">
            <table className="purchases-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(purchase => (
                  <tr key={purchase.id}>
                    <td className="purchase-id">#{purchase.id}</td>
                    <td>Usuario {purchase.user_id}</td>
                    <td className="purchase-total">${parseFloat(purchase.total).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${getStatusColor(purchase.status)}`}>
                        {getStatusLabel(purchase.status)}
                      </span>
                    </td>
                    <td>{new Date(purchase.created_at).toLocaleDateString('es-ES')}</td>
                    <td className="action-buttons">
                      <button 
                        className="btn-small btn-view"
                        onClick={() => handleViewDetails(purchase)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPurchase && (
        <div className="modal-overlay" onClick={() => setSelectedPurchase(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedPurchase(null)}>×</button>
            <h2>Detalles de la Orden #{selectedPurchase.id}</h2>
            
            <div className="order-details">
              <div className="detail-section">
                <h4>Información</h4>
                <p><strong>Usuario ID:</strong> {selectedPurchase.user_id}</p>
                <p><strong>Fecha:</strong> {new Date(selectedPurchase.created_at).toLocaleDateString('es-ES')}</p>
                <p><strong>Método de Pago:</strong> {selectedPurchase.payment_method}</p>
                
                <div className="status-change">
                  <label>
                    <strong>Cambiar Estado:</strong>
                  </label>
                  <select 
                    value={selectedPurchase.status}
                    onChange={(e) => handleStatusChange(selectedPurchase.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="processing">En proceso</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="detail-section">
                <h4>Total de la Orden</h4>
                <p className="total-amount">${parseFloat(selectedPurchase.total).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
