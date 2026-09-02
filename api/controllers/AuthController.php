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

    /**
     * Registrar usuario
     */
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
        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        // Validaciones
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

        // Verificar si el email ya existe
        $stmt = $this->db->prepare(
            "SELECT id
             FROM user
             WHERE email = ?
             LIMIT 1"
        );

        if (!$stmt) {
            return [
                'success' => false,
                'message' => 'Error interno del servidor'
            ];
        }

        $stmt->bind_param("s", $email);

        if (!$stmt->execute()) {
            $stmt->close();

            return [
                'success' => false,
                'message' => 'Error al verificar el usuario'
            ];
        }

        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $stmt->close();

            return [
                'success' => false,
                'message' => 'El email ya está registrado'
            ];
        }

        $stmt->close();

        // Encriptar contraseña
        $hashedPassword = password_hash(
            $password,
            PASSWORD_DEFAULT
        );

        if ($hashedPassword === false) {
            return [
                'success' => false,
                'message' => 'Error al proteger la contraseña'
            ];
        }

        // Crear usuario
        $stmt = $this->db->prepare(
            "INSERT INTO user
            (name, last_name, email, password)
            VALUES (?, ?, ?, ?)"
        );

        if (!$stmt) {
            return [
                'success' => false,
                'message' => 'Error interno del servidor'
            ];
        }

        $stmt->bind_param(
            "ssss",
            $name,
            $lastName,
            $email,
            $hashedPassword
        );

        if (!$stmt->execute()) {
            $stmt->close();

            return [
                'success' => false,
                'message' => 'Error al crear el usuario'
            ];
        }

        $userId = $this->db->lastInsertId();

        $stmt->close();

        // Crear JWT
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

    /**
     * Iniciar sesión
     */
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

        $email = strtolower(trim($data['email'] ?? ''));
        $password = $data['password'] ?? '';

        if ($email === '' || $password === '') {
            return [
                'success' => false,
                'message' => 'Email y contraseña son requeridos'
            ];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'success' => false,
                'message' => 'El email no es válido'
            ];
        }

        $stmt = $this->db->prepare(
            "SELECT id, name, last_name, email, password
             FROM user
             WHERE email = ?
             LIMIT 1"
        );

        if (!$stmt) {
            return [
                'success' => false,
                'message' => 'Error interno del servidor'
            ];
        }

        $stmt->bind_param("s", $email);

        if (!$stmt->execute()) {
            $stmt->close();

            return [
                'success' => false,
                'message' => 'Error al iniciar sesión'
            ];
        }

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $stmt->close();

            return [
                'success' => false,
                'message' => 'Email o contraseña incorrectos'
            ];
        }

        $user = $result->fetch_assoc();

        $stmt->close();

        // Verificar contraseña
        if (!password_verify($password, $user['password'])) {
            return [
                'success' => false,
                'message' => 'Email o contraseña incorrectos'
            ];
        }

        // Crear JWT
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

    /**
     * Obtener perfil del usuario autenticado
     */
    public function profile()
    {
        $user = requireAuth();

        if (!isset($user['userId'])) {
            return [
                'success' => false,
                'message' => 'Token inválido'
            ];
        }

        $userId = (int)$user['userId'];

        $stmt = $this->db->prepare(
            "SELECT id, name, last_name, email
             FROM user
             WHERE id = ?
             LIMIT 1"
        );

        if (!$stmt) {
            return [
                'success' => false,
                'message' => 'Error interno del servidor'
            ];
        }

        $stmt->bind_param("i", $userId);

        if (!$stmt->execute()) {
            $stmt->close();

            return [
                'success' => false,
                'message' => 'Error al obtener el perfil'
            ];
        }

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            $stmt->close();

            return [
                'success' => false,
                'message' => 'Usuario no encontrado'
            ];
        }

        $userData = $result->fetch_assoc();

        $stmt->close();

        return [
            'success' => true,
            'user' => [
                'id' => $userData['id'],
                'name' => $userData['name'],
                'lastName' => $userData['last_name'],
                'email' => $userData['email']
            ]
        ];
    }
}
?>
