<?php

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../middleware/auth.php';

class CartController
{
    private $db;

    public function __construct()
    {
        $this->db = new Database();
    }


    /*
    |--------------------------------------------------------------------------
    | Obtener carrito del usuario
    |--------------------------------------------------------------------------
    */

    public function getCart()
    {
        $user = requireAuth();

        if (!$user || !isset($user['userId'])) {
            return [
                'success' => false,
                'message' => 'Usuario no autenticado'
            ];
        }

        $userId = (int) $user['userId'];

        /*
         * Buscar carrito
         */

        $stmt = $this->db->prepare(
            "SELECT id
             FROM cart
             WHERE user_id = ?
             LIMIT 1"
        );

        $stmt->bind_param("i", $userId);

        if (!$stmt->execute()) {

            $stmt->close();

            return [
                'success' => false,
                'message' => 'No se pudo obtener el carrito'
            ];
        }

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {

            $stmt->close();

            return [
                'success' => true,
                'data' => [
                    'cartId' => null,
                    'items' => [],
                    'total' => 0
                ]
            ];
        }

        $cart = $result->fetch_assoc();

        $stmt->close();

        $cartId = (int) $cart['id'];


        /*
         * Obtener productos del carrito
         *
         * IMPORTANTE:
         * Se utiliza cd.price y no p.price.
         * Así conservamos el precio registrado
         * cuando el producto fue agregado al carrito.
         */

        $stmt = $this->db->prepare(
            "SELECT
                cd.id,
                cd.product_id,
                cd.quantity,
                cd.product_name AS name,
                cd.image,
                cd.price,
                p.stock
             FROM cart_detail cd
             INNER JOIN product p
                ON p.id = cd.product_id
             WHERE cd.cart_id = ?
             ORDER BY cd.id DESC"
        );

        $stmt->bind_param("i", $cartId);

        if (!$stmt->execute()) {

            $stmt->close();

            return [
                'success' => false,
                'message' => 'No se pudieron obtener los productos del carrito'
            ];
        }

        $itemsResult = $stmt->get_result();

        $items = [];
        $total = 0;

        while ($row = $itemsResult->fetch_assoc()) {

            $row['id'] = (int) $row['id'];
            $row['product_id'] = (int) $row['product_id'];
            $row['quantity'] = (int) $row['quantity'];
            $row['price'] = (float) $row['price'];
            $row['stock'] = (int) $row['stock'];

            $row['subtotal'] =
                round(
                    $row['price'] * $row['quantity'],
                    2
                );

            $total += $row['subtotal'];

            $items[] = $row;
        }

        $stmt->close();

        return [
            'success' => true,
            'data' => [
                'cartId' => $cartId,
                'items' => $items,
                'total' => round($total, 2)
            ]
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | Agregar producto
    |--------------------------------------------------------------------------
    */

    public function addToCart()
    {
        $user = requireAuth();

        if (!$user || !isset($user['userId'])) {
            return [
                'success' => false,
                'message' => 'Usuario no autenticado'
            ];
        }

        $userId = (int) $user['userId'];

        $data = json_decode(
            file_get_contents('php://input'),
            true
        );

        if (!is_array($data)) {
            return [
                'success' => false,
                'message' => 'Datos inválidos'
            ];
        }

        if (
            !isset($data['productId']) ||
            !isset($data['quantity'])
        ) {
            return [
                'success' => false,
                'message' => 'productId y quantity son requeridos'
            ];
        }

        $productId = (int) $data['productId'];
        $quantity = (int) $data['quantity'];

        if ($productId <= 0) {
            return [
                'success' => false,
                'message' => 'Producto inválido'
            ];
        }

        if ($quantity <= 0) {
            return [
                'success' => false,
                'message' => 'La cantidad debe ser mayor que cero'
            ];
        }


        /*
         * Obtener producto real desde BD
         */

        $stmt = $this->db->prepare(
            "SELECT
                id,
                title,
                price,
                image_url,
                stock
             FROM product
             WHERE id = ?
             LIMIT 1"
        );

        $stmt->bind_param("i", $productId);

        if (!$stmt->execute()) {

            $stmt->close();

            return [
                'success' => false,
                'message' => 'No se pudo consultar el producto'
            ];
        }

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {

            $stmt->close();

            return [
                'success' => false,
                'message' => 'Producto no encontrado'
            ];
        }

        $product = $result->fetch_assoc();

        $stmt->close();

        $stock = (int) $product['stock'];

        if ($stock <= 0) {

            return [
                'success' => false,
                'message' => 'El producto no tiene stock disponible'
            ];
        }

        if ($quantity > $stock) {

            return [
                'success' => false,
                'message' => 'La cantidad solicitada supera el stock disponible'
            ];
        }


        /*
         * Obtener o crear carrito
         */

        $stmt = $this->db->prepare(
            "SELECT id
             FROM cart
             WHERE user_id = ?
             LIMIT 1"
        );

        $stmt->bind_param("i", $userId);

        if (!$stmt->execute()) {

            $stmt->close();

            return [
                'success' => false,
                'message' => 'No se pudo obtener el carrito'
            ];
        }

        $cartResult = $stmt->get_result();

        if ($cartResult->num_rows === 0) {

            $stmt->close();

            $stmt = $this->db->prepare(
                "INSERT INTO cart (user_id)
                 VALUES (?)"
            );

            $stmt->bind_param("i", $userId);

            if (!$stmt->execute()) {

                $error = $stmt->error;

                $stmt->close();

                error_log(
                    'Error creando carrito: ' . $error
                );

                return [
                    'success' => false,
                    'message' => 'No se pudo crear el carrito'
                ];
            }

            $cartId = $this->db->lastInsertId();

            $stmt->close();

        } else {

            $cart = $cartResult->fetch_assoc();

            $cartId = (int) $cart['id'];

            $stmt->close();
        }


        /*
         * Comprobar si el producto ya está en el carrito
         */

        $stmt = $this->db->prepare(
            "SELECT id, quantity
             FROM cart_detail
             WHERE cart_id = ?
             AND product_id = ?
             LIMIT 1"
        );

        $stmt->bind_param(
            "ii",
            $cartId,
            $productId
        );

        if (!$stmt->execute()) {

            $stmt->close();

            return [
                'success' => false,
                'message' => 'No se pudo consultar el carrito'
            ];
        }

        $itemResult = $stmt->get_result();

        if ($itemResult->num_rows > 0) {

            $item = $itemResult->fetch_assoc();

            $stmt->close();

            $currentQuantity = (int) $item['quantity'];

            $newQuantity =
                $currentQuantity + $quantity;

            if ($newQuantity > $stock) {

                return [
                    'success' => false,
                    'message' => 'La cantidad solicitada supera el stock disponible'
                ];
            }

            $itemId = (int) $item['id'];

            $stmt = $this->db->prepare(
                "UPDATE cart_detail
                 SET quantity = ?
                 WHERE id = ?
                 AND cart_id = ?"
            );

            $stmt->bind_param(
                "iii",
                $newQuantity,
                $itemId,
                $cartId
            );

            if (!$stmt->execute()) {

                $stmt->close();

                return [
                    'success' => false,
                    'message' => 'No se pudo actualizar el carrito'
                ];
            }

            $stmt->close();

        } else {

            $stmt->close();

            $price = (float) $product['price'];
            $productName = $product['title'];
            $image = $product['image_url'];

            $stmt = $this->db->prepare(
                "INSERT INTO cart_detail
                (
                    cart_id,
                    product_id,
                    product_name,
                    image,
                    price,
                    quantity
                )
                VALUES (?, ?, ?, ?, ?, ?)"
            );

            $stmt->bind_param(
                "iissdi",
                $cartId,
                $productId,
                $productName,
                $image,
                $price,
                $quantity
            );

            if (!$stmt->execute()) {

                $error = $stmt->error;

                $stmt->close();

                error_log(
                    'Error agregando producto al carrito: ' .
                    $error
                );

                return [
                    'success' => false,
                    'message' => 'No se pudo agregar el producto al carrito'
                ];
            }

            $stmt->close();
        }

        return [
            'success' => true,
            'message' => 'Producto agregado al carrito'
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | Eliminar producto del carrito
    |--------------------------------------------------------------------------
    */

    public function removeFromCart()
    {
        $user = requireAuth();

        $userId = (int) $user['userId'];

        $data = json_decode(
            file_get_contents('php://input'),
            true
        );

        if (
            !is_array($data) ||
            !isset($data['cartDetailId'])
        ) {
            return [
                'success' => false,
                'message' => 'cartDetailId es requerido'
            ];
        }

        $cartDetailId = (int) $data['cartDetailId'];

        if ($cartDetailId <= 0) {
            return [
                'success' => false,
                'message' => 'ID del producto del carrito inválido'
            ];
        }

        $stmt = $this->db->prepare(
            "DELETE cd
             FROM cart_detail cd
             INNER JOIN cart c
                ON c.id = cd.cart_id
             WHERE cd.id = ?
             AND c.user_id = ?"
        );

        $stmt->bind_param(
            "ii",
            $cartDetailId,
            $userId
        );

        if (!$stmt->execute()) {

            $stmt->close();

            return [
                'success' => false,
                'message' => 'No se pudo eliminar el producto'
            ];
        }

        $affected = $stmt->affected_rows;

        $stmt->close();

        if ($affected === 0) {

            return [
                'success' => false,
                'message' => 'Producto del carrito no encontrado'
            ];
        }

        return [
            'success' => true,
            'message' => 'Producto removido del carrito'
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | Actualizar cantidad
    |--------------------------------------------------------------------------
    */

    public function updateQuantity()
    {
        $user = requireAuth();

        $userId = (int) $user['userId'];

        $data = json_decode(
            file_get_contents('php://input'),
            true
        );

        if (
            !is_array($data) ||
            !isset($data['cartDetailId']) ||
            !isset($data['quantity'])
        ) {
            return [
                'success' => false,
                'message' => 'cartDetailId y quantity son requeridos'
            ];
        }

        $cartDetailId = (int) $data['cartDetailId'];
        $quantity = (int) $data['quantity'];

        if ($cartDetailId <= 0) {
            return [
                'success' => false,
                'message' => 'ID del producto del carrito inválido'
            ];
        }


        /*
         * Cantidad 0 = eliminar
         */

        if ($quantity <= 0) {

            $stmt = $this->db->prepare(
                "DELETE cd
                 FROM cart_detail cd
                 INNER JOIN cart c
                    ON c.id = cd.cart_id
                 WHERE cd.id = ?
                 AND c.user_id = ?"
            );

            $stmt->bind_param(
                "ii",
                $cartDetailId,
                $userId
            );

            if (!$stmt->execute()) {

                $stmt->close();

                return [
                    'success' => false,
                    'message' => 'No se pudo eliminar el producto'
                ];
            }

            $affected = $stmt->affected_rows;

            $stmt->close();

            if ($affected === 0) {

                return [
                    'success' => false,
                    'message' => 'Producto del carrito no encontrado'
                ];
            }

            return [
                'success' => true,
                'message' => 'Producto eliminado del carrito'
            ];
        }


        /*
         * Obtener producto y stock.
         * También verificamos que pertenezca
         * al carrito del usuario.
         */

        $stmt = $this->db->prepare(
            "SELECT
                p.stock
             FROM cart_detail cd
             INNER JOIN cart c
                ON c.id = cd.cart_id
             INNER JOIN product p
                ON p.id = cd.product_id
             WHERE cd.id = ?
             AND c.user_id = ?
             LIMIT 1"
        );

        $stmt->bind_param(
            "ii",
            $cartDetailId,
            $userId
        );

        if (!$stmt->execute()) {

            $stmt->close();

            return [
                'success' => false,
                'message' => 'No se pudo verificar el producto'
            ];
        }

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {

            $stmt->close();

            return [
                'success' => false,
                'message' => 'Producto del carrito no encontrado'
            ];
        }

        $product = $result->fetch_assoc();

        $stmt->close();

        $stock = (int) $product['stock'];

        if ($quantity > $stock) {

            return [
                'success' => false,
                'message' => 'La cantidad supera el stock disponible'
            ];
        }


        /*
         * Actualizar cantidad
         */

        $stmt = $this->db->prepare(
            "UPDATE cart_detail cd
             INNER JOIN cart c
                ON c.id = cd.cart_id
             SET cd.quantity = ?
             WHERE cd.id = ?
             AND c.user_id = ?"
        );

        $stmt->bind_param(
            "iii",
            $quantity,
            $cartDetailId,
            $userId
        );

        if (!$stmt->execute()) {

            $stmt->close();

            return [
                'success' => false,
                'message' => 'No se pudo actualizar la cantidad'
            ];
        }

        $stmt->close();

        return [
            'success' => true,
            'message' => 'Cantidad actualizada'
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | Vaciar carrito
    |--------------------------------------------------------------------------
    */

    public function clearCart()
    {
        $user = requireAuth();

        $userId = (int) $user['userId'];

        $stmt = $this->db->prepare(
            "DELETE cd
             FROM cart_detail cd
             INNER JOIN cart c
                ON c.id = cd.cart_id
             WHERE c.user_id = ?"
        );

        $stmt->bind_param(
            "i",
            $userId
        );

        if (!$stmt->execute()) {

            $stmt->close();

            return [
                'success' => false,
                'message' => 'No se pudo vaciar el carrito'
            ];
        }

        $stmt->close();

        return [
            'success' => true,
            'message' => 'Carrito vaciado correctamente'
        ];
    }
}
?>
