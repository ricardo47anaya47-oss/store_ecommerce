<?php

function envOrDefault($key, $default)
{
    $value = getenv($key);

    if ($value === false || $value === null || $value === '') {
        $value = $_ENV[$key] ?? $_SERVER[$key] ?? $default;
    }

    return $value;
}

/*
|--------------------------------------------------------------------------
| Configuración de base de datos
|--------------------------------------------------------------------------
*/

define(
    'DB_HOST',
    envOrDefault('DB_HOST', 'sql208.infinityfree.com')
);

define(
    'DB_USER',
    envOrDefault('DB_USER', 'if0_42533402')
);

define(
    'DB_PASS',
    envOrDefault('DB_PASS', 'nQY2doalEG6')
);

define(
    'DB_NAME',
    envOrDefault('DB_NAME', 'if0_42533402_proyecto')
);

define(
    'DB_PORT',
    (int) envOrDefault('DB_PORT', 3306)
);

/*
|--------------------------------------------------------------------------
| Configuración JWT
|--------------------------------------------------------------------------
*/

define(
    'JWT_SECRET',
    envOrDefault('JWT_SECRET', 'Y6xVf3L9zP2rQ8mT1nW4kHs7A0cBdE5FgHiJkLmNoPqRsTuVwXyZ123456789')
);

define(
    'JWT_ALGORITHM',
    envOrDefault('JWT_ALGORITHM', 'HS256')
);

/*
|--------------------------------------------------------------------------
| Manejo de errores
|--------------------------------------------------------------------------
*/

set_error_handler(function ($errno, $errstr, $errfile, $errline) {

    error_log(
        "$errstr en $errfile:$errline"
    );

    http_response_code(500);

    header('Content-Type: application/json; charset=utf-8');

    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor.'
    ]);

    exit;
});


