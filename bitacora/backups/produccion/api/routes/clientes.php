<?php
function listClientes() {
    $pdo = getDB();
    $stmt = $pdo->query("SELECT c.*, td.Nombre as tipo_documento_nombre 
                          FROM Cliente c 
                          LEFT JOIN TipoDocumento td ON td.IdTipoDocumento = c.IdTipoDocumento 
                          ORDER BY c.FechaCreacion DESC");
    jsonResponse($stmt->fetchAll());
}

function getCliente($nroDocumento) {
    if (empty($nroDocumento)) jsonError('NroDocumento requerido');
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT c.*, td.Nombre as tipo_documento_nombre 
                            FROM Cliente c 
                            LEFT JOIN TipoDocumento td ON td.IdTipoDocumento = c.IdTipoDocumento 
                            WHERE c.NroDocumento = ?");
    $stmt->execute([$nroDocumento]);
    $c = $stmt->fetch();
    if (!$c) jsonError('Cliente no encontrado', 404);
    jsonResponse($c);
}

function createCliente($body) {
    $nroDocumento = trim($body['NroDocumento'] ?? $body['nro_documento'] ?? '');
    $nombre = trim($body['Nombre'] ?? $body['nombre'] ?? '');
    $apellido = trim($body['Apellido'] ?? $body['apellido'] ?? '');
    $correo = trim($body['Correo'] ?? $body['correo'] ?? '');
    $telefono = trim($body['Telefono'] ?? $body['telefono'] ?? '');
    $direccion = trim($body['Direccion'] ?? $body['direccion'] ?? '');
    $idTipoDoc = (int)($body['IdTipoDocumento'] ?? $body['id_tipo_documento'] ?? 0);

    if (empty($nombre) || empty($apellido)) {
        jsonError('Nombre y Apellido requeridos');
    }

    $pdo = getDB();
    $stmt = $pdo->prepare("INSERT INTO Cliente (NroDocumento, Nombre, Apellido, Correo, Telefono, Direccion, IdTipoDocumento) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$nroDocumento, $nombre, $apellido, $correo, $telefono, $direccion, $idTipoDoc ?: null]);
    jsonResponse(['IdCliente' => (int)$pdo->lastInsertId()], 201);
}

function updateCliente($body) {
    $idcliente = (int)($body['IdCliente'] ?? $body['idcliente'] ?? 0);
    if (!$idcliente) jsonError('IdCliente requerido');

    $pdo = getDB();
    $fields = []; $params = [];
    foreach (['NroDocumento', 'Nombre', 'Apellido', 'Correo', 'Telefono', 'Direccion'] as $f) {
        if (isset($body[$f]) || isset($body[strtolower($f)])) {
            $fields[] = "$f = ?";
            $params[] = $body[$f] ?? $body[strtolower($f)];
        }
    }
    if (isset($body['IdTipoDocumento']) || isset($body['id_tipo_documento'])) {
        $fields[] = "IdTipoDocumento = ?";
        $params[] = (int)($body['IdTipoDocumento'] ?? $body['id_tipo_documento']);
    }
    if (empty($fields)) jsonError('Nada que actualizar');
    $params[] = $idcliente;
    $pdo->prepare("UPDATE Cliente SET " . implode(', ', $fields) . " WHERE IdCliente = ?")->execute($params);
    jsonResponse(['success' => true]);
}

function deleteCliente($body) {
    $idcliente = (int)($body['IdCliente'] ?? $body['idcliente'] ?? 0);
    if (!$idcliente) jsonError('IdCliente requerido');
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM Prestamo WHERE IdCliente = ?");
    $stmt->execute([$idcliente]);
    if ($stmt->fetchColumn() > 0) jsonError('No se puede eliminar: tiene préstamos asociados');
    $pdo->prepare("DELETE FROM Cliente WHERE IdCliente = ?")->execute([$idcliente]);
    jsonResponse(['success' => true]);
}
