<?php

ob_start();

$allowedOrigins = [
    'https://store-ecommerce-six.vercel.app',
    'http://localhost:5173',
    'http://localhost',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

$frontendUrl = getenv('FRONTEND_URL') ?: getenv('APP_ORIGIN') ?: '';
if ($frontendUrl !== '') {
    $allowedOrigins[] = rtrim($frontendUrl, '/');
}

$isAllowedOrigin = in_array($origin, $allowedOrigins, true)
    || preg_match('/^https:\/\/.*\.vercel\.app$/', $origin) === 1
    || preg_match('/^https:\/\/.*\.vercel\.preview\.app$/', $origin) === 1;

if ($origin !== '' && $isAllowedOrigin) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
}

header("Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store");
header("Pragma: no-cache");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/ProductController.php';
require_once __DIR__ . '/controllers/CartController.php';
require_once __DIR__ . '/controllers/PurchaseController.php';

function sendJson($payload, $statusCode = 200)
{
    if (ob_get_length() > 0) {
        ob_clean();
    }

    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');

    echo json_encode($payload);
    exit;
}

// Obtener ruta
$request = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Como la API está en /api
$basePath = dirname($_SERVER['SCRIPT_NAME']);

if ($basePath !== '/' && strpos($request, $basePath) === 0) {
    $request = substr($request, strlen($basePath));
}

$request = '/' . trim($request, '/');

$method = $_SERVER['REQUEST_METHOD'];

// =========================
// AUTENTICACIÓN
// =========================

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

// =========================
// PRODUCTOS
// =========================

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

// =========================
// CARRITO
// =========================

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

        error_log($e->getMessage());

        sendJson([
            'success' => false,
            'message' => 'Error interno del servidor.'
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

// =========================
// COMPRAS
// =========================

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

// =========================
// RUTA NO ENCONTRADA
// =========================

sendJson([
    'success' => false,
    'message' => 'Ruta no encontrada',
    'route' => $request,
    'method' => $method
], 404);