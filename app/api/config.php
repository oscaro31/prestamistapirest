<?php
// =============================================
// PrestamistAPI - Multiempresa Database Layer
// =============================================

define('DB_HOST', 'localhost');
define('DB_NAME_UNIVERSAL', 'u139313903_prestamist');
define('DB_USER', 'u139313903_prestamist');
define('DB_PASS', 'r:T+Xgs@R5dMS>U4');
define('DB_CHARSET', 'utf8mb4');

// Conexión a la BD universal (db_universal) o BD de empresa
function getDB($idempresa = null) {
    // null significa "usar contexto actual o universal"
    // Cuando se pasa un valor especifico, se fuerza a esa BD
    if ($idempresa !== null) {
        if ($idempresa > 0) {
            return getEmpresaDB($idempresa);
        }
        // idempresa == 0 o -1: forzar universal (ignorar _EMPRESA_PDO)
        return getDBUnica();
    }
    // Si hay un contexto de empresa activo, devolverlo
    if (isset($GLOBALS['_EMPRESA_PDO'])) {
        return $GLOBALS['_EMPRESA_PDO'];
    }
    return getDBUnica();
}

function getDBUnica() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME_UNIVERSAL . ";charset=" . DB_CHARSET;
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

// Conexión dinámica a la BD de una empresa específica
function getEmpresaDB($idempresa) {
    static $pools = [];
    if (isset($pools[$idempresa])) return $pools[$idempresa];

    $universal = getDB();
    $stmt = $universal->prepare("SELECT host, puerto, dbname, dbuser, dbpass FROM config_bd WHERE idempresa = ?");
    $stmt->execute([$idempresa]);
    $cfg = $stmt->fetch();
    if (!$cfg) jsonError('Configuración de BD no encontrada para esta empresa', 500);

    try {
        $dsn = "mysql:host={$cfg['host']};port={$cfg['puerto']};dbname={$cfg['dbname']};charset=" . DB_CHARSET;
        $pass = decryptPass($cfg['dbpass']);
        $pdo = new PDO($dsn, $cfg['dbuser'], $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pools[$idempresa] = $pdo;
        return $pdo;
    } catch (PDOException $e) {
        jsonError('Error conectando a la base de datos de la empresa: ' . $e->getMessage(), 500);
    }
}

// Cifrado simple para credenciales de BD
function encryptPass($plain) {
    $key = defined('ENCRYPT_KEY') ? ENCRYPT_KEY : 'prestamist_default_key_2026';
    return base64_encode(openssl_encrypt($plain, 'aes-128-ecb', $key));
}

function decryptPass($encrypted) {
    $key = defined('ENCRYPT_KEY') ? ENCRYPT_KEY : 'prestamist_default_key_2026';
    return openssl_decrypt(base64_decode($encrypted), 'aes-128-ecb', $key);
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
    $stmt = $pdo->prepare("SELECT u.idusuario, u.idempresa, u.nombre, u.apellido, u.login, u.email, u.rol, u.idcargo, u.preferencias, u.avatar, c.nombre as cargo_nombre, e.nombre as empresa_nombre, e.slug as empresa_slug
                           FROM tokens t 
                           JOIN usuarios u ON u.idusuario = t.idusuario
                           JOIN empresas e ON e.idempresa = u.idempresa
                           LEFT JOIN cargos c ON c.idcargo = u.idcargo
                           WHERE t.token = ? AND (t.expires_at IS NULL OR t.expires_at > NOW()) AND u.activo = 1");
    $stmt->execute([$token]);
    $user = $stmt->fetch();
    if (!$user) {
        jsonError('Token inválido o expirado', 401);
    }
    return $user;
}

// Helper: establecer contexto de empresa en getDB()
// Despues de validateToken(), llama a esto para que getDB() devuelva la BD de la empresa
function useEmpresaDB($authUser) {
    if (!defined('_USE_EMPRESA')) {
        $empresaPdo = getEmpresaDB($authUser['idempresa']);
        // Reemplazar getDB en el contexto actual
        $GLOBALS['_EMPRESA_PDO'] = $empresaPdo;
    }
}

// Helper: obtener BD de empresa desde un usuario autenticado
function getDataDB($authUser = null) {
    if ($authUser === null) {
        $authUser = validateToken();
    }
    if (isset($GLOBALS['_EMPRESA_PDO'])) return $GLOBALS['_EMPRESA_PDO'];
    return getEmpresaDB($authUser['idempresa']);
}
