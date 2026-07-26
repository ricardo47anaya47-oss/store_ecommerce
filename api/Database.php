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
        $this->host = DB_HOST;
        $this->user = DB_USER;
        $this->pass = DB_PASS;
        $this->db = DB_NAME;
        $this->port = DB_PORT;

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

            http_response_code(500);

            echo json_encode([
                "success" => false,
                "message" => "No fue posible conectar con la base de datos."
            ]);

            exit;
        }

        $this->connection->set_charset("utf8mb4");
    }

    public function getConnection()
    {
        return $this->connection;
    }

    public function query($sql)
    {
        $result = $this->connection->query($sql);

        if ($result === false) {

            throw new Exception($this->connection->error);
        }

        return $result;
    }

    public function prepare($sql)
    {
        $stmt = $this->connection->prepare($sql);

        if ($stmt === false) {

            throw new Exception($this->connection->error);
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
