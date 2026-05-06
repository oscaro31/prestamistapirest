<?php
// =============================================
// PrestamistAPI - Login with brute-force protection
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

    // Sanitizar login: solo alfanumérico y guiones
    if (!preg_match('/^[a-zA-Z0-9_.@-]+$/', $login)) {
        jsonError('Credenciales inválidas');
    }

    $pdo = getDB();

    // 1. Verificar bloqueo por fuerza bruta
    $stmt = $pdo->prepare("SELECT COUNT(*) as attempts
                           FROM login_attempts 
                           WHERE login = ? AND ip = ? AND intento > NOW() - INTERVAL ? MINUTE");
    $ip = getClientIP();
    $stmt->execute([$login, $ip, LOGIN_LOCKOUT_MINUTES]);
    $attemptData = $stmt->fetch();

    if ((int)$attemptData['attempts'] >= MAX_LOGIN_ATTEMPTS) {
        jsonError('Demasiados intentos. Intente de nuevo en ' . LOGIN_LOCKOUT_MINUTES . ' minutos.', 429);
    }

    $stmt = $pdo->prepare("SELECT u.*, c.nombre as cargo_nombre
                           FROM usuario u
                           LEFT JOIN Cargos c ON c.idcargo = u.idcargo
                           WHERE u.login = ?");
    $stmt->execute([$login]);
    $user = $stmt->fetch();

    if (!$user) {
        registerLoginAttempt($pdo, $login, $ip, false);
        jsonError('Credenciales inválidas');
    }

    // Verificar contraseña con bcrypt
    $passwordOk = false;
    if (password_verify($clave, $user['clave'])) {
        $passwordOk = true;
    } else {
        // Compatibilidad hacia atras: probar con SHA-256 legacy
        if ($user['clave'] !== hash('sha256', $clave)) {
            registerLoginAttempt($pdo, $login, $ip, false);
            jsonError('Credenciales inválidas');
        }
        // Si era SHA-256, migrar a bcrypt automaticamente
        $bcryptHash = password_hash($clave, PASSWORD_BCRYPT);
        $pdo->prepare("UPDATE usuario SET clave = ? WHERE idusuario = ?")->execute([$bcryptHash, $user['idusuario']]);
        $passwordOk = true;
    }

    if (!$passwordOk) {
        registerLoginAttempt($pdo, $login, $ip, false);
        jsonError('Credenciales inválidas');
    }

    if (!$user['activo']) {
        registerLoginAttempt($pdo, $login, $ip, false);
        jsonError('Usuario desactivado. Contacte al administrador.');
    }

    // Limpiar intentos al login exitoso
    $pdo->prepare("DELETE FROM login_attempts WHERE login = ? AND ip = ?")->execute([$login, $ip]);

    // Registrar acceso exitoso
    registrarActividad($pdo, $user['idusuario'], 'login', 'Inicio de sesión desde IP: ' . $ip);

    // Generate token (64 bytes hex = 128 chars, más seguro)
    $token = bin2hex(random_bytes(32)) . bin2hex(random_bytes(32));
    $expireDays = $remember ? 30 : 1;

    // Limpiar tokens expirados del usuario
    $pdo->prepare("DELETE FROM tokens WHERE idusuario = ? AND expires_at < NOW()")->execute([$user['idusuario']]);

    // SINGLE SESSION: eliminar todos los tokens anteriores (incluyendo activos)
    $pdo->prepare("DELETE FROM tokens WHERE idusuario = ?")->execute([$user['idusuario']]);

    $stmt = $pdo->prepare("INSERT INTO tokens (idusuario, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))");
    $stmt->execute([$user['idusuario'], $token, $expireDays]);

    $pdo->prepare("UPDATE usuario SET ultimo_acceso = NOW() WHERE idusuario = ?")->execute([$user['idusuario']]);

    jsonResponse([
        'token' => $token,
        'user' => [
            'idusuario' => (int)$user['idusuario'],
            'nombre' => $user['nombre'],
            'apellido' => $user['apellido'],
            'login' => $user['login'],
            'email' => $user['email'] ?? '',
            'telefono' => $user['telefono'] ?? '',
            'direccion' => $user['direccion'] ?? '',
            'idtipodocumento' => (int)($user['idtipodocumento'] ?? 0),
            'num_documento' => $user['num_documento'] ?? '',
            'idcargo' => (int)$user['idcargo'],
            'cargo_nombre' => $user['cargo_nombre'],
            'activo' => (bool)$user['activo'],
            'preferencias' => $user['preferencias'],
            'avatar' => $user['avatar'],
        ]
    ]);
}

// =============================================
// Helpers de seguridad
// =============================================

function getClientIP() {
    $headers = [
        'HTTP_X_FORWARDED_FOR',
        'HTTP_X_REAL_IP',
        'HTTP_CLIENT_IP',
        'HTTP_X_FORWARDED',
        'HTTP_FORWARDED_FOR',
        'HTTP_FORWARDED',
        'REMOTE_ADDR'
    ];
    foreach ($headers as $h) {
        if (!empty($_SERVER[$h])) {
            $ips = explode(',', $_SERVER[$h]);
            $ip = trim($ips[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $ip;
            }
            return $ip; // fallback aunque sea privada
        }
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function registerLoginAttempt($pdo, $login, $ip, $success) {
    $stmt = $pdo->prepare("INSERT INTO login_attempts (login, ip, intento, exitoso) VALUES (?, ?, NOW(), ?)");
    $stmt->execute([$login, $ip, $success ? 1 : 0]);
}

function registrarActividad($pdo, $idusuario, $accion, $detalle = '') {
    try {
        $stmt = $pdo->prepare("INSERT INTO actividad (idusuario, accion, detalle, ip, fecha) VALUES (?, ?, ?, ?, NOW())");
        $stmt->execute([$idusuario, $accion, $detalle, getClientIP()]);
    } catch (Exception $e) {
        // No fallar la operación principal si el log falla
    }
}
