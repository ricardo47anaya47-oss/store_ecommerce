<?php

require_once __DIR__ . '/../config.php';

function base64UrlEncode($data)
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data)
{
    return base64_decode(strtr($data, '-_', '+/'));
}

function createJWT($userId, $email)
{
    $header = base64UrlEncode(json_encode([
        "typ" => "JWT",
        "alg" => "HS256"
    ]));

    $payload = base64UrlEncode(json_encode([
        "userId" => $userId,
        "email" => $email,
        "iat" => time(),
        "exp" => time() + 86400
    ]));

    $signature = hash_hmac(
        "sha256",
        "$header.$payload",
        JWT_SECRET,
        true
    );

    $signature = base64UrlEncode($signature);

    return "$header.$payload.$signature";
}

function verifyToken($token)
{
    if (!$token) {
        return null;
    }

    $parts = explode('.', $token);

    if (count($parts) !== 3) {
        return null;
    }

    list($header, $payload, $signature) = $parts;

    $expected = base64UrlEncode(
        hash_hmac(
            "sha256",
            "$header.$payload",
            JWT_SECRET,
            true
        )
    );

    if (!hash_equals($expected, $signature)) {
        return null;
    }

    $payload = json_decode(base64UrlDecode($payload), true);

    if (!$payload) {
        return null;
    }

    if (isset($payload["exp"]) && $payload["exp"] < time()) {
        return null;
    }

    return $payload;
}

function getTokenFromHeader()
{
    $headers = function_exists('getallheaders')
        ? getallheaders()
        : [];

    foreach ($headers as $key => $value) {

        if (strtolower($key) === "authorization") {

            if (preg_match('/Bearer\s+(.*)$/i', $value, $matches)) {
                return trim($matches[1]);
            }
        }
    }

    return null;
}

function requireAuth()
{
    $payload = verifyToken(getTokenFromHeader());

    if (!$payload) {

        http_response_code(401);

        echo json_encode([
            "success" => false,
            "message" => "Token inválido."
        ]);

        exit;
    }

    return $payload;
}