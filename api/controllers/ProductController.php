<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../Database.php';

class ProductController {
    private $db;

    public function __construct() {
        $this->db = new Database();
        $this->ensureProductsTable();
    }

    private function ensureProductsTable() {
        $tableExists = $this->db->query("SHOW TABLES LIKE 'product'");
        if ($tableExists && $tableExists->num_rows > 0) {
            return;
        }

        $this->db->query(
            "CREATE TABLE IF NOT EXISTS product (
                id INT NOT NULL AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                description TEXT NULL,
                price DECIMAL(10,2) NOT NULL DEFAULT 0,
                stock INT NOT NULL DEFAULT 0,
                image VARCHAR(500) NULL,
                category VARCHAR(120) NULL,
                rating DECIMAL(4,2) NULL,
                brand VARCHAR(120) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );
    }

    private function getIdColumn() {
        $columnsRes = $this->db->query("SHOW COLUMNS FROM product");
        $cols = [];
        while ($c = $columnsRes->fetch_assoc()) {
            $cols[] = $c['Field'];
        }

        if (in_array('id', $cols)) return 'id';
        if (in_array('product_id', $cols)) return 'product_id';
        return 'id';
    }

    private function buildSelectFields() {
        $columnsRes = $this->db->query("SHOW COLUMNS FROM product");
        $cols = [];
        while ($c = $columnsRes->fetch_assoc()) {
            $cols[] = $c['Field'];
        }

        $map = [];
        if (in_array('id', $cols)) {
            $map[] = 'id';
        } elseif (in_array('product_id', $cols)) {
            $map[] = 'product_id AS id';
        } else {
            $map[] = 'NULL AS id';
        }

        if (in_array('name', $cols)) {
            $map[] = 'name';
        } elseif (in_array('product_name', $cols)) {
            $map[] = 'product_name AS name';
        } else {
            $map[] = 'NULL AS name';
        }

        $map[] = in_array('description', $cols) ? 'description' : 'NULL AS description';

        if (in_array('price', $cols)) {
            $map[] = 'price';
        } elseif (in_array('cost', $cols)) {
            $map[] = 'cost AS price';
        } else {
            $map[] = 'NULL AS price';
        }

        $map[] = in_array('stock', $cols) ? 'stock' : 'NULL AS stock';
        $map[] = in_array('image', $cols) ? 'image' : 'NULL AS image';
        $map[] = in_array('category', $cols) ? 'category' : 'NULL AS category';

        return implode(', ', $map);
    }

    private function externalRequest($endpoint, $query = []) {
        $url = PRODUCT_API_BASE_URL . $endpoint;

        if (!empty($query)) {
            $url .= '?' . http_build_query($query);
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => PRODUCT_API_TIMEOUT,
                'header' => "Accept: application/json\r\nUser-Agent: StoreEcommerce/1.0\r\n"
            ]
        ]);

        $response = @file_get_contents($url, false, $context);
        if ($response === false) {
            return null;
        }

        $decoded = json_decode($response, true);
        return is_array($decoded) ? $decoded : null;
    }

    private function normalizeProduct($product) {
        if (!is_array($product)) {
            return null;
        }

        return [
            'id' => (int)($product['id'] ?? 0),
            'name' => $product['title'] ?? $product['name'] ?? 'Producto sin nombre',
            'description' => $product['description'] ?? '',
            'price' => isset($product['price']) ? (float)$product['price'] : 0,
            'stock' => isset($product['stock']) ? (int)$product['stock'] : 0,
            'image' => $product['thumbnail'] ?? $product['image'] ?? '',
            'category' => $product['category'] ?? '',
            'rating' => isset($product['rating']) ? (float)$product['rating'] : 0,
            'brand' => $product['brand'] ?? ''
        ];
    }

    private function syncProductsFromExternal($products) {
        if (!is_array($products) || empty($products)) {
            return;
        }

        $tableExists = $this->db->query("SHOW TABLES LIKE 'product'");
        if (!$tableExists || $tableExists->num_rows === 0) {
            return;
        }

        foreach ($products as $product) {
            $normalized = $this->normalizeProduct($product);
            if (!$normalized) {
                continue;
            }

            $id = (int)$normalized['id'];
            $name = $this->db->escape($normalized['name']);
            $description = $this->db->escape($normalized['description']);
            $price = (float)$normalized['price'];
            $stock = (int)$normalized['stock'];
            $image = $this->db->escape($normalized['image']);
            $category = $this->db->escape($normalized['category']);
            $rating = (float)$normalized['rating'];
            $brand = $this->db->escape($normalized['brand']);

            $existing = $this->db->query("SELECT id FROM product WHERE id = $id");
            if ($existing && $existing->num_rows > 0) {
                $this->db->query(
                    "UPDATE product SET name = '$name', description = '$description', price = $price, stock = $stock, image = '$image', category = '$category', rating = $rating, brand = '$brand', updated_at = NOW() WHERE id = $id"
                );
            } else {
                $this->db->query(
                    "INSERT INTO product (id, name, description, price, stock, image, category, rating, brand, created_at, updated_at) VALUES ($id, '$name', '$description', $price, $stock, '$image', '$category', $rating, '$brand', NOW(), NOW())"
                );
            }
        }
    }

    private function readFallbackProducts() {
        $result = $this->db->query("SELECT * FROM product ORDER BY id DESC LIMIT 50");
        $rows = [];
        while ($row = $result->fetch_assoc()) {
            $rows[] = $row;
        }
        return $rows;
    }

    public function getAll() {
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 12;
        $skip = ($page - 1) * $limit;

        $external = $this->externalRequest('/products', ['limit' => $limit, 'skip' => $skip]);
        if (is_array($external) && isset($external['products'])) {
            $this->syncProductsFromExternal($external['products']);
            return [
                'success' => true,
                'data' => $external['products'],
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => (int)($external['total'] ?? 0),
                    'pages' => (int)ceil((int)($external['total'] ?? 0) / $limit)
                ]
            ];
        }

        $products = $this->readFallbackProducts();
        return [
            'success' => true,
            'data' => $products,
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => count($products), 'pages' => 1]
        ];
    }

    public function getById($id) {
        $external = $this->externalRequest('/products/' . (int)$id);
        if (is_array($external) && !empty($external['id'])) {
            $this->syncProductsFromExternal([$external]);
            return ['success' => true, 'data' => $external];
        }

        $result = $this->db->query("SELECT * FROM product WHERE id = " . (int)$id);
        if ($result && $result->num_rows > 0) {
            return ['success' => true, 'data' => $result->fetch_assoc()];
        }

        return ['success' => false, 'message' => 'Producto no encontrado'];
    }

    public function search() {
        $query = isset($_GET['q']) ? trim($_GET['q']) : '';
        if (strlen($query) < 2) {
            return ['success' => false, 'message' => 'La búsqueda debe tener al menos 2 caracteres'];
        }

        $external = $this->externalRequest('/products/search', ['q' => $query]);
        if (is_array($external) && isset($external['products'])) {
            $this->syncProductsFromExternal($external['products']);
            return ['success' => true, 'data' => $external['products']];
        }

        $safeQuery = $this->db->escape($query);
        $result = $this->db->query("SELECT * FROM product WHERE name LIKE '%$safeQuery%' OR description LIKE '%$safeQuery%' LIMIT 20");
        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }
        return ['success' => true, 'data' => $products];
    }

    public function getByCategory($category) {
        $category = trim((string)$category);
        $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? max(1, (int)$_GET['limit']) : 12;
        $skip = ($page - 1) * $limit;

        $external = $this->externalRequest('/products/category/' . urlencode($category), ['limit' => $limit, 'skip' => $skip]);
        if (is_array($external) && isset($external['products'])) {
            $this->syncProductsFromExternal($external['products']);
            return [
                'success' => true,
                'data' => $external['products'],
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => (int)($external['total'] ?? count($external['products'])),
                    'pages' => (int)ceil((int)($external['total'] ?? count($external['products'])) / $limit)
                ]
            ];
        }

        $safeCategory = $this->db->escape($category);
        $result = $this->db->query("SELECT * FROM product WHERE category = '$safeCategory' ORDER BY id DESC LIMIT $limit OFFSET $skip");
        $products = [];
        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }

        return ['success' => true, 'data' => $products];
    }

    public function getCategories() {
        $external = $this->externalRequest('/products/categories');
        if (is_array($external)) {
            return ['success' => true, 'data' => $external];
        }

        $result = $this->db->query("SELECT DISTINCT category FROM product WHERE category IS NOT NULL AND category != '' ORDER BY category");
        $categories = [];
        while ($row = $result->fetch_assoc()) {
            $categories[] = $row['category'];
        }
        return ['success' => true, 'data' => $categories];
    }
}
?>
