<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/ProductController.php';
require_once __DIR__ . '/controllers/CartController.php';
require_once __DIR__ . '/controllers/PurchaseController.php';

// Iniciar buffer para capturar salidas inesperadas (HTML/warnings)
ob_start();

// Helper para enviar JSON y garantizar salida limpia
function sendJson($payload, $statusCode = 200) {
    // Limpiar cualquier salida no JSON
    if (ob_get_length() > 0) {
        ob_clean();
    }
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

// Obtener la ruta
$request = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request = str_replace('/store_ecommerce/api', '', $request);
$method = $_SERVER['REQUEST_METHOD'];

// Rutas de autenticación
if ($request === '/auth/register' && $method === 'POST') {
    $controller = new AuthController();
    $response = $controller->register();
    sendJson($response);
}

if ($request === '/auth/login' && $method === 'POST') {
    $controller = new AuthController();
    $response = $controller->login();
    sendJson($response);
}

if ($request === '/auth/profile' && $method === 'GET') {
    $controller = new AuthController();
    $response = $controller->profile();
    sendJson($response);
}

// Rutas de productos
if ($request === '/products' && $method === 'GET') {
    $controller = new ProductController();
    $response = $controller->getAll();
    sendJson($response);
}

if (preg_match('/^\/products\/(\d+)$/', $request, $matches) && $method === 'GET') {
    $id = $matches[1];
    $controller = new ProductController();
    $response = $controller->getById($id);
    sendJson($response);
}

if ($request === '/products/search' && $method === 'GET') {
    $controller = new ProductController();
    $response = $controller->search();
    sendJson($response);
}

if (preg_match('/^\/products\/category\/(.+)$/', $request, $matches) && $method === 'GET') {
    $category = $matches[1];
    $controller = new ProductController();
    $response = $controller->getByCategory($category);
    sendJson($response);
}

if ($request === '/products/categories/list' && $method === 'GET') {
    $controller = new ProductController();
    $response = $controller->getCategories();
    sendJson($response);
}

// Rutas del carrito
if ($request === '/cart' && $method === 'GET') {
    try {
        $controller = new CartController();
        $response = $controller->getCart();
        sendJson($response);
    } catch (Exception $e) {
        sendJson([
            'success' => false,
            'message' => 'Error al obtener carrito',
            'error' => $e->getMessage()
        ], 500);
    }
}

if ($request === '/cart/add' && $method === 'POST') {
    try {
        $controller = new CartController();
        $response = $controller->addToCart();
        sendJson($response);
    } catch (Exception $e) {
        sendJson([
            'success' => false,
            'message' => 'Error al agregar al carrito',
            'error' => $e->getMessage(),
            'debug' => [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]
        ], 500);
    }
}

if ($request === '/cart/remove' && $method === 'POST') {
    $controller = new CartController();
    $response = $controller->removeFromCart();
    sendJson($response);
}

if ($request === '/cart/update' && $method === 'POST') {
    $controller = new CartController();
    $response = $controller->updateQuantity();
    sendJson($response);
}

if ($request === '/cart/clear' && $method === 'POST') {
    $controller = new CartController();
    $response = $controller->clearCart();
    sendJson($response);
}

// Rutas de compras
if ($request === '/purchases/create' && $method === 'POST') {
    $controller = new PurchaseController();
    $response = $controller->createPurchase();
    sendJson($response);
}

if ($request === '/purchases' && $method === 'GET') {
    $controller = new PurchaseController();
    $response = $controller->getUserPurchases();
    sendJson($response);
}

if (preg_match('/^\/purchases\/(\d+)$/', $request, $matches) && $method === 'GET') {
    $id = $matches[1];
    $controller = new PurchaseController();
    $response = $controller->getPurchaseById($id);
    sendJson($response);
}

if ($request === '/purchases/admin/list' && $method === 'GET') {
    $controller = new PurchaseController();
    $response = $controller->getAllPurchases();
    sendJson($response);
}

if ($request === '/purchases/admin/stats' && $method === 'GET') {
    $controller = new PurchaseController();
    $response = $controller->getPurchaseStats();
    sendJson($response);
}

if ($request === '/purchases/admin/update-status' && $method === 'POST') {
    $controller = new PurchaseController();
    $response = $controller->updatePurchaseStatus();
    sendJson($response);
}

// Ruta no encontrada
// Si llegamos aquí, ruta no encontrada. Capturar cualquier salida y devolver JSON.
$buffer = ob_get_clean();
if ($buffer && trim($buffer) !== '') {
    // Si hay salida no esperada (HTML), no devolverla como JSON
    sendJson([
        'success' => false,
        'message' => 'Ruta no encontrada',
        'debug' => 'Salida inesperada detectada en el servidor'
    ], 404);
} else {
    sendJson([
        'success' => false,
        'message' => 'Ruta no encontrada'
    ], 404);
}
?>
