<?php
class Database {
    private $connection;
    private $host;
    private $user;
    private $pass;
    private $db;
    private $port;

    public function __construct() {
        $this->host = DB_HOST;
        $this->user = DB_USER;
        $this->pass = DB_PASS;
        $this->db = DB_NAME;
        $this->port = DB_PORT;
        $this->connect();
    }

    private function connect() {
        $this->connection = @new mysqli(
            $this->host,
            $this->user,
            $this->pass,
            $this->db,
            $this->port
        );

        if ($this->connection->connect_error) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error de conexión a la base de datos',
                'details' => 'No se pudo conectar a MySQL'
            ]);
            exit;
        }

        $this->connection->set_charset('utf8mb4');
    }

    public function getConnection() {
        return $this->connection;
    }

    public function query($sql) {
        $result = $this->connection->query($sql);
        
        if (!$result && $this->connection->error) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Error en la consulta',
                'error' => $this->connection->error
            ]);
            exit;
        }
        
        return $result;
    }

    public function prepare($sql) {
        return $this->connection->prepare($sql);
    }

    public function escape($string) {
        return $this->connection->real_escape_string($string);
    }

    public function lastInsertId() {
        return $this->connection->insert_id;
    }

    public function affectedRows() {
        return $this->connection->affected_rows;
    }

    public function close() {
        if ($this->connection) {
            $this->connection->close();
        }
    }

    public function __destruct() {
        $this->close();
    }
}
?>
