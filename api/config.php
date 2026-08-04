<?php
// Configuración de base de datos
define('DB_HOST', getenv('DB_HOST') ?: 'sql208.infinityfree.com');
define('DB_USER', getenv('DB_USER') ?: 'if0_42533402');
define('DB_PASS', getenv('DB_PASS') ?: 'nQY2doalEG6');
define('DB_NAME', getenv('DB_NAME') ?: 'if0_42533402_proyecto');
define('DB_PORT', getenv('DB_PORT') ?: 3306);

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