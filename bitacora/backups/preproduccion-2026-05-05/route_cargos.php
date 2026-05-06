<?php
function listCargos() {
    $pdo = getDB();
    jsonResponse($pdo->query("SELECT * FROM Cargos ORDER BY nombre")->fetchAll());
}

/**
 * Obtiene los permisos del cargo del usuario autenticado.
 * Devuelve el mapa permiso => bool (1/0) para aplicar en el frontend.
 */
function getCargoPermissions() {
    global $authUser; // seteado por validateToken()
    $idcargo = (int)($authUser['idcargo'] ?? 0);
    if ($idcargo <= 0) jsonError('Usuario sin cargo asignado', 403);

    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT permiso, valor FROM usuario_cargo WHERE idcargo = ?");
    $stmt->execute([$idcargo]);
    $rows = $stmt->fetchAll();

    $permisos = [];
    foreach ($rows as $r) {
        $permisos[$r['permiso']] = (bool)$r['valor'];
    }

    jsonResponse(['permisos' => $permisos, 'idcargo' => $idcargo]);
}

/**
 * Valida que el usuario autenticado tenga un permiso específico.
 * Se llama dentro de cada ruta sensible.
 * Si no tiene permiso, responde 403 y muere.
 */
function requirePermission($permiso) {
    global $authUser;
    $idcargo = (int)($authUser['idcargo'] ?? 0);
    if ($idcargo <= 0) jsonError('Acceso denegado', 403);

    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT valor FROM usuario_cargo WHERE idcargo = ? AND permiso = ?");
    $stmt->execute([$idcargo, $permiso]);
    $row = $stmt->fetch();

    if (!$row || !$row['valor']) {
        jsonError("Permiso '{$permiso}' denegado para este usuario", 403);
    }
}
