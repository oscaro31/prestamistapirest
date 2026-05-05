<?php
// =============================================
// PrestamistAPI - Database Configuration
// =============================================

define('DB_HOST', 'srv1716.hstgr.io');
define('DB_NAME', 'u139313903_prestamist');
define('DB_USER', 'u139313903_prestamist');
define('DB_PASS', 'r:T+Xgs@R5dMS>U4');
define('DB_CHARSET', 'utf8mb4');

function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }
    return $pdo;
}

function jsonResponse($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['data' => $data], JSON_UNESCAPED_UNICODE);
    exit;
}

function jsonError($msg, $code = 400) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

function validateToken() {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) {
        jsonError('Token requerido', 401);
    }
    $token = $m[1];
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT u.idusuario, u.nombre, u.apellido, u.login, u.idcargo, u.activo, u.preferencias, u.avatar, c.nombre as cargo_nombre
                           FROM tokens t 
                           JOIN usuario u ON u.idusuario = t.idusuario
                           LEFT JOIN Cargos c ON c.idcargo = u.idcargo
                           WHERE t.token = ? AND (t.expires_at IS NULL OR t.expires_at > NOW())");
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    if (!$user) {
        jsonError('Token inválido o expirado', 401);
    }
    if (!$user['activo']) {
        jsonError('Usuario desactivado', 403);
    }
    return $user;
}
