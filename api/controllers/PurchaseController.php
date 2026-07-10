<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../middleware/auth.php';

class PurchaseController {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    private function getPurchaseIdColumn() {
        return 'id'; // Columna primaria
    }

    private function getProductIdColumn() {
        return 'id'; // Columna primaria
    }

    private function getCartIdColumn() {
        return 'id'; // Columna primaria
    }

    public function createPurchase() {
        $user = requireAuth();
        $userId = $user['userId'];
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            // Obtener carrito
            $cartIdCol = $this->getCartIdColumn();
            $cartResult = $this->db->query("SELECT $cartIdCol as id FROM cart WHERE user_id = $userId");
            
            if ($cartResult->num_rows === 0) {
                return [
                    'success' => false,
                    'message' => 'No hay carrito asociado'
                ];
            }

            $cart = $cartResult->fetch_assoc();
            $cartId = $cart['id'];

            // Obtener items del carrito
            $itemsResult = $this->db->query(
                "SELECT product_id, price, quantity, product_name
                 FROM cart_detail
                 WHERE cart_id = $cartId"
            );

            if ($itemsResult->num_rows === 0) {
                return [
                    'success' => false,
                    'message' => 'El carrito está vacío'
                ];
            }

            // Calcular total
            $total = 0;
            $items = [];
            while ($row = $itemsResult->fetch_assoc()) {
                $subtotal = $row['price'] * $row['quantity'];
                $total += $subtotal;
                $items[] = $row;
            }

            // Crear compra
            $status = $data['status'] ?? 'pending';
            $paymentMethod = $this->db->escape($data['paymentMethod'] ?? 'credit_card');
            $shippingAddress = $this->db->escape($data['shippingAddress'] ?? '');

            $insertQuery = "INSERT INTO purchase (cart_id, user_id, total, status, payment_method, shipping_address, created_at) 
                           VALUES ($cartId, $userId, $total, '$status', '$paymentMethod', '$shippingAddress', NOW())";
            
            $insertResult = $this->db->getConnection()->query($insertQuery);
            
            if (!$insertResult) {
                error_log("Error al crear compra: " . $this->db->getConnection()->error);
                return [
                    'success' => false,
                    'message' => 'Error al crear la compra',
                    'error' => $this->db->getConnection()->error
                ];
            }

            $purchaseId = $this->db->lastInsertId();

            // Crear detalles de compra desde cart_detail
            $itemsResult2 = $this->db->query(
                "SELECT product_id, price, quantity, product_name
                 FROM cart_detail
                 WHERE cart_id = $cartId"
            );

            while ($row = $itemsResult2->fetch_assoc()) {
                $productId = $row['product_id'];
                $price = $row['price'];
                $quantity = $row['quantity'];
                $name = $this->db->escape($row['product_name'] ?: 'Producto');

                $detailQuery = "INSERT INTO purchase_detail (purchase_id, product_id, product_name, price, quantity) 
                     VALUES ($purchaseId, $productId, '$name', $price, $quantity)";
                
                $detailResult = $this->db->getConnection()->query($detailQuery);
                
                if (!$detailResult) {
                    error_log("Error al crear detalle: " . $this->db->getConnection()->error);
                }

                // Intentar actualizar stock solo si el producto existe en la tabla local
                $productIdCol = $this->getProductIdColumn();
                $this->db->getConnection()->query(
                    "UPDATE product SET stock = stock - $quantity WHERE $productIdCol = $productId"
                );
            }

            // Limpiar carrito
            $this->db->query("DELETE FROM cart_detail WHERE cart_id = $cartId");

            return [
                'success' => true,
                'message' => 'Compra creada exitosamente',
                'purchase' => [
                    'id' => $purchaseId,
                    'total' => $total,
                    'status' => $status,
                    'itemsCount' => count($items)
                ]
            ];
        } catch (Exception $e) {
            error_log("Exception en createPurchase: " . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al crear la compra',
                'error' => $e->getMessage()
            ];
        }
    }

    public function getUserPurchases() {
        $user = requireAuth();
        $userId = $user['userId'];

        $idCol = $this->getPurchaseIdColumn();
        $result = $this->db->query(
            "SELECT $idCol as id, total, status, payment_method, created_at 
             FROM purchase 
             WHERE user_id = $userId 
             ORDER BY created_at DESC"
        );

        $purchases = [];
        while ($row = $result->fetch_assoc()) {
            $purchases[] = $row;
        }

        return [
            'success' => true,
            'data' => $purchases
        ];
    }

    public function getPurchaseById($id) {
        $user = requireAuth();
        $userId = $user['userId'];
        $id = (int)$id;

        $idCol = $this->getPurchaseIdColumn();
        $purchaseResult = $this->db->query(
            "SELECT $idCol as id, total, status, payment_method, shipping_address, created_at 
             FROM purchase 
             WHERE $idCol = $id AND user_id = $userId"
        );

        if ($purchaseResult->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Compra no encontrada'
            ];
        }

        $purchase = $purchaseResult->fetch_assoc();

        // Obtener detalles de la compra
        $detailsResult = $this->db->query(
            "SELECT product_id, product_name, price, quantity 
             FROM purchase_detail 
             WHERE purchase_id = $id"
        );

        $details = [];
        while ($row = $detailsResult->fetch_assoc()) {
            $details[] = $row;
        }

        return [
            'success' => true,
            'data' => array_merge($purchase, ['details' => $details])
        ];
    }
}
?>
