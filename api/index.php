<?php

ob_start();

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

$allowedOrigins = [
    'https://store-ecommerce-six.vercel.app',
    'http://localhost:5173',
    'http://localhost'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Vary: Origin");
}

header(
    'Access-Control-Allow-Headers: Origin, Content-Type, Accept, Authorization, X-Requested-With'
);

header(
    'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS'
);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
header('Pragma: no-cache');


/*
|--------------------------------------------------------------------------
| Preflight CORS
|--------------------------------------------------------------------------
*/

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


/*
|--------------------------------------------------------------------------
| Archivos necesarios
|--------------------------------------------------------------------------
*/

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/ProductController.php';
require_once __DIR__ . '/controllers/CartController.php';
require_once __DIR__ . '/controllers/PurchaseController.php';


/*
|--------------------------------------------------------------------------
| Respuesta JSON
|--------------------------------------------------------------------------
*/

function sendJson($payload, $statusCode = 200)
{
    if (ob_get_length() > 0) {
        ob_clean();
    }

    http_response_code($statusCode);

    header('Content-Type: application/json; charset=utf-8');

    echo json_encode(
        $payload,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    exit;
}


/*
|--------------------------------------------------------------------------
| Obtener ruta
|--------------------------------------------------------------------------
*/

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';

$request = parse_url(
    $requestUri,
    PHP_URL_PATH
);


/*
|--------------------------------------------------------------------------
| Eliminar /api de la URL
|--------------------------------------------------------------------------
|
| Ejemplo:
|
| /api/products
|
| se convierte en:
|
| /products
|
|--------------------------------------------------------------------------
*/

$basePath = dirname($_SERVER['SCRIPT_NAME']);

if ($basePath !== '/' && $basePath !== '\\') {

    if (strpos($request, $basePath) === 0) {
        $request = substr(
            $request,
            strlen($basePath)
        );
    }
}

$request = '/' . trim($request, '/');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';


/*
|--------------------------------------------------------------------------
| AUTENTICACIÓN
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| POST /api/auth/register
|--------------------------------------------------------------------------
*/

if (
    $request === '/auth/register' &&
    $method === 'POST'
) {

    $controller = new AuthController();

    $response = $controller->register();

    sendJson($response);
}


/*
|--------------------------------------------------------------------------
| POST /api/auth/login
|--------------------------------------------------------------------------
*/

if (
    $request === '/auth/login' &&
    $method === 'POST'
) {

    $controller = new AuthController();

    $response = $controller->login();

    sendJson($response);
}


/*
|--------------------------------------------------------------------------
| GET /api/auth/profile
|--------------------------------------------------------------------------
*/

if (
    $request === '/auth/profile' &&
    $method === 'GET'
) {

    $controller = new AuthController();

    $response = $controller->profile();

    sendJson($response);
}


/*
|--------------------------------------------------------------------------
| PRODUCTOS
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GET /api/products
|--------------------------------------------------------------------------
*/

if (
    $request === '/products' &&
    $method === 'GET'
) {

    $controller = new ProductController();

    $response = $controller->getAll();

    sendJson($response);
}


/*
|--------------------------------------------------------------------------
| GET /api/products/search
|--------------------------------------------------------------------------
|
| IMPORTANTE:
| Esta ruta debe estar antes de /products/{id}.
|--------------------------------------------------------------------------
*/

if (
    $request === '/products/search' &&
    $method === 'GET'
) {

    $controller = new ProductController();

    $response = $controller->search();

    sendJson($response);
}


/*
|--------------------------------------------------------------------------
| GET /api/products/categories/list
|--------------------------------------------------------------------------
*/

if (
    $request === '/products/categories/list' &&
    $method === 'GET'
) {

    $controller = new ProductController();

    $response = $controller->getCategories();

    sendJson($response);
}


/*
|--------------------------------------------------------------------------
| GET /api/products/category/electronics
|--------------------------------------------------------------------------
*/

if (
    preg_match(
        '#^/products/category/(.+)$#',
        $request,
        $matches
    ) &&
    $method === 'GET'
) {

    $category = urldecode($matches[1]);

    $controller = new ProductController();

    $response = $controller->getByCategory($category);

    sendJson($response);
}


/*
|--------------------------------------------------------------------------
| GET /api/products/123
|--------------------------------------------------------------------------
*/

if (
    preg_match(
        '#^/products/(\d+)$#',
        $request,
        $matches
    ) &&
    $method === 'GET'
) {

    $id = (int) $matches[1];

    $controller = new ProductController();

    $response = $controller->getById($id);

    sendJson($response);
}


/*
|--------------------------------------------------------------------------
| CARRITO
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| GET /api/cart
|--------------------------------------------------------------------------
*/

if (
    $request === '/cart' &&
    $method === 'GET'
) {

    try {

        $controller = new CartController();

        $response = $controller->getCart();

        sendJson($response);

    } catch (Throwable $e) {

        error_log(
            'Error GET /cart: ' .
            $e->getMessage()
        );

        sendJson([
            'success' => false,
            'message' => 'Error al obtener carrito'
        ], 500);
    }
}


/*
|--------------------------------------------------------------------------
| POST /api/cart/add
|--------------------------------------------------------------------------
*/

if (
    $request === '/cart/add' &&
    $method === 'POST'
) {

    try {

        $controller = new CartController();

        $response = $controller->addToCart();

        sendJson($response);

    } catch (Throwable $e) {

        error_log(
            'Error POST /cart/add: ' .
            $e->getMessage()
        );

        sendJson([
            'success' => false,
            'message' => 'Error interno del servidor'
        ], 500);
    }
}


/*
|--------------------------------------------------------------------------
| POST /api/cart/remove
|--------------------------------------------------------------------------
*/

if (
    $request === '/cart/remove' &&
    $method === 'POST'
) {

    try {

        $controller = new CartController();

        $response = $controller->removeFromCart();

        sendJson($response);

    } catch (Throwable $e) {

        error_log(
            'Error POST /cart/remove: ' .
            $e->getMessage()
        );

        sendJson([
            'success' => false,
            'message' => 'Error al eliminar producto del carrito'
        ], 500);
    }
}


/*
|--------------------------------------------------------------------------
| POST /api/cart/update
|--------------------------------------------------------------------------
*/

if (
    $request === '/cart/update' &&
    $method === 'POST'
) {

    try {

        $controller = new CartController();

        $response = $controller->updateQuantity();

        sendJson($response);

    } catch (Throwable $e) {

        error_log(
            'Error POST /cart/update: ' .
            $e->getMessage()
        );

        sendJson([
            'success' => false,
            'message' => 'Error al actualizar carrito'
        ], 500);
    }
}


/*
|--------------------------------------------------------------------------
| POST /api/cart/clear
|--------------------------------------------------------------------------
*/

if (
    $request === '/cart/clear' &&
    $method === 'POST'
) {

    try {

        $controller = new CartController();

        $response = $controller->clearCart();

        sendJson($response);

    } catch (Throwable $e) {

        error_log(
            'Error POST /cart/clear: ' .
            $e->getMessage()
        );

        sendJson([
            'success' => false,
            'message' => 'Error al vaciar carrito'
        ], 500);
    }
}


/*
|--------------------------------------------------------------------------
| COMPRAS
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| POST /api/purchases/create
|--------------------------------------------------------------------------
*/

if (
    $request === '/purchases/create' &&
    $method === 'POST'
) {

    try {

        $controller = new PurchaseController();

        $response = $controller->createPurchase();

        sendJson($response);

    } catch (Throwable $e) {

        error_log(
            'Error POST /purchases/create: ' .
            $e->getMessage()
        );

        sendJson([
            'success' => false,
            'message' => 'Error al crear la compra'
        ], 500);
    }
}


/*
|--------------------------------------------------------------------------
| GET /api/purchases
|--------------------------------------------------------------------------
*/

if (
    $request === '/purchases' &&
    $method === 'GET'
) {

    try {

        $controller = new PurchaseController();

        $response = $controller->getUserPurchases();

        sendJson($response);

    } catch (Throwable $e) {

        error_log(
            'Error GET /purchases: ' .
            $e->getMessage()
        );

        sendJson([
            'success' => false,
            'message' => 'Error al obtener compras'
        ], 500);
    }
}


/*
|--------------------------------------------------------------------------
| GET /api/purchases/123
|--------------------------------------------------------------------------
*/

if (
    preg_match(
        '#^/purchases/(\d+)$#',
        $request,
        $matches
    ) &&
    $method === 'GET'
) {

    try {

        $id = (int) $matches[1];

        $controller = new PurchaseController();

        $response = $controller->getPurchaseById($id);

        sendJson($response);

    } catch (Throwable $e) {

        error_log(
            'Error GET /purchases/{id}: ' .
            $e->getMessage()
        );

        sendJson([
            'success' => false,
            'message' => 'Error al obtener la compra'
        ], 500);
    }
}


/*
|--------------------------------------------------------------------------
| RUTA NO ENCONTRADA
|--------------------------------------------------------------------------
*/

sendJson([
    'success' => false,
    'message' => 'Ruta no encontrada',
    'route' => $request,
    'method' => $method
], 404);