<?php
require_once __DIR__ . '/config.php';

function importSqlFile($sqlFilePath, $dbHost, $dbUser, $dbPass, $dbName, $dbPort) {
    if (!file_exists($sqlFilePath)) {
        throw new RuntimeException("No se encontró el archivo SQL: $sqlFilePath");
    }

    $connection = new mysqli($dbHost, $dbUser, $dbPass, $dbName, $dbPort);
    if ($connection->connect_error) {
        throw new RuntimeException('No se pudo conectar a la base de datos: ' . $connection->connect_error);
    }

    $connection->set_charset('utf8mb4');

    $sql = file_get_contents($sqlFilePath);
    if ($sql === false) {
        throw new RuntimeException('No se pudo leer el archivo SQL');
    }

    $sql = preg_replace('/--.*$/m', '', $sql);
    $sql = preg_replace('/\/\*[\s\S]*?\*\//', '', $sql);
    $sql = trim($sql);

    if ($sql === '') {
        throw new RuntimeException('El archivo SQL está vacío');
    }

    if (!$connection->multi_query($sql)) {
        throw new RuntimeException('Error ejecutando SQL: ' . $connection->error);
    }

    do {
        if ($result = $connection->store_result()) {
            $result->free();
        }
    } while ($connection->more_results() && $connection->next_result());

    $connection->close();

    return true;
}

try {
    $sqlFile = __DIR__ . '/../gemini-code-1788884203337.sql';
    importSqlFile($sqlFile, DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);

    echo json_encode([
        'success' => true,
        'message' => 'La base de datos fue actualizada con éxito usando las credenciales de config.php.'
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
