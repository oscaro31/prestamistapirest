<?php
function login($body) {
    $login = trim($body['login'] ?? $body['usuario'] ?? '');
    $clave = trim($body['clave'] ?? '');
    $remember = !empty($body['remember']);

    if (empty($login) || empty($clave)) {
        jsonError('Usuario y clave requeridos');
    }

    $pdo = getDB();
    $claveHash = hash('sha256', $clave);

    $stmt = $pdo->prepare("SELECT u.*, c.nombre as cargo_nombre
                           FROM usuario u
                           LEFT JOIN Cargos c ON c.idcargo = u.idcargo
                           WHERE u.login = ? AND u.clave = ?");
    $stmt->execute([$login, $claveHash]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonError('Credenciales inválidas');
    }

    if (!$user['activo']) {
        jsonError('Usuario desactivado. Contacte al administrador.');
    }

    // Generate token
    $token = bin2hex(random_bytes(32)) . bin2hex(random_bytes(32));
    $expireDays = $remember ? 30 : 1;

    $pdo->prepare("DELETE FROM tokens WHERE idusuario = ? AND expires_at < NOW()")->execute([$user['idusuario']]);

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
