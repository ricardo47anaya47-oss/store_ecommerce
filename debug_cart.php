<?php
header('Content-Type: application/json');

// Simular una petición POST
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/proyect_ecommerce/api/cart/add';

// Datos de prueba
$testData = json_encode(['productId' => 1, 'quantity' => 1]);

// Crear un token falso para simular autenticación
$_SERVER['HTTP_AUTHORIZATION'] = 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIxIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwiaWF0IjoxNzcxNDI3Mjc3LCJleHAiOjE3NzE1MTM2Nzd9.test';

// Capturar errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Buffer para capturar salida
ob_start();

try {
    require_once __DIR__ . '/api/config.php';
    require_once __DIR__ . '/api/Database.php';
    require_once __DIR__ . '/api/middleware/auth.php';
    require_once __DIR__ . '/api/controllers/CartController.php';

    $db = new Database();
    
    // Debug: Verificar estructura de tablas
    $cartCols = $db->query("SHOW COLUMNS FROM cart");
    $cartDetail = $db->query("SHOW COLUMNS FROM cart_detail");
    
    echo json_encode([
        'cart_columns' => $cartCols ? 'OK' : 'ERROR',
        'cart_detail_columns' => $cartDetail ? 'OK' : 'ERROR',
        'test' => 'Database connection works'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}

$output = ob_get_clean();
echo $output;
?>
