<?php

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../Database.php';

class ProductController
{
    private $db;

    public function __construct()
    {
        $this->db = new Database();
    }

    /**
     * Campos reales de la tabla product
     */
    private function getSelectFields()
    {
        return "
            id,
            title,
            description,
            price,
            category,
            stock,
            image_url,
            rating,
            created_at
        ";
    }

    /**
     * Obtener parámetros de paginación
     */
    private function getPagination()
    {
        $page = isset($_GET['page'])
            ? (int) $_GET['page']
            : 1;

        $limit = isset($_GET['limit'])
            ? (int) $_GET['limit']
            : 12;

        /*
         * Evitar páginas menores a 1
         */
        if ($page < 1) {
            $page = 1;
        }

        /*
         * Limitar cantidad de productos por página
         */
        if ($limit < 1) {
            $limit = 12;
        }

        if ($limit > 100) {
            $limit = 100;
        }

        $offset = ($page - 1) * $limit;

        return [
            'page' => $page,
            'limit' => $limit,
            'offset' => $offset
        ];
    }


    /**
     * Obtener todos los productos
     */
    public function getAll()
    {
        $pagination = $this->getPagination();

        $page = $pagination['page'];
        $limit = $pagination['limit'];
        $offset = $pagination['offset'];

        /*
         * Total de productos
         */
        $countResult = $this->db->query(
            "SELECT COUNT(*) AS total
             FROM product"
        );

        if (!$countResult) {
            return [
                'success' => false,
                'message' => 'No se pudo obtener el total de productos'
            ];
        }

        $countData = $countResult->fetch_assoc();

        $total = (int) $countData['total'];

        /*
         * Obtener productos
         */
        $stmt = $this->db->prepare(
            "SELECT
                id,
                title,
                description,
                price,
                category,
                stock,
                image_url,
                rating,
                created_at
             FROM product
             ORDER BY id DESC
             LIMIT ?
             OFFSET ?"
        );

        $stmt->bind_param(
            "ii",
            $limit,
            $offset
        );

        if (!$stmt->execute()) {
            $stmt->close();

            return [
                'success' => false,
                'message' => 'No se pudieron obtener los productos'
            ];
        }

        $result = $stmt->get_result();

        $products = [];

        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }

        $stmt->close();

        return [
            'success' => true,
            'data' => $products,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => $total > 0
                    ? (int) ceil($total / $limit)
                    : 0
            ]
        ];
    }


    /**
     * Obtener producto por ID
     */
    public function getById($id)
    {
        $id = (int) $id;

        if ($id <= 0) {
            return [
                'success' => false,
                'message' => 'ID de producto inválido'
            ];
        }

        $stmt = $this->db->prepare(
            "SELECT
                id,
                title,
                description,
                price,
                category,
                stock,
                image_url,
                rating,
                created_at
             FROM product
             WHERE id = ?
             LIMIT 1"
        );

        $stmt->bind_param("i", $id);

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

        return [
            'success' => true,
            'data' => $product
        ];
    }


    /**
     * Buscar productos
     */
    public function search()
    {
        $query = isset($_GET['q'])
            ? trim($_GET['q'])
            : '';

        if (strlen($query) < 2) {
            return [
                'success' => false,
                'message' => 'La búsqueda debe tener al menos 2 caracteres'
            ];
        }

        $search = '%' . $query . '%';

        $stmt = $this->db->prepare(
            "SELECT
                id,
                title,
                description,
                price,
                category,
                stock,
                image_url,
                rating,
                created_at
             FROM product
             WHERE title LIKE ?
                OR description LIKE ?
                OR category LIKE ?
             ORDER BY id DESC
             LIMIT 20"
        );

        $stmt->bind_param(
            "sss",
            $search,
            $search,
            $search
        );

        if (!$stmt->execute()) {
            $stmt->close();

            return [
                'success' => false,
                'message' => 'No se pudo realizar la búsqueda'
            ];
        }

        $result = $stmt->get_result();

        $products = [];

        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }

        $stmt->close();

        return [
            'success' => true,
            'data' => $products
        ];
    }


    /**
     * Obtener productos por categoría
     */
    public function getByCategory($category)
    {
        $category = trim($category);

        if ($category === '') {
            return [
                'success' => false,
                'message' => 'La categoría es obligatoria'
            ];
        }

        $pagination = $this->getPagination();

        $page = $pagination['page'];
        $limit = $pagination['limit'];
        $offset = $pagination['offset'];

        /*
         * Obtener total de productos de la categoría
         */
        $stmtCount = $this->db->prepare(
            "SELECT COUNT(*) AS total
             FROM product
             WHERE category = ?"
        );

        $stmtCount->bind_param(
            "s",
            $category
        );

        if (!$stmtCount->execute()) {
            $stmtCount->close();

            return [
                'success' => false,
                'message' => 'No se pudo consultar la categoría'
            ];
        }

        $countResult = $stmtCount->get_result();

        $countData = $countResult->fetch_assoc();

        $total = (int) $countData['total'];

        $stmtCount->close();

        /*
         * Obtener productos
         */
        $stmt = $this->db->prepare(
            "SELECT
                id,
                title,
                description,
                price,
                category,
                stock,
                image_url,
                rating,
                created_at
             FROM product
             WHERE category = ?
             ORDER BY id DESC
             LIMIT ?
             OFFSET ?"
        );

        $stmt->bind_param(
            "sii",
            $category,
            $limit,
            $offset
        );

        if (!$stmt->execute()) {
            $stmt->close();

            return [
                'success' => false,
                'message' => 'No se pudieron obtener los productos'
            ];
        }

        $result = $stmt->get_result();

        $products = [];

        while ($row = $result->fetch_assoc()) {
            $products[] = $row;
        }

        $stmt->close();

        return [
            'success' => true,
            'data' => $products,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => $total > 0
                    ? (int) ceil($total / $limit)
                    : 0
            ]
        ];
    }


    /**
     * Obtener categorías
     */
    public function getCategories()
    {
        $result = $this->db->query(
            "SELECT DISTINCT category
             FROM product
             WHERE category IS NOT NULL
             AND category <> ''
             ORDER BY category ASC"
        );

        if (!$result) {
            return [
                'success' => false,
                'message' => 'No se pudieron obtener las categorías'
            ];
        }

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