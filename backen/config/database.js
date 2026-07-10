const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'store_ecommerce',
  port: process.env.DB_PORT || 5173,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
});

// Probar la conexión
pool.getConnection().then((connection) => {
  console.log('✅ Conectado a la base de datos MySQL');
  connection.release();
}).catch((error) => {
  console.error('❌ Error conectando a la base de datos:', error.message);
  process.exit(1);
});

module.exports = pool;