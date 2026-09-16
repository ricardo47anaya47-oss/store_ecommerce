<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../Database.php';
require_once __DIR__ . '/../middleware/auth.php';

class AuthController {
    private $db;

    public function __construct() {
        $this->db = new Database();
    }

    private function ensureUserTable() {
        foreach (['users', 'user'] as $table) {
            $check = $this->db->query("SHOW TABLES LIKE '$table'");
            if ($check && $check->num_rows > 0) {
                return $table;
            }
        }

        $this->db->query(
            "CREATE TABLE users (
                id INT NOT NULL AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NULL,
                address TEXT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
        );

        return 'users';
    }

    private function getUserTableName() {
        foreach (['users', 'user'] as $table) {
            $check = $this->db->query("SHOW TABLES LIKE '$table'");
            if ($check && $check->num_rows > 0) {
                return $table;
            }
        }

        return $this->ensureUserTable();
    }

    private function getUserColumns($table) {
        $columnsRes = $this->db->query("SHOW COLUMNS FROM $table");
        $cols = [];
        while ($c = $columnsRes->fetch_assoc()) {
            $cols[] = $c['Field'];
        }
        return $cols;
    }

    private function getUserIdColumn() {
        $table = $this->getUserTableName();
        $cols = $this->getUserColumns($table);

        if (in_array('id', $cols)) return 'id';
        if (in_array('user_id', $cols)) return 'user_id';
        return 'id';
    }

    public function register() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['email']) || !isset($data['password']) || !isset($data['name'])) {
            return [
                'success' => false,
                'message' => 'Email, contraseña y nombre son requeridos'
            ];
        }

        $table = $this->getUserTableName();
        $cols = $this->getUserColumns($table);

        $email = $this->db->escape($data['email']);
        $name = $this->db->escape($data['name']);
        $lastName = isset($data['lastName']) ? $this->db->escape($data['lastName']) : '';
        $password = password_hash($data['password'], PASSWORD_DEFAULT);

        $idCol = $this->getUserIdColumn();
        $result = $this->db->query("SELECT $idCol FROM $table WHERE email = '$email'");
        if ($result->num_rows > 0) {
            return [
                'success' => false,
                'message' => 'El email ya está registrado'
            ];
        }

        $fields = ['name', 'email', 'password'];
        $values = ["'$name'", "'$email'", "'$password'"];

        if (in_array('last_name', $cols)) {
            $fields[] = 'last_name';
            $values[] = "'$lastName'";
        }

        if (in_array('created_at', $cols)) {
            $fields[] = 'created_at';
            $values[] = 'NOW()';
        }

        if (in_array('updated_at', $cols) && !in_array('created_at', $cols)) {
            $fields[] = 'updated_at';
            $values[] = 'NOW()';
        }

        $insertQuery = "INSERT INTO $table (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $values) . ")";

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

        $table = $this->getUserTableName();
        $idCol = $this->getUserIdColumn();
        $email = $this->db->escape($data['email']);

        $result = $this->db->query("SELECT $idCol as id, name, email, password FROM $table WHERE email = '$email'");

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
        $table = $this->getUserTableName();
        $idCol = $this->getUserIdColumn();
        $result = $this->db->query("SELECT $idCol as id, name, email, created_at FROM $table WHERE $idCol = $userId");

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
