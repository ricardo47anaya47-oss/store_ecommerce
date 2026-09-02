<?php

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../middleware/auth.php';

class AuthController
{
    private $db;

    public function __construct()
    {
        $this->db = new Database();
    }

    public function register()
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!is_array($data)) {
            return [
                'success' => false,
                'message' => 'Datos inválidos'
            ];
        }

        $name = trim($data['name'] ?? '');
        $lastName = trim($data['lastName'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if ($name === '' || $email === '' || $password === '') {
            return [
                'success' => false,
                'message' => 'Nombre, email y contraseña son requeridos'
            ];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'success' => false,
                'message' => 'El email no es válido'
            ];
        }

        if (strlen($password) < 6) {
            return [
                'success' => false,
                'message' => 'La contraseña debe tener al menos 6 caracteres'
            ];
        }

        $stmt = $this->db->prepare(
            "SELECT id FROM user WHERE email = ? LIMIT 1"
        );

        $stmt->bind_param("s", $email);
        $stmt->execute();

        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            return [
                'success' => false,
                'message' => 'El email ya está registrado'
            ];
        }

        $hashedPassword = password_hash(
            $password,
            PASSWORD_DEFAULT
        );

        $stmt = $this->db->prepare(
            "INSERT INTO user
            (name, last_name, email, password)
            VALUES (?, ?, ?, ?)"
        );

        $stmt->bind_param(
            "ssss",
            $name,
            $lastName,
            $email,
            $hashedPassword
        );

        if (!$stmt->execute()) {
            return [
                'success' => false,
                'message' => 'Error al crear el usuario'
            ];
        }

        $userId = $this->db->lastInsertId();

        $token = createJWT(
            $userId,
            $email
        );

        return [
            'success' => true,
            'message' => 'Registro exitoso',
            'token' => $token,
            'user' => [
                'id' => $userId,
                'name' => $name,
                'lastName' => $lastName,
                'email' => $email
            ]
        ];
    }

    public function login()
    {
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

        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if ($email === '' || $password === '') {
            return [
                'success' => false,
                'message' => 'Email y contraseña son requeridos'
            ];
        }

        $stmt = $this->db->prepare(
            "SELECT id, name, last_name, email, password
             FROM user
             WHERE email = ?
             LIMIT 1"
        );

        $stmt->bind_param("s", $email);
        $stmt->execute();

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Email o contraseña incorrectos'
            ];
        }

        $user = $result->fetch_assoc();

        if (!password_verify($password, $user['password'])) {
            return [
                'success' => false,
                'message' => 'Email o contraseña incorrectos'
            ];
        }

        $token = createJWT(
            $user['id'],
            $user['email']
        );

        return [
            'success' => true,
            'message' => 'Login exitoso',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'lastName' => $user['last_name'],
                'email' => $user['email']
            ]
        ];
    }

    public function profile()
    {
        $user = requireAuth();

        $userId = (int)$user['userId'];

        $stmt = $this->db->prepare(
            "SELECT id, name, last_name, email,
             FROM user
             WHERE id = ?
             LIMIT 1"
        );

        $stmt->bind_param("i", $userId);
        $stmt->execute();

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Usuario no encontrado'
            ];
        }

        $userData = $result->fetch_assoc();

        return [
            'success' => true,
            'user' => [
                'id' => $userData['id'],
                'name' => $userData['name'],
                'lastName' => $userData['last_name'],
                'email' => $userData['email'],
                'created_at' => $userData['created_at']
            ]
        ];
    }
}