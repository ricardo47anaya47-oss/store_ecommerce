import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { purchaseService } from '../services/apiService';
import Toast from '../components/Toast';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ name: user?.name || '', lastName: user?.last_name || '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Cargar compras del usuario al montar componente
  useEffect(() => {
    const loadPurchases = async () => {
      try {
        setLoading(true);
        const response = await purchaseService.getUserPurchases();
        
        if (response.success) {
          // Convertir datos del API al formato esperado
          const formattedPurchases = response.data.map(purchase => ({
            id: purchase.id,
            product: `Orden #${purchase.id}`,
            price: parseFloat(purchase.total),
            date: new Date(purchase.created_at).toLocaleDateString('es-ES'),
            status: formatStatus(purchase.status),
            rawStatus: purchase.status,
          }));
          setPurchases(formattedPurchases);
        } else {
          setError(response.message || 'Error al cargar compras');
        }
      } catch (err) {
        setError('Error al cargar compras: ' + err.message);
        setPurchases([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadPurchases();
    }
  }, [user]);

  const formatStatus = (status) => {
    const statusMap = {
      'pending': 'Pendiente',
      'processing': 'Procesando',
      'completed': 'Entregado',
      'shipped': 'En camino',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Redirigir si no hay usuario
  if (!user) {
    return (
      <div className="dashboard">
        <div className="dashboard-container">
          <p>Por favor inicia sesión para ver tu panel de control</p>
        </div>
      </div>
    );
  }

  const totalSpent = purchases.reduce((sum, order) => sum + (order.rawStatus !== 'cancelled' ? order.price : 0), 0);
  const completedOrders = purchases.filter(o => o.rawStatus === 'completed').length;
  const shippedOrders = purchases.filter(o => o.rawStatus === 'shipped').length;
  const totalOrders = purchases.filter(o => o.rawStatus !== 'cancelled').length;

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <h1>Mi Panel de Control</h1>

        {/* Welcome Card */}
        <div className="welcome-card">
          <h2>¡Bienvenido, {user.name} {user.last_name || ''}!</h2>
          <p>Aquí puedes ver tus compras, información de cuenta y más</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">□</div>
            <h3>Total de Compras</h3>
            <p className="stat-value">{totalOrders}</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">◐</div>
            <h3>Gastado Total</h3>
            <p className="stat-value">${totalSpent.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✓</div>
            <h3>Órdenes Completadas</h3>
            <p className="stat-value">{completedOrders}</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">→</div>
            <h3>En Camino</h3>
            <p className="stat-value">{shippedOrders}</p>
          </div>
        </div>

        {/* Account Information */}
        <section className="account-section">
          <h2>Información de Cuenta</h2>
          {!editMode ? (
            <>
              <div className="account-info">
                <div className="info-field">
                  <label>Nombre</label>
                  <p>{user.name}</p>
                </div>
                <div className="info-field">
                  <label>Apellido</label>
                  <p>{user.last_name || '-'}</p>
                </div>
                <div className="info-field">
                  <label>Email</label>
                  <p>{user.email}</p>
                </div>
              </div>
              <button className="edit-btn" onClick={() => {
                setEditData({ name: user.name, lastName: user.last_name || '' });
                setEditMode(true);
              }}>Editar Información</button>
            </>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              // Aquí se guardarían los cambios
              addToast('Información actualizada exitosamente', 'success');
              setEditMode(false);
            }}>
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input
                  type="text"
                  value={editData.lastName}
                  onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save">Guardar</button>
                <button type="button" className="btn-cancel" onClick={() => setEditMode(false)}>Cancelar</button>
              </div>
            </form>
          )}
        </section>

        {/* Recent Orders */}
        <section className="orders-section">
          <h2>Mis Órdenes Recientes</h2>
          {loading && <p>Cargando órdenes...</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && purchases.length === 0 && (
            <p>No tienes órdenes aún. <a href="/products">Comienza a comprar</a></p>
          )}
          {!loading && purchases.length > 0 && (
            <div className="orders-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Descripción</th>
                    <th>Total</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.product}</td>
                      <td>${order.price.toFixed(2)}</td>
                      <td>{order.date}</td>
                      <td>
                        <span className={`status status-${order.rawStatus}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <button className="view-btn" onClick={() => setSelectedOrder(order.id)}>
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="btn-primary" onClick={() => navigate('/products')}>
            Continuar Comprando
          </button>
          <button className="btn-danger" onClick={handleLogout}>Cerrar Sesión</button>
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>×</button>
              <h2>Detalles de Orden #{selectedOrder}</h2>
              <div className="order-detail-info">
                <p><strong>ID:</strong> {selectedOrder}</p>
                <p><strong>Total:</strong> ${purchases.find(o => o.id === selectedOrder)?.price.toFixed(2)}</p>
                <p><strong>Fecha:</strong> {purchases.find(o => o.id === selectedOrder)?.date}</p>
                <p><strong>Estado:</strong> {purchases.find(o => o.id === selectedOrder)?.status}</p>
              </div>
            </div>
          </div>
        )}

        <Toast toasts={toasts} setToasts={setToasts} />
      </div>
    </div>
  );
};

export default Dashboard;
