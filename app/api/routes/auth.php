<?php
// =============================================
// PrestamistAPI - Login Multiempresa
// =============================================

define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_MINUTES', 15);

function login($body) {
    $login = trim($body['login'] ?? $body['usuario'] ?? '');
    $clave = trim($body['clave'] ?? '');
    $remember = !empty($body['remember']);

    if (empty($login) || empty($clave)) {
        jsonError('Usuario y clave requeridos');
    }

    if (!preg_match('/^[a-zA-Z0-9_.@-]+$/', $login)) {
        jsonError('Credenciales inválidas');
    }

    $pdo = getDB();
    $ip = getClientIP();

    // Verificar bloqueo por fuerza bruta
    $stmt = $pdo->prepare("SELECT COUNT(*) as attempts FROM login_attempts WHERE login = ? AND ip = ? AND intento > NOW() - INTERVAL ? MINUTE");
    $stmt->execute([$login, $ip, LOGIN_LOCKOUT_MINUTES]);
    if ((int)$stmt->fetchColumn() >= MAX_LOGIN_ATTEMPTS) {
        jsonError('Demasiados intentos. Intente de nuevo en ' . LOGIN_LOCKOUT_MINUTES . ' minutos.', 429);
    }

    // Buscar usuario en db_universal
    $stmt = $pdo->prepare("SELECT u.*, c.nombre as cargo_nombre FROM usuarios u LEFT JOIN cargos c ON c.idcargo = u.idcargo WHERE u.login = ?");
    $stmt->execute([$login]);
    $user = $stmt->fetch();

    if (!$user) {
        registerLoginAttempt($pdo, $login, $ip, false);
        jsonError('Credenciales inválidas');
    }

    // Verificar contraseña
    if (!password_verify($clave, $user['clave'])) {
        registerLoginAttempt($pdo, $login, $ip, false);
        jsonError('Credenciales inválidas');
    }

    if (!$user['activo']) {
        registerLoginAttempt($pdo, $login, $ip, false);
        jsonError('Usuario desactivado. Contacte al administrador.');
    }

    // Limpiar intentos
    $pdo->prepare("DELETE FROM login_attempts WHERE login = ? AND ip = ?")->execute([$login, $ip]);

    // Single session: eliminar tokens anteriores de este usuario
    $pdo->prepare("DELETE FROM tokens WHERE idusuario = ?")->execute([$user['idusuario']]);

    // Generar token
    $token = bin2hex(random_bytes(32));
    $expires = $remember ? date('Y-m-d H:i:s', strtotime('+30 days')) : date('Y-m-d H:i:s', strtotime('+24 hours'));
    $pdo->prepare("INSERT INTO tokens (idusuario, token, expires_at) VALUES (?, ?, ?)")->execute([$user['idusuario'], $token, $expires]);

    // Actualizar ultimo_acceso
    $pdo->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE idusuario = ?")->execute([$user['idusuario']]);

    // Cargar permisos del cargo
    $permStmt = $pdo->prepare("SELECT permiso, valor FROM usuario_cargo WHERE idcargo = ?");
    $permStmt->execute([$user['idcargo']]);
    $permisos = [];
    while ($p = $permStmt->fetch()) {
        $permisos[$p['permiso']] = (bool)$p['valor'];
    }

    registrarActividad($pdo, $user['idusuario'], 'login', 'Inicio de sesión');

    jsonResponse([
        'token' => $token,
        'user' => [
            'idusuario' => (int)$user['idusuario'],
            'idempresa' => (int)$user['idempresa'],
            'nombre' => $user['nombre'],
            'apellido' => $user['apellido'],
            'login' => $user['login'],
            'email' => $user['email'],
            'idcargo' => (int)$user['idcargo'],
            'cargo_nombre' => $user['cargo_nombre'],
            'rol' => $user['rol'],
            'preferencias' => $user['preferencias'] ?? '{}',
            'avatar' => $user['avatar'] ?? null,
            'permisos' => $permisos,
        ],
        'remember' => $remember,
    ]);
}

function registerLoginAttempt($pdo, $login, $ip, $exitoso) {
    $stmt = $pdo->prepare("INSERT INTO login_attempts (login, ip, intento, exitoso) VALUES (?, ?, NOW(), ?)");
    $stmt->execute([$login, $ip, $exitoso ? 1 : 0]);
}

function registrarActividad($pdo, $idusuario, $accion, $detalle = '') {
    // Obtener idempresa del usuario
    $stmt = $pdo->prepare("SELECT idempresa FROM usuarios WHERE idusuario = ?");
    $stmt->execute([$idusuario]);
    $idempresa = (int)$stmt->fetchColumn();
    
    $stmt = $pdo->prepare("INSERT INTO actividad (idusuario, idempresa, accion, detalle, ip, fecha) VALUES (?, ?, ?, ?, ?, NOW())");
    $stmt->execute([$idusuario, $idempresa, $accion, $detalle, getClientIP()]);
}

function getClientIP() {
    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    return explode(',', $ip)[0];
}

function logout($body) {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) {
        $token = $m[1];
        $pdo = getDB();
        $pdo->prepare("DELETE FROM tokens WHERE token = ?")->execute([$token]);
    }
    jsonResponse(['message' => 'Sesión cerrada']);
}
