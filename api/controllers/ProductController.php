<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../Database.php';

class ProductController {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    // Determina el nombre de la columna ID real (ej. 'id' o 'product_id')
    private function getIdColumn() {
        $columnsRes = $this->db->query("SHOW COLUMNS FROM product");
        $cols = [];
        while ($c = $columnsRes->fetch_assoc()) {
            $cols[] = $c['Field'];
        }

        if (in_array('id', $cols)) return 'id';
        if (in_array('product_id', $cols)) return 'product_id';
        return null;
    }

    // Construye una lista de campos SELECT adaptada al esquema real de la tabla `product`
    private function buildSelectFields() {
        $columnsRes = $this->db->query("SHOW COLUMNS FROM product");
        $cols = [];
        while ($c = $columnsRes->fetch_assoc()) {
            $cols[] = $c['Field'];
        }

        $map = [];
        // id
        if (in_array('id', $cols)) {
            $map[] = 'id';
        } elseif (in_array('product_id', $cols)) {
            $map[] = 'product_id AS id';
        } else {
            $map[] = 'NULL AS id';
        }
        // name
        if (in_array('name', $cols)) {
            $map[] = 'name';
        } elseif (in_array('product_name', $cols)) {
            $map[] = 'product_name AS name';
        } else {
            $map[] = "NULL AS name";
        }
        // description
        $map[] = in_array('description', $cols) ? 'description' : "NULL AS description";
        // price
        if (in_array('price', $cols)) {
            $map[] = 'price';
        } elseif (in_array('cost', $cols)) {
            $map[] = 'cost AS price';
        } else {
            $map[] = "NULL AS price";
        }
        // stock
        $map[] = in_array('stock', $cols) ? 'stock' : "NULL AS stock";
        // image
        $map[] = in_array('image', $cols) ? 'image' : "NULL AS image";
        // category
        $map[] = in_array('category', $cols) ? 'category' : "NULL AS category";

        return implode(', ', $map);
    }

    public function getAll() {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
        $offset = ($page - 1) * $limit;

        // Total de productos
        $countResult = $this->db->query("SELECT COUNT(*) as total FROM product");
        $countData = $countResult->fetch_assoc();
        $total = $countData['total'];

        // Obtener productos
        $fields = $this->buildSelectFields();
        $idCol = $this->getIdColumn() ?: 'id';
        $result = $this->db->query(
            "SELECT $fields FROM product ORDER BY $idCol DESC LIMIT $limit OFFSET $offset"
        );

        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }

        return [
            'success' => true,
            'data' => $products,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => (int)$total,
                'pages' => ceil($total / $limit)
            ]
        ];
    }

    public function getById($id) {
        $id = (int)$id;
        $fields = $this->buildSelectFields();
        $idCol = $this->getIdColumn() ?: 'id';
        $result = $this->db->query(
            "SELECT $fields FROM product WHERE $idCol = $id"
        );

        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Producto no encontrado'
            ];
        }

        return [
            'success' => true,
            'data' => $result->fetch_assoc()
        ];
    }

    public function search() {
        $query = isset($_GET['q']) ? $this->db->escape($_GET['q']) : '';
        
        if (strlen($query) < 2) {
            return [
                'success' => false,
                'message' => 'La búsqueda debe tener al menos 2 caracteres'
            ];
        }

        $fields = $this->buildSelectFields();
        $result = $this->db->query(
            "SELECT $fields FROM product WHERE name LIKE '%$query%' OR description LIKE '%$query%' LIMIT 20"
        );

        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }

        return [
            'success' => true,
            'data' => $products
        ];
    }

    public function getByCategory($category) {
        $category = $this->db->escape($category);
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
        $offset = ($page - 1) * $limit;

        $fields = $this->buildSelectFields();
        $result = $this->db->query(
            "SELECT $fields FROM product WHERE category = '$category' LIMIT $limit OFFSET $offset"
        );

        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }

        return [
            'success' => true,
            'data' => $products
        ];
    }

    public function getCategories() {
        $result = $this->db->query(
            "SELECT DISTINCT category FROM product WHERE category IS NOT NULL ORDER BY category"
        );

        $categories = [];
        while ($row = $result->fetch_assoc()) {
            $categories[] = $row['category'];
        }

        return [
            'success' => true,
            'data' => $categories
        ];
    }
}
?>