<?php

class Database
{
    private $connection;

    public function __construct()
    {
        $this->connect();
    }

    /**
     * Establecer conexión con MySQL
     */
    private function connect()
    {
        mysqli_report(MYSQLI_REPORT_OFF);

        $this->connection = new mysqli(
            DB_HOST,
            DB_USER,
            DB_PASS,
            DB_NAME,
            DB_PORT
        );

        if ($this->connection->connect_errno) {

            error_log(
                "Error MySQL: " .
                $this->connection->connect_error
            );

            http_response_code(500);

            header(
                'Content-Type: application/json; charset=utf-8'
            );

            echo json_encode([
                'success' => false,
                'message' => 'No fue posible conectar con la base de datos.'
            ]);

            exit;
        }

        // UTF-8 para caracteres especiales
        if (!$this->connection->set_charset('utf8mb4')) {

            error_log(
                'Error al establecer charset: ' .
                $this->connection->error
            );
        }
    }

    /**
     * Obtener conexión mysqli
     */
    public function getConnection()
    {
        return $this->connection;
    }

    /**
     * Ejecutar consulta SQL directa
     */
    public function query($sql)
    {
        $result = $this->connection->query($sql);

        if ($result === false) {

            error_log(
                'Error SQL: ' .
                $this->connection->error
            );

            throw new Exception(
                'Error al ejecutar la consulta.'
            );
        }

        return $result;
    }

    /**
     * Preparar consulta SQL
     */
    public function prepare($sql)
    {
        $stmt = $this->connection->prepare($sql);

        if ($stmt === false) {

            error_log(
                'Error preparando SQL: ' .
                $this->connection->error
            );

            throw new Exception(
                'Error al preparar la consulta.'
            );
        }

        return $stmt;
    }

    /**
     * Escapar texto
     */
    public function escape($string)
    {
        return $this->connection->real_escape_string($string);
    }

    /**
     * ID del último registro insertado
     */
    public function lastInsertId()
    {
        return $this->connection->insert_id;
    }

    /**
     * Número de filas afectadas
     */
    public function affectedRows()
    {
        return $this->connection->affected_rows;
    }

    /**
     * Cerrar conexión
     */
    public function close()
    {
        if ($this->connection instanceof mysqli) {
            $this->connection->close();
            $this->connection = null;
        }
    }

    public function __destruct()
    {
        $this->close();
    }
}
?>
