import React from 'react';
import './Toast.css';

const Toast = ({ toasts, setToasts }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
        >
          <div className="toast-content">
            {toast.type === 'success' && <span className="toast-icon">✓</span>}
            {toast.type === 'error' && <span className="toast-icon">✕</span>}
            {toast.type === 'info' && <span className="toast-icon">•</span>}
            {toast.type === 'warning' && <span className="toast-icon">!</span>}
            <span className="toast-message">{toast.message}</span>
          </div>
          <div className="toast-progress"></div>
        </div>
      ))}
    </div>
  );
};

export default Toast;
