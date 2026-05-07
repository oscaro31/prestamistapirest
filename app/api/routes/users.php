<?php
function listUsers() {
    $pdo = getDB();
    $stmt = $pdo->query("SELECT u.*, c.nombre as cargo_nombre, e.nombre as empresa_nombre
                         FROM usuarios u
                         LEFT JOIN cargos c ON c.idcargo = u.idcargo
                         LEFT JOIN empresas e ON e.idempresa = u.idempresa
                         ORDER BY u.fecha_creacion DESC");
    $users = $stmt->fetchAll();
    // Remove clave from output
    foreach ($users as &$u) unset($u['clave']);
    jsonResponse($users);
}

function createUser($body) {
    $nombre = trim($body['nombre'] ?? '');
    $login = trim($body['login'] ?? '');
    $clave = trim($body['clave'] ?? '');
    $idcargo = (int)($body['idcargo'] ?? 0);
    $apellido = trim($body['apellido'] ?? '');
    $email = trim($body['email'] ?? '');
    $idtipodocumento = isset($body['idtipodocumento']) ? (int)$body['idtipodocumento'] : null;
    $nrodocumento = trim($body['num_documento'] ?? $body['NroDocumento'] ?? '');
    $telefono = trim($body['telefono'] ?? '');
    $direccion = trim($body['direccion'] ?? '');

    if (empty($nombre) || empty($login) || empty($clave)) {
        jsonError('Nombre, login y clave requeridos');
    }

    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM usuarios WHERE login = ?");
    $stmt->execute([$login]);
    if ($stmt->fetchColumn() > 0) jsonError('El login ya existe');

    $claveHash = password_hash($clave, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO usuarios (nombre, apellido, login, clave, email, idcargo, idtipodocumento, num_documento, telefono, direccion, idtipoestadosusuarios, idtipoestatususuarios)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 2)");
    $stmt->execute([$nombre, $apellido, $login, $claveHash, $email, $idcargo ?: null, $idtipodocumento, $nrodocumento ?: null, $telefono ?: null, $direccion ?: null]);
    jsonResponse(['idusuario' => (int)$pdo->lastInsertId()], 201);
}

function updateUser($body) {
    $idusuario = (int)($body['idusuario'] ?? 0);
    if (!$idusuario) jsonError('idusuario requerido');

    $pdo = getDB();
    $fields = []; $params = [];
    if (!empty($body['nombre'])) { $fields[] = "nombre = ?"; $params[] = $body['nombre']; }
    if (isset($body['apellido'])) { $fields[] = "apellido = ?"; $params[] = $body['apellido']; }
    if (isset($body['email'])) { $fields[] = "email = ?"; $params[] = $body['email']; }
    if (isset($body['idcargo'])) { $fields[] = "idcargo = ?"; $params[] = (int)$body['idcargo']; }
    if (isset($body['telefono'])) { $fields[] = "telefono = ?"; $params[] = $body['telefono']; }
    if (isset($body['idtipodocumento'])) { $fields[] = "idtipodocumento = ?"; $params[] = (int)$body['idtipodocumento']; }
    $nd = $body['num_documento'] ?? $body['NroDocumento'] ?? null;
    if ($nd !== null) { $fields[] = "num_documento = ?"; $params[] = $nd; }
    $dir = $body['direccion'] ?? $body['Direccion'] ?? null;
    if ($dir !== null) { $fields[] = "direccion = ?"; $params[] = $dir; }
    if (isset($body['preferencias'])) { $fields[] = "preferencias = ?"; $params[] = $body['preferencias']; }

    if (empty($fields)) jsonError('Nada que actualizar');
    $params[] = $idusuario;
    $pdo->prepare("UPDATE usuarios SET " . implode(', ', $fields) . " WHERE idusuario = ?")->execute($params);
    jsonResponse(['success' => true]);
}

function toggleUser($body) {
    $idusuario = (int)($body['idusuario'] ?? 0);
    if (!$idusuario) jsonError('idusuario requerido');

    $pdo = getDB();
    $pdo->prepare("UPDATE usuario SET idtipoestadosusuarios = CASE WHEN idtipoestadosusuarios = 1 THEN 2 ELSE 1 END WHERE idusuario = ?")->execute([$idusuario]);
    $pdo->prepare("DELETE FROM tokens WHERE idusuario = ?")->execute([$idusuario]);
    jsonResponse(['success' => true]);
}

function changePassword($body) {
    $idusuario = (int)($body['idusuario'] ?? 0);
    $clave = trim($body['clave'] ?? '');
    if (!$idusuario || empty($clave)) jsonError('idusuario y clave requeridos');

    $claveHash = password_hash($clave, PASSWORD_BCRYPT);
    $pdo = getDB();
    $pdo->prepare("UPDATE usuarios SET clave = ? WHERE idusuario = ?")->execute([$claveHash, $idusuario]);
    $pdo->prepare("DELETE FROM tokens WHERE idusuario = ?")->execute([$idusuario]);
    jsonResponse(['success' => true]);
}
