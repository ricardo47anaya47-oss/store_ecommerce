<?php
// Configuración de base de datos
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'store_ecommerce');
define('DB_PORT', 3306);

// Configuración de JWT
define('JWT_SECRET', 'tu_clave_secreta_super_segura_cambiar_en_produccion');
define('JWT_ALGORITHM', 'HS256');

// Manejo de errores
ini_set('display_errors', 0);
error_reporting(E_ALL);

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor',
        'error' => $errstr
    ]);
    exit;
});

// Configuración CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Configuración de sesión
session_start();
?>