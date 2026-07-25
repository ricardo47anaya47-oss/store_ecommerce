<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../middleware/auth.php';
// Permitir conexiones desde tu app de Vercel
header("Access-Control-Allow-Origin: https://vercel.app");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; 

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
        // Responder inmediatamente a las peticiones de verificación de los navegadores móviles (Preflight)
       if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
         http_response_code(200);
       exit(0);
       }

        $email = $this->db->escape($data['email']);
        $name = $this->db->escape($data['name']);
        $lastName = isset($data['lastName']) ? $this->db->escape($data['lastName']) : '';
        $password = password_hash($data['password'], PASSWORD_DEFAULT);

        // Verificar si el email ya existe
        $idCol = $this->getUserIdColumn();
        $result = $this->db->query("SELECT $idCol FROM user WHERE email = '$email'");
        if ($result->num_rows > 0) {
            return [
                'success' => false,
                'message' => 'El email ya está registrado'
            ];
        }

        // Insertar nuevo usuario
        $insertQuery = "INSERT INTO user (name, last_name, email, password, created_at) 
                       VALUES ('$name', '$lastName', '$email', '$password', NOW())";
        
        if ($this->db->query($insertQuery)) {
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
        } else {
            return [
                'success' => false,
                'message' => 'Error en el registro'
            ];
        }
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
