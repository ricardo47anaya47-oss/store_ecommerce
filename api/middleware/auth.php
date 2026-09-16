<?php
require_once __DIR__ . '/../config.php';

function decodeJWT($token) {
    $parts = explode('.', $token);
    
    if (count($parts) !== 3) {
        return null;
    }

    $payload = json_decode(base64_decode($parts[1]), true);
    return $payload;
}

function verifyToken($token) {
    if (!$token) {
        return null;
    }

    $decoded = decodeJWT($token);
    
    if (!$decoded) {
        return null;
    }

    // Verificar expiración
    if (isset($decoded['exp']) && $decoded['exp'] < time()) {
        return null;
    }

    return $decoded;
}

function getTokenFromHeader() {
    $headers = getallheaders();
    
    if (isset($headers['Authorization'])) {
        preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches);
        return $matches[1] ?? null;
    }
    
    return null;
}

function createJWT($userId, $email) {
    $header = json_encode(['typ' => 'JWT', 'alg' => JWT_ALGORITHM]);
    $payload = json_encode([
        'userId' => $userId,
        'email' => $email,
        'iat' => time(),
        'exp' => time() + (24 * 60 * 60) // 24 horas
    ]);
    
    $header = base64_encode($header);
    $payload = base64_encode($payload);
    $signature = hash_hmac('sha256', "$header.$payload", JWT_SECRET, true);
    $signature = base64_encode($signature);
    
    return "$header.$payload.$signature";
}

function requireAuth() {
    $token = getTokenFromHeader();
    $decoded = verifyToken($token);
    
    if (!$decoded) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Token no válido o expirado'
        ]);
        exit;
    }
    
    return $decoded;
}
?>
