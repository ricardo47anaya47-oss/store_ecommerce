<?php

require_once __DIR__ . '/../config.php';

/*
|--------------------------------------------------------------------------
| Base64 URL Encode
|--------------------------------------------------------------------------
*/

function base64UrlEncode($data)
{
    return rtrim(
        strtr(
            base64_encode($data),
            '+/',
            '-_'
        ),
        '='
    );
}

/*
|--------------------------------------------------------------------------
| Base64 URL Decode
|--------------------------------------------------------------------------
*/

function base64UrlDecode($data)
{
    $remainder = strlen($data) % 4;

    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }

    return base64_decode(
        strtr(
            $data,
            '-_',
            '+/'
        )
    );
}

/*
|--------------------------------------------------------------------------
| Crear JWT
|--------------------------------------------------------------------------
*/

function createJWT($userId, $email)
{
    $header = base64UrlEncode(
        json_encode([
            'typ' => 'JWT',
            'alg' => JWT_ALGORITHM
        ])
    );

    $payload = base64UrlEncode(
        json_encode([
            'userId' => (int) $userId,
            'email' => $email,
            'iat' => time(),
            'exp' => time() + 86400
        ])
    );

    $signature = hash_hmac(
        'sha256',
        $header . '.' . $payload,
        JWT_SECRET,
        true
    );

    $signature = base64UrlEncode($signature);

    return $header . '.' . $payload . '.' . $signature;
}

/*
|--------------------------------------------------------------------------
| Verificar JWT
|--------------------------------------------------------------------------
*/

function verifyToken($token)
{
    if (!$token || !is_string($token)) {
        return null;
    }

    $parts = explode('.', $token);

    if (count($parts) !== 3) {
        return null;
    }

    [$header, $payload, $signature] = $parts;

    /*
     * Verificar firma
     */

    $expectedSignature = base64UrlEncode(
        hash_hmac(
            'sha256',
            $header . '.' . $payload,
            JWT_SECRET,
            true
        )
    );

    if (!hash_equals($expectedSignature, $signature)) {
        return null;
    }

    /*
     * Decodificar payload
     */

    $decodedPayload = base64UrlDecode($payload);

    if ($decodedPayload === false) {
        return null;
    }

    $payloadData = json_decode(
        $decodedPayload,
        true
    );

    if (!is_array($payloadData)) {
        return null;
    }

    /*
     * Verificar expiración
     */

    if (
        !isset($payloadData['exp']) ||
        (int) $payloadData['exp'] < time()
    ) {
        return null;
    }

    /*
     * Verificar usuario
     */

    if (
        !isset($payloadData['userId']) ||
        !is_numeric($payloadData['userId']) ||
        (int) $payloadData['userId'] <= 0
    ) {
        return null;
    }

    return $payloadData;
}

/*
|--------------------------------------------------------------------------
| Obtener Authorization Header
|--------------------------------------------------------------------------
*/

function getTokenFromHeader()
{
    $authorization = null;

    /*
     * Método 1: getallheaders()
     */

    if (function_exists('getallheaders')) {

        $headers = getallheaders();

        foreach ($headers as $key => $value) {

            if (strtolower($key) === 'authorization') {
                $authorization = $value;
                break;
            }
        }
    }

    /*
     * Método 2: HTTP_AUTHORIZATION
     */

    if (
        !$authorization &&
        isset($_SERVER['HTTP_AUTHORIZATION'])
    ) {
        $authorization = $_SERVER['HTTP_AUTHORIZATION'];
    }

    /*
     * Método 3: REDIRECT_HTTP_AUTHORIZATION
     */

    if (
        !$authorization &&
        isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])
    ) {
        $authorization = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    if (!$authorization) {
        return null;
    }

    /*
     * Extraer Bearer token
     */

    if (
        preg_match(
            '/^Bearer\s+(.+)$/i',
            trim($authorization),
            $matches
        )
    ) {
        return trim($matches[1]);
    }

    return null;
}

/*
|--------------------------------------------------------------------------
| Proteger rutas
|--------------------------------------------------------------------------
*/

function requireAuth()
{
    $token = getTokenFromHeader();

    $payload = verifyToken($token);

    if (!$payload) {

        http_response_code(401);

        header(
            'Content-Type: application/json; charset=utf-8'
        );

        echo json_encode([
            'success' => false,
            'message' => 'Token inválido o expirado.'
        ]);

        exit;
    }

    return $payload;
}
?>
