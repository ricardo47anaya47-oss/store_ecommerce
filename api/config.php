<?php
// ============================================================
// ARCHIVO: config.php
// ============================================================

// Credenciales de Base de Datos para InfinityFree
define('DB_HOST', 'sql110.infinityfree.com');
define('DB_USER', 'if0_42901936');
define('DB_PASS', 'pKuI8euh0Zw2CyX');
define('DB_NAME', 'if0_42901936_store_ecommerce');
define('DB_PORT', 3306);

// API de productos: DummyJSON (es la que tiene los productos visibles al cliente)
define('PRODUCT_API_BASE_URL', 'https://dummyjson.com');
define('PRODUCT_API_TIMEOUT', 15);

// API del backend local de InfinityFree para autenticación y datos del sistema
define('API_BASE_URL', 'https://stroreecommerce.infinityfreeapp.com/api');

define('JWT_SECRET', 'tu_palabra_secreta_ecommerce_123');
define('JWT_ALGORITHM', 'HS256');
?>