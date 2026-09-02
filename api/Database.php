<?php

class Database
{
    private $connection;

    private $host;
    private $user;
    private $pass;
    private $db;
    private $port;

    public function __construct()
    {
        $this->host = DB_HOST = envOrDefault('DB_HOST', 'sql208.infinityfree.com');
        $this->user = DB_USER = envOrDefault('DB_USER', 'if0_42533402');
        $this->pass = DB_PASS = envOrDefault('DB_PASS', 'nQY2doalEG6');
        $this->db   = DB_NAME = envOrDefault('DB_NAME', 'if0_42533402_proyecto');
        $this->port = DB_PORT = (int) envOrDefault('DB_PORT', 3306);

        $this->connect();
    }

    private function connect()
    {
        mysqli_report(MYSQLI_REPORT_OFF);

        $this->connection = new mysqli(
            $this->host,
            $this->user,
            $this->pass,
            $this->db,
            $this->port
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
                "success" => false,
                "message" => "No fue posible conectar con la base de datos."
            ]);

            exit;
        }

        if (!$this->connection->set_charset("utf8mb4")) {

            error_log(
                "Error al establecer charset: " .
                $this->connection->error
            );
        }
    }

    public function getConnection()
    {
        return $this->connection;
    }

    public function query($sql)
    {
        $result = $this->connection->query($sql);

        if ($result === false) {

            error_log(
                "Error SQL: " .
                $this->connection->error
            );

            throw new Exception(
                "Error al ejecutar la consulta."
            );
        }

        return $result;
    }

    public function prepare($sql)
    {
        $stmt = $this->connection->prepare($sql);

        if ($stmt === false) {

            error_log(
                "Error preparando SQL: " .
                $this->connection->error
            );

            throw new Exception(
                "Error al preparar la consulta."
            );
        }

        return $stmt;
    }

    public function escape($string)
    {
        return $this->connection->real_escape_string($string);
    }

    public function lastInsertId()
    {
        return $this->connection->insert_id;
    }

    public function affectedRows()
    {
        return $this->connection->affected_rows;
    }

    public function close()
    {
        if ($this->connection instanceof mysqli) {
            $this->connection->close();
        }
    }

    public function __destruct()
    {
        $this->close();
    }
}