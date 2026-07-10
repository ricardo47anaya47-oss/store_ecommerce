<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../middleware/auth.php';

class CartController {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    private function getCartIdColumn() {
        $columnsRes = $this->db->query("SHOW COLUMNS FROM cart");
        $cols = [];
        while ($c = $columnsRes->fetch_assoc()) {
            $cols[] = $c['Field'];
        }
        if (in_array('cart_id', $cols)) return 'cart_id';
        if (in_array('id', $cols)) return 'id';
        return 'cart_id';
    }

    private function getCartDetailIdColumn() {
        $columnsRes = $this->db->query("SHOW COLUMNS FROM cart_detail");
        $cols = [];
        while ($c = $columnsRes->fetch_assoc()) {
            $cols[] = $c['Field'];
        }
        if (in_array('cart_detail_id', $cols)) return 'cart_detail_id';
        if (in_array('id', $cols)) return 'id';
        return 'id';
    }

    public function getCart() {
        $user = requireAuth();
        $userId = $user['userId'];

        // Obtener carrito
        $cartIdCol = $this->getCartIdColumn();
        $cartResult = $this->db->query("SELECT $cartIdCol as id FROM cart WHERE user_id = $userId");
        
        if ($cartResult->num_rows === 0) {
            return [
                'success' => true,
                'data' => [
                    'items' => [],
                    'total' => 0
                ]
            ];
        }

        $cart = $cartResult->fetch_assoc();
        $cartId = $cart['id'];

        // Obtener items del carrito con precio y nombre
        $itemsResult = $this->db->query(
            "SELECT cart_detail_id as id, product_id, product_name as name, image, price, quantity 
             FROM cart_detail
             WHERE cart_id = $cartId"
        );

        $items = [];
        $total = 0;
        while ($row = $itemsResult->fetch_assoc()) {
            $row['subtotal'] = $row['price'] * $row['quantity'];
            $total += $row['subtotal'];
            $items[] = $row;
        }

        return [
            'success' => true,
            'data' => [
                'cartId' => $cartId,
                'items' => $items,
                'total' => $total
            ]
        ];
    }

    public function addToCart() {
        $user = requireAuth();
        $userId = $user['userId'];
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['productId']) || !isset($data['quantity'])) {
            return [
                'success' => false,
                'message' => 'productId y quantity son requeridos'
            ];
        }

        $productId = (int)$data['productId'];
        $quantity = (int)$data['quantity'];
        $price = isset($data['price']) ? (float)$data['price'] : 0;
        $productName = isset($data['productName']) ? $this->db->escape($data['productName']) : '';
        $image = isset($data['image']) ? $this->db->escape($data['image']) : '';
        $cartIdCol = $this->getCartIdColumn();

        try {
            // Desactivar validación de FK temporalmente
            $this->db->query("SET FOREIGN_KEY_CHECKS=0");
            
            // Obtener o crear carrito
            $cartResult = $this->db->query("SELECT $cartIdCol as id FROM cart WHERE user_id = $userId");
            
            if (!$cartResult || $cartResult->num_rows === 0) {
                $this->db->query("INSERT INTO cart (user_id, created_at) VALUES ($userId, NOW())");
                $cartId = $this->db->lastInsertId();
            } else {
                $cart = $cartResult->fetch_assoc();
                $cartId = $cart['id'];
            }

            // Verificar si el producto ya existe en el carrito
            $itemResult = $this->db->query(
                "SELECT * FROM cart_detail WHERE cart_id = $cartId AND product_id = $productId"
            );

            if ($itemResult && $itemResult->num_rows > 0) {
                // Actualizar cantidad (mantener el precio anterior)
                $this->db->query(
                    "UPDATE cart_detail SET quantity = quantity + $quantity WHERE cart_id = $cartId AND product_id = $productId"
                );
            } else {
                // Insertar nuevo item con precio, nombre e imagen
                $this->db->query(
                    "INSERT INTO cart_detail (cart_id, product_id, product_name, image, price, quantity) VALUES ($cartId, $productId, '$productName', '$image', $price, $quantity)"
                );
            }
            
            // Reactivar validación de FK
            $this->db->query("SET FOREIGN_KEY_CHECKS=1");

            return [
                'success' => true,
                'message' => 'Producto agregado al carrito'
            ];
        } catch (Exception $e) {
            // Reactivar FK en caso de error
            $this->db->query("SET FOREIGN_KEY_CHECKS=1");
            
            return [
                'success' => false,
                'message' => 'Error al agregar al carrito',
                'error' => $e->getMessage()
            ];
        }
    }

    public function removeFromCart() {
        $user = requireAuth();
        $userId = $user['userId'];
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['cartDetailId'])) {
            return [
                'success' => false,
                'message' => 'cartDetailId es requerido'
            ];
        }

        $cartDetailId = (int)$data['cartDetailId'];
        $cartDetailIdCol = $this->getCartDetailIdColumn();

        $this->db->query("DELETE FROM cart_detail WHERE $cartDetailIdCol = $cartDetailId");

        return [
            'success' => true,
            'message' => 'Producto removido del carrito'
        ];
    }

    public function updateQuantity() {
        $user = requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['cartDetailId']) || !isset($data['quantity'])) {
            return [
                'success' => false,
                'message' => 'cartDetailId y quantity son requeridos'
            ];
        }

        $cartDetailId = (int)$data['cartDetailId'];
        $quantity = (int)$data['quantity'];
        $cartDetailIdCol = $this->getCartDetailIdColumn();

        if ($quantity <= 0) {
            $this->db->query("DELETE FROM cart_detail WHERE $cartDetailIdCol = $cartDetailId");
        } else {
            $this->db->query("UPDATE cart_detail SET quantity = $quantity WHERE $cartDetailIdCol = $cartDetailId");
        }

        return [
            'success' => true,
            'message' => 'Cantidad actualizada'
        ];
    }

    public function clearCart() {
        $user = requireAuth();
        $userId = $user['userId'];
        $cartIdCol = $this->getCartIdColumn();

        $cartResult = $this->db->query("SELECT $cartIdCol as id FROM cart WHERE user_id = $userId");
        
        if ($cartResult->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Carrito no encontrado'
            ];
        }

        $cart = $cartResult->fetch_assoc();
        $cartId = $cart['id'];

        $this->db->query("DELETE FROM cart_detail WHERE cart_id = $cartId");

        return [
            'success' => true,
            'message' => 'Carrito vaciado'
        ];
    }
}
?>