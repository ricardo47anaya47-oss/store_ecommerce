<?php

// Mostrar errores de PHP para depuración (BORRAR EN PRODUCCIÓN)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// ... aquí continúa el resto de tu código original ...
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';

if (!empty($_SERVER['HTTP_ORIGIN'])) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin');
header('Access-Control-Max-Age: 86400');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/ProductController.php';
require_once __DIR__ . '/controllers/CartController.php';
require_once __DIR__ . '/controllers/PurchaseController.php';

ob_start();

function sendJson($payload, $statusCode = 200) {
    if (ob_get_length() > 0) {
        ob_clean();
    }
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

$scriptName = parse_url($_SERVER['SCRIPT_NAME'] ?? '', PHP_URL_PATH) ?: '/api/index.php';
$rawRequestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

$normalizedPath = preg_replace('#/index\.php#', '', $rawRequestPath);
$normalizedPath = preg_replace('#^/api#', '', $normalizedPath);
$normalizedPath = preg_replace('#/+#', '/', $normalizedPath);
$normalizedPath = rtrim($normalizedPath, '/');

if ($normalizedPath === '') {
    $normalizedPath = '/';
}

$request = $normalizedPath;
$method = $_SERVER['REQUEST_METHOD'];

if ($request === '/' && $method === 'GET') {
    sendJson(['success' => true, 'message' => 'API funcionando']);
}

if ($request === '/auth/register' && $method === 'POST') {
    $controller = new AuthController();
    sendJson($controller->register());
}

if ($request === '/auth/login' && $method === 'POST') {
    $controller = new AuthController();
    sendJson($controller->login());
}

if ($request === '/auth/profile' && $method === 'GET') {
    $controller = new AuthController();
    sendJson($controller->profile());
}

if ($request === '/products' && $method === 'GET') {
    $controller = new ProductController();
    sendJson($controller->getAll());
}

if (preg_match('#^/products/(\d+)$#', $request, $matches) && $method === 'GET') {
    $controller = new ProductController();
    sendJson($controller->getById($matches[1]));
}

if ($request === '/products/search' && $method === 'GET') {
    $controller = new ProductController();
    sendJson($controller->search());
}

if (preg_match('#^/products/category/([^/]+)$#', $request, $matches) && $method === 'GET') {
    $controller = new ProductController();
    sendJson($controller->getByCategory(urldecode($matches[1])));
}

if ($request === '/products/categories' && $method === 'GET') {
    $controller = new ProductController();
    sendJson($controller->getCategories());
}

if ($request === '/cart' && $method === 'GET') {
    $controller = new CartController();
    sendJson($controller->getCart());
}

if ($request === '/cart/add' && $method === 'POST') {
    $controller = new CartController();
    sendJson($controller->addToCart());
}

if ($request === '/cart/remove' && $method === 'POST') {
    $controller = new CartController();
    sendJson($controller->removeFromCart());
}

if ($request === '/cart/update' && $method === 'POST') {
    $controller = new CartController();
    sendJson($controller->updateQuantity());
}

if ($request === '/cart/clear' && $method === 'POST') {
    $controller = new CartController();
    sendJson($controller->clearCart());
}

if ($request === '/purchases/create' && $method === 'POST') {
    $controller = new PurchaseController();
    sendJson($controller->createPurchase());
}

if ($request === '/purchases' && $method === 'GET') {
    $controller = new PurchaseController();
    sendJson($controller->getUserPurchases());
}

if (preg_match('#^/purchases/(\d+)$#', $request, $matches) && $method === 'GET') {
    $controller = new PurchaseController();
    sendJson($controller->getPurchaseById($matches[1]));
}

if ($request === '/purchases/admin/list' && $method === 'GET') {
    $controller = new PurchaseController();
    sendJson($controller->getAllPurchases());
}

if ($request === '/purchases/admin/stats' && $method === 'GET') {
    $controller = new PurchaseController();
    sendJson($controller->getPurchaseStats());
}

if ($request === '/purchases/admin/update-status' && $method === 'POST') {
    $controller = new PurchaseController();
    sendJson($controller->updatePurchaseStatus());
}

sendJson(['success' => false, 'message' => 'Ruta no encontrada'], 404);