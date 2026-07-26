<?php
// Configuración de base de datos
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'store_ecommerce');
define('DB_PORT', 3306);

// Configuración de JWT
define('JWT_SECRET', 'Y6xVf3L9zP2rQ8mT1nW4kHs7A0cBdE5FgHiJkLmNoPqRsTuVwXyZ123456789');
define('JWT_ALGORITHM', 'HS256');

// Manejo de errores
    set_error_handler(function ($errno, $errstr, $errfile, $errline) {

    error_log("$errstr en $errfile:$errline");

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Error interno del servidor."
    ]);

    exit;
});

?>