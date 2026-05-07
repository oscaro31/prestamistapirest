<?php
function listMonedas() {
    $pdo = getDB();
    jsonResponse($pdo->query("SELECT * FROM Moneda ORDER BY FechaCreacion DESC")->fetchAll());
}

function createMoneda($body) {
    $nombre = trim($body['Nombre'] ?? $body['nombre'] ?? '');
    $simbolo = trim($body['Simbolo'] ?? $body['simbolo'] ?? '');
    if (empty($nombre) || empty($simbolo)) jsonError('Nombre y Simbolo requeridos');

    $pdo = getDB();
    $stmt = $pdo->prepare("INSERT INTO Moneda (Nombre, Simbolo) VALUES (?, ?)");
    $stmt->execute([$nombre, $simbolo]);
    jsonResponse(['IdMoneda' => (int)$pdo->lastInsertId()], 201);
}

function updateMoneda($body) {
    $idmoneda = (int)($body['IdMoneda'] ?? $body['idmoneda'] ?? 0);
    if (!$idmoneda) jsonError('IdMoneda requerido');

    $pdo = getDB();
    $fields = []; $params = [];
    foreach (['Nombre', 'Simbolo'] as $f) {
        if (isset($body[$f])) { $fields[] = "$f = ?"; $params[] = trim($body[$f]); }
    }
    if (empty($fields)) jsonError('Nada que actualizar');
    $params[] = $idmoneda;
    $pdo->prepare("UPDATE Moneda SET " . implode(', ', $fields) . " WHERE IdMoneda = ?")->execute($params);
    jsonResponse(['success' => true]);
}

function deleteMoneda($body) {
    $idmoneda = (int)($body['IdMoneda'] ?? $body['idmoneda'] ?? 0);
    if (!$idmoneda) jsonError('IdMoneda requerido');

    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM Prestamo WHERE IdMoneda = ?");
    $stmt->execute([$idmoneda]);
    if ($stmt->fetchColumn() > 0) jsonError('No se puede eliminar: tiene préstamos asociados');

    $pdo->prepare("DELETE FROM Moneda WHERE IdMoneda = ?")->execute([$idmoneda]);
    jsonResponse(['success' => true]);
}
