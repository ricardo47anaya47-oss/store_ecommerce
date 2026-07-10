require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const { errorHandler } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: '*',
  credentials: false,
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor funcionando' });
});

// API v1
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Error handler
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     SERVIDOR API ECOMMERCE             ║
╠════════════════════════════════════════╣
║ 🚀 Servidor ejecutándose en            ║
║    http://localhost:${PORT}               ║
║                                        ║
║ 📦 Base de datos: proyect_ecommerce   ║
║ 👤 Usuario: root                       ║
║                                        ║
║ 📚 Rutas disponibles:                  ║
║    /api/auth       - Autenticación    ║
║    /api/products   - Productos        ║
║    /api/orders     - Órdenes          ║
║    /health         - Health check     ║
╚════════════════════════════════════════╝
  `);
});

// Manejar errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('Error no manejado:', err);
});
