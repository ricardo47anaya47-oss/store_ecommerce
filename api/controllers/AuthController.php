<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../middleware/auth.php';

$allowedOrigins = [
    'https://ce-six.vercel.app',
    'https://store-ecommerce-six.vercel.app',
    'http://localhost',
    'http://localhost:5173',
    'http://127.0.0.1',
    'http://127.0.0.1:5173'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
} else {
    header('Access-Control-Allow-Origin: *');
}

header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Origin, Accept");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

class AuthController {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    private function getUserIdColumn() {
        return 'id'; // Columna primaria
    }

    public function register() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['email']) || !isset($data['password']) || !isset($data['name'])) {
            return [
                'success' => false,
                'message' => 'Email, contraseña y nombre son requeridos'
            ];
        }

        $email = $this->db->escape($data['email']);
        $name = $this->db->escape($data['name']);
        $lastName = isset($data['lastName']) ? $this->db->escape($data['lastName']) : '';
        $password = password_hash($data['password'], PASSWORD_DEFAULT);

        $stmt = $this->db->prepare("SELECT id FROM user WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            return [
                'success' => false,
                'message' => 'El email ya está registrado'
            ];
        }

        $stmt = $this->db->prepare("INSERT INTO user(name, last_name, email, password, created_at) VALUES (?, ?, ?, ?, NOW())");
        $stmt->bind_param("ssss", $name, $lastName, $email, $password);

        if (!$stmt->execute()) {
            return [
                'success' => false,
                'message' => 'Error en el registro'
            ];
        }

        $userId = $this->db->lastInsertId();
        $token = createJWT($userId, $email);

        return [
            'success' => true,
            'message' => 'Registro exitoso',
            'token' => $token,
            'user' => [
                'id' => $userId,
                'name' => $name,
                'email' => $email
            ]
        ];
    }

    public function login() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['email']) || !isset($data['password'])) {
            return [
                'success' => false,
                'message' => 'Email y contraseña son requeridos'
            ];
        }

        $email = $this->db->escape($data['email']);

        $idCol = $this->getUserIdColumn();
        $result = $this->db->query("SELECT $idCol as id, name, email, password FROM user WHERE email = '$email'");
        
        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'El email no está registrado'
            ];
        }

        $user = $result->fetch_assoc();

        if (!password_verify($data['password'], $user['password'])) {
            return [
                'success' => false,
                'message' => 'Contraseña incorrecta'
            ];
        }

        $token = createJWT($user['id'], $user['email']);

        return [
            'success' => true,
            'message' => 'Login exitoso',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email']
            ]
        ];
    }

    public function profile() {
        $user = requireAuth();
        $userId = $user['userId'];
        $idCol = $this->getUserIdColumn();
        $result = $this->db->query("SELECT $idCol as id, name, email, created_at FROM user WHERE $idCol = $userId");
        
        if ($result->num_rows === 0) {
            return [
                'success' => false,
                'message' => 'Usuario no encontrado'
            ];
        }

        $userData = $result->fetch_assoc();

        return [
            'success' => true,
            'user' => $userData
        ];
    }
}
?>
