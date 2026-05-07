<?php
function listConfig() {
    $pdo = getDB();
    try {
        jsonResponse($pdo->query("SELECT * FROM configuracion ORDER BY Clave")->fetchAll());
    } catch (Exception $e) {
        // Si la tabla no existe en BD universal, devolver vacío
        jsonResponse([]);
    }
}

function updateConfig($body) {
    $clave = trim($body['Clave'] ?? $body['clave'] ?? '');
    $valor = trim($body['valor'] ?? '');

    if (empty($clave)) jsonError('Clave requerida');

    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM configuracion WHERE Clave = ?");
    $stmt->execute([$clave]);

    if ($stmt->fetchColumn() > 0) {
        $pdo->prepare("UPDATE configuracion SET valor = ? WHERE Clave = ?")->execute([$valor, $clave]);
    } else {
        $pdo->prepare("INSERT INTO configuracion (Clave, valor) VALUES (?, ?)")->execute([$clave, $valor]);
    }

    jsonResponse(['success' => true]);
}
