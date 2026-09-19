<?php

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = array();
        foreach ($_SERVER as $name => $value) {
            // Reconstruir cabeceras HTTP convencionales
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
            
        // Extraer la cabecera de Autorización JWT si viene en REDIRECT_HTTP_AUTHORIZATION
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $headers['Authorization'] = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $headers['Authorization'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        
        return $headers;
    }
}

// Determinar si la ejecución es en entorno local (XAMPP / localhost) o remoto
$serverName = $_SERVER['SERVER_NAME'] ?? '';
$httpHost = $_SERVER['HTTP_HOST'] ?? '';
$isLocal = in_array($serverName, ['localhost', '127.0.0.1']) ||
           strpos($httpHost, 'localhost') !== false ||
           strpos($httpHost, '127.0.0.1') !== false ||
           (php_sapi_name() === 'cli-server');

if ($isLocal) {
    // Configuración local para XAMPP
    define('DB_HOST', 'localhost');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_NAME', 'proyect_ecommerce');
    define('DB_PORT', 3306);
    define('API_BASE_URL', 'http://localhost/store_ecommerce/api');
} else {
    // Credenciales de Base de Datos para InfinityFree
    define('DB_HOST', 'sql110.infinityfree.com');
    define('DB_USER', 'if0_42901936');
    define('DB_PASS', 'pKuI8euh0Zw2CyX');
    define('DB_NAME', 'if0_42901936_store_ecommerce');
    define('DB_PORT', 3306);
    define('API_BASE_URL', 'https://stroreecommerce.infinityfreeapp.com/api');
}

// API de productos: DummyJSON (es la que tiene los productos visibles al cliente)
define('PRODUCT_API_BASE_URL', 'https://dummyjson.com');
define('PRODUCT_API_TIMEOUT', 15);

define('JWT_SECRET', 'tu_palabra_secreta_ecommerce_123');
define('JWT_ALGORITHM', 'HS256');
?>