<?php
header('Content-Type: application/json');

// Verificar que la API devuelve datos
$response = file_get_contents('http://localhost/store_ecommerce/api/products?page=1&limit=2');
$data = json_decode($response, true);

echo json_encode([
    'api_response' => $data,
    'has_success' => isset($data['success']),
    'success_value' => $data['success'] ?? 'NO EXISTE',
    'has_data' => isset($data['data']),
    'data_count' => count($data['data'] ?? []),
    'has_pagination' => isset($data['pagination']),
    'pagination' => $data['pagination'] ?? null
], JSON_PRETTY_PRINT);
?>
