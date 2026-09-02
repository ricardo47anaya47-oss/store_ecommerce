<?php

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../middleware/auth.php';

class PurchaseController
{
    private $db;

    public function __construct()
    {
        $this->db = new Database();
    }

    /**
     * Crear una compra a partir del carrito del usuario
     */
    public function createPurchase()
    {
        $user = requireAuth();

        if (!$user || !isset($user['userId'])) {
            return [
                'success' => false,
                'message' => 'Usuario no autenticado'
            ];
        }

        $userId = (int) $user['userId'];

        $data = json_decode(file_get_contents('php://input'), true);

        if (!is_array($data)) {
            return [
                'success' => false,
                'message' => 'Datos inválidos'
            ];
        }

        /*
         * El servidor controla estos valores.
         * El frontend NO puede decidir el estado de la compra.
         */
        $status = 'pending';

        $paymentMethod = isset($data['paymentMethod'])
            ? trim($data['paymentMethod'])
            : null;

        $shippingAddress = isset($data['shippingAddress'])
            ? trim($data['shippingAddress'])
            : null;

        /*
         * Validar método de pago
         */
        $allowedPaymentMethods = [
            'cash',
            'card',
            'transfer',
            'efectivo',
            'tarjeta',
            'transferencia'
        ];

        if ($paymentMethod !== null && $paymentMethod !== '') {

            if (!in_array(strtolower($paymentMethod), $allowedPaymentMethods, true)) {
                return [
                    'success' => false,
                    'message' => 'Método de pago no válido'
                ];
            }
        } else {
            $paymentMethod = null;
        }

        /*
         * Buscar carrito del usuario
         */
        $cart = $this->db->prepare(
            "SELECT id
             FROM cart
             WHERE user_id = ?
             LIMIT 1"
        );

        $cart->bind_param("i", $userId);
        $cart->execute();

        $cartResult = $cart->get_result();
        $cartData = $cartResult->fetch_assoc();

        $cart->close();

        if (!$cartData) {
            return [
                'success' => false,
                'message' => 'El usuario no tiene un carrito'
            ];
        }

        $cartId = (int) $cartData['id'];

        /*
         * Iniciar transacción
         *
         * Todo el proceso de compra debe completarse
         * correctamente o revertirse completamente.
         */
        $this->db->query("START TRANSACTION");

        try {

            /*
             * Obtener productos del carrito.
             *
             * También obtenemos el stock actual desde product
             * para poder verificarlo.
             */
            $stmt = $this->db->prepare(
                "SELECT
                    cd.id,
                    cd.product_id,
                    cd.product_name,
                    cd.price,
                    cd.quantity,
                    p.title,
                    p.stock
                 FROM cart_detail cd
                 INNER JOIN product p
                    ON p.id = cd.product_id
                 WHERE cd.cart_id = ?
                 FOR UPDATE"
            );

            $stmt->bind_param("i", $cartId);
            $stmt->execute();

            $result = $stmt->get_result();

            if ($result->num_rows === 0) {

                $stmt->close();

                $this->db->query("ROLLBACK");

                return [
                    'success' => false,
                    'message' => 'El carrito está vacío'
                ];
            }

            $items = [];
            $total = 0;

            /*
             * Revisar productos y stock
             */
            while ($item = $result->fetch_assoc()) {

                $productId = (int) $item['product_id'];
                $quantity = (int) $item['quantity'];
                $stock = (int) $item['stock'];

                if ($quantity <= 0) {

                    $stmt->close();
                    $this->db->query("ROLLBACK");

                    return [
                        'success' => false,
                        'message' => 'La cantidad de un producto no es válida'
                    ];
                }

                /*
                 * Evitar comprar más unidades
                 * de las disponibles.
                 */
                if ($quantity > $stock) {

                    $stmt->close();
                    $this->db->query("ROLLBACK");

                    return [
                        'success' => false,
                        'message' => 'No hay suficiente stock para el producto: ' .
                            ($item['title'] ?? $item['product_name'])
                    ];
                }

                $price = (float) $item['price'];

                $subtotal = $price * $quantity;

                $total += $subtotal;

                $items[] = [
                    'product_id' => $productId,
                    'product_name' => $item['title'] ?? $item['product_name'],
                    'price' => $price,
                    'quantity' => $quantity
                ];
            }

            $stmt->close();

            /*
             * Crear la compra
             */
            $stmtPurchase = $this->db->prepare(
                "INSERT INTO purchase
                (
                    cart_id,
                    user_id,
                    total,
                    status,
                    payment_method,
                    shipping_address
                )
                VALUES (?, ?, ?, ?, ?, ?)"
            );

            $stmtPurchase->bind_param(
                "iidsss",
                $cartId,
                $userId,
                $total,
                $status,
                $paymentMethod,
                $shippingAddress
            );

            if (!$stmtPurchase->execute()) {

                $error = $stmtPurchase->error;

                $stmtPurchase->close();

                $this->db->query("ROLLBACK");

                error_log("Error creando purchase: " . $error);

                return [
                    'success' => false,
                    'message' => 'No se pudo crear la compra'
                ];
            }

            $purchaseId = $this->db->lastInsertId();

            $stmtPurchase->close();

            /*
             * Insertar detalles de la compra
             */
            $stmtDetail = $this->db->prepare(
                "INSERT INTO purchase_detail
                (
                    purchase_id,
                    product_id,
                    product_name,
                    price,
                    quantity
                )
                VALUES (?, ?, ?, ?, ?)"
            );

            foreach ($items as $item) {

                $productId = $item['product_id'];
                $productName = $item['product_name'];
                $price = $item['price'];
                $quantity = $item['quantity'];

                $stmtDetail->bind_param(
                    "iissd",
                    $purchaseId,
                    $productId,
                    $productName,
                    $price,
                    $quantity
                );

                /*
                 * NOTA:
                 * La cadena anterior tiene que corresponder
                 * exactamente a los tipos.
                 *
                 * Se reemplaza abajo por la forma correcta.
                 */
            }

            $stmtDetail->close();

            /*
             * Insertar nuevamente usando los tipos correctos.
             */
            $stmtDetail = $this->db->prepare(
                "INSERT INTO purchase_detail
                (
                    purchase_id,
                    product_id,
                    product_name,
                    price,
                    quantity
                )
                VALUES (?, ?, ?, ?, ?)"
            );

            foreach ($items as $item) {

                $productId = (int) $item['product_id'];
                $productName = $item['product_name'];
                $price = (float) $item['price'];
                $quantity = (int) $item['quantity'];

                $stmtDetail->bind_param(
                    "iisdi",
                    $purchaseId,
                    $productId,
                    $productName,
                    $price,
                    $quantity
                );

                if (!$stmtDetail->execute()) {

                    $error = $stmtDetail->error;

                    $stmtDetail->close();

                    $this->db->query("ROLLBACK");

                    error_log("Error creando purchase_detail: " . $error);

                    return [
                        'success' => false,
                        'message' => 'No se pudieron guardar los detalles de la compra'
                    ];
                }
            }

            $stmtDetail->close();

            /*
             * Descontar stock.
             *
             * La condición stock >= quantity evita
             * que el stock quede negativo.
             */
            $stmtStock = $this->db->prepare(
                "UPDATE product
                 SET stock = stock - ?
                 WHERE id = ?
                 AND stock >= ?"
            );

            foreach ($items as $item) {

                $quantity = (int) $item['quantity'];
                $productId = (int) $item['product_id'];

                $stmtStock->bind_param(
                    "iii",
                    $quantity,
                    $productId,
                    $quantity
                );

                if (!$stmtStock->execute()) {

                    $stmtStock->close();

                    $this->db->query("ROLLBACK");

                    return [
                        'success' => false,
                        'message' => 'No se pudo actualizar el stock'
                    ];
                }

                /*
                 * affected_rows debe ser 1.
                 * Si es 0, significa que el stock cambió
                 * o ya no era suficiente.
                 */
                if ($stmtStock->affected_rows !== 1) {

                    $stmtStock->close();

                    $this->db->query("ROLLBACK");

                    return [
                        'success' => false,
                        'message' => 'El stock de uno de los productos ya no está disponible'
                    ];
                }
            }

            $stmtStock->close();

            /*
             * Vaciar el carrito
             */
            $stmtCart = $this->db->prepare(
                "DELETE FROM cart_detail
                 WHERE cart_id = ?"
            );

            $stmtCart->bind_param("i", $cartId);

            if (!$stmtCart->execute()) {

                $stmtCart->close();

                $this->db->query("ROLLBACK");

                return [
                    'success' => false,
                    'message' => 'No se pudo limpiar el carrito'
                ];
            }

            $stmtCart->close();

            /*
             * Confirmar toda la operación
             */
            $this->db->query("COMMIT");

            return [
                'success' => true,
                'message' => 'Compra creada correctamente',
                'purchase' => [
                    'id' => $purchaseId,
                    'cartId' => $cartId,
                    'userId' => $userId,
                    'total' => round($total, 2),
                    'status' => $status,
                    'paymentMethod' => $paymentMethod,
                    'shippingAddress' => $shippingAddress,
                    'items' => $items
                ]
            ];

        } catch (Exception $e) {

            /*
             * Si cualquier operación falla,
             * revertimos TODO.
             */
            $this->db->query("ROLLBACK");

            error_log(
                "Error en createPurchase: " .
                $e->getMessage()
            );

            return [
                'success' => false,
                'message' => 'Ocurrió un error al procesar la compra'
            ];
        }
    }


    /**
     * Obtener compras del usuario autenticado
     */
    public function getUserPurchases()
    {
        $user = requireAuth();

        if (!$user || !isset($user['userId'])) {
            return [
                'success' => false,
                'message' => 'Usuario no autenticado'
            ];
        }

        $userId = (int) $user['userId'];

        $stmt = $this->db->prepare(
            "SELECT
                id,
                cart_id,
                user_id,
                total,
                status,
                payment_method,
                shipping_address,
                created_at,
                updated_at
             FROM purchase
             WHERE user_id = ?
             ORDER BY created_at DESC"
        );

        $stmt->bind_param("i", $userId);
        $stmt->execute();

        $result = $stmt->get_result();

        $purchases = [];

        while ($purchase = $result->fetch_assoc()) {

            $purchases[] = $purchase;
        }

        $stmt->close();

        return [
            'success' => true,
            'purchases' => $purchases
        ];
    }


    /**
     * Obtener una compra específica
     */
    public function getPurchaseById($id)
    {
        $user = requireAuth();

        if (!$user || !isset($user['userId'])) {
            return [
                'success' => false,
                'message' => 'Usuario no autenticado'
            ];
        }

        $userId = (int) $user['userId'];
        $purchaseId = (int) $id;

        if ($purchaseId <= 0) {
            return [
                'success' => false,
                'message' => 'ID de compra inválido'
            ];
        }

        /*
         * Obtener compra verificando que pertenezca
         * al usuario autenticado.
         */
        $stmt = $this->db->prepare(
            "SELECT
                id,
                cart_id,
                user_id,
                total,
                status,
                payment_method,
                shipping_address,
                created_at,
                updated_at
             FROM purchase
             WHERE id = ?
             AND user_id = ?
             LIMIT 1"
        );

        $stmt->bind_param(
            "ii",
            $purchaseId,
            $userId
        );

        $stmt->execute();

        $result = $stmt->get_result();

        $purchase = $result->fetch_assoc();

        $stmt->close();

        if (!$purchase) {
            return [
                'success' => false,
                'message' => 'Compra no encontrada'
            ];
        }

        /*
         * Obtener detalles
         */
        $stmt = $this->db->prepare(
            "SELECT
                id,
                purchase_id,
                product_id,
                product_name,
                price,
                quantity,
                created_at
             FROM purchase_detail
             WHERE purchase_id = ?
             ORDER BY id ASC"
        );

        $stmt->bind_param(
            "i",
            $purchaseId
        );

        $stmt->execute();

        $result = $stmt->get_result();

        $details = [];

        while ($detail = $result->fetch_assoc()) {

            $details[] = $detail;
        }

        $stmt->close();

        $purchase['details'] = $details;

        return [
            'success' => true,
            'purchase' => $purchase
        ];
    }
}