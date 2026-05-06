<?php
function listPrestamos($params) {
    $idPrestamo = (int)($params['IdPrestamo'] ?? 0);
    $nroDocumento = trim($params['NroDocumento'] ?? '');
    $idCliente = (int)($params['IdCliente'] ?? 0);
    $cliente = trim($params['cliente'] ?? '');
    $desde = trim($params['desde'] ?? '');
    $hasta = trim($params['hasta'] ?? '');

    $pdo = getDB();

    $sql = "SELECT p.*, c.Nombre as cliente_nombre, c.Apellido as cliente_apellido,
                   c.NroDocumento, c.Correo as cliente_correo, c.Telefono as cliente_telefono,
                   m.Nombre as moneda_nombre, m.Simbolo as moneda_simbolo
            FROM Prestamo p
            LEFT JOIN Cliente c ON c.IdCliente = p.IdCliente
            LEFT JOIN Moneda m ON m.IdMoneda = p.IdMoneda";

    $where = []; $paramsArr = [];
    if ($idPrestamo > 0) { $where[] = "p.IdPrestamo = ?"; $paramsArr[] = $idPrestamo; }
    if (!empty($nroDocumento)) { $where[] = "c.NroDocumento = ?"; $paramsArr[] = $nroDocumento; }
    if ($idCliente > 0) { $where[] = "p.IdCliente = ?"; $paramsArr[] = $idCliente; }
    if (!empty($cliente)) { $where[] = "CONCAT(c.Nombre, ' ', IFNULL(c.Apellido,'')) LIKE ?"; $paramsArr[] = '%'.$cliente.'%'; }
    if (!empty($desde)) { $where[] = "DATE(p.FechaCreacion) >= ?"; $paramsArr[] = $desde; }
    if (!empty($hasta)) { $where[] = "DATE(p.FechaCreacion) <= ?"; $paramsArr[] = $hasta; }

    if (!empty($where)) $sql .= " WHERE " . implode(' AND ', $where);
    $sql .= " ORDER BY p.FechaCreacion DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($paramsArr);
    $prestamos = $stmt->fetchAll();

    foreach ($prestamos as &$p) {
        $stmt2 = $pdo->prepare("SELECT * FROM PrestamoDetalle WHERE IdPrestamo = ? ORDER BY NroCuota");
        $stmt2->execute([$p['IdPrestamo']]);
        $p['cuotas'] = $stmt2->fetchAll();
    }

    jsonResponse($prestamos);
}

function createPrestamo($body) {
    $idCliente = (int)($body['IdCliente'] ?? $body['idcliente'] ?? 0);
    $idMoneda = (int)($body['IdMoneda'] ?? $body['idmoneda'] ?? 0);
    $monto = $body['MontoPrestamo'] ?? $body['monto_prestamo'] ?? 0;
    $interes = $body['InteresPorcentaje'] ?? $body['interes_porcentaje'] ?? 0;
    $nroCuotas = (int)($body['NroCuotas'] ?? $body['nro_cuotas'] ?? 0);
    $valorTotal = $body['ValorTotal'] ?? $body['valor_total'] ?? 0;
    $fechaInicio = $body['FechaInicioPago'] ?? $body['fecha_inicio_pago'] ?? date('Y-m-d');
    $formaPago = $body['FormaDePago'] ?? $body['forma_de_pago'] ?? 'Mensual';
    $valorCuota = $body['ValorPorCuota'] ?? $body['valor_por_cuota'] ?? 0;
    $valorInteres = $body['ValorInteres'] ?? $body['valor_interes'] ?? 0;

    if (!$idCliente || !$idMoneda || $monto <= 0 || $nroCuotas <= 0) {
        jsonError('Datos de préstamo incompletos');
    }

    $pdo = getDB();
    $pdo->beginTransaction();

    try {
        $stmt = $pdo->prepare("INSERT INTO Prestamo (IdCliente, IdMoneda, FechaInicioPago, MontoPrestamo,
                               InteresPorcentaje, NroCuotas, FormaDePago, ValorPorCuota, ValorInteres, ValorTotal)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$idCliente, $idMoneda, $fechaInicio, $monto, $interes, $nroCuotas,
                        $formaPago, $valorCuota, $valorInteres, $valorTotal]);
        $idPrestamo = (int)$pdo->lastInsertId();

        $cuotaMonto = $valorCuota ?: round($valorTotal / $nroCuotas, 2);
        $fechaBase = \DateTime::createFromFormat('Y-m-d', $fechaInicio);
        if (!$fechaBase) $fechaBase = new \DateTime();

        for ($i = 1; $i <= $nroCuotas; $i++) {
            $fechaVto = clone $fechaBase;
            $fechaVto->modify("+{$i} months");
            $stmt = $pdo->prepare("INSERT INTO PrestamoDetalle (IdPrestamo, NroCuota, FechaPago, MontoCuota, Estado) VALUES (?, ?, ?, ?, 'Pendiente')");
            $stmt->execute([$idPrestamo, $i, $fechaVto->format('Y-m-d'), $cuotaMonto]);
        }

        $pdo->commit();
        jsonResponse(['IdPrestamo' => $idPrestamo], 201);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonError('Error al crear préstamo: ' . $e->getMessage(), 500);
    }
}

function pagarCuotas($body) {
    $idPrestamo = (int)($body['IdPrestamo'] ?? $body['idprestamo'] ?? 0);
    $detallesIds = $body['detallesIds'] ?? $body['nro_cuotas_pagadas'] ?? '';

    if (!$idPrestamo || empty($detallesIds)) {
        jsonError('IdPrestamo y detallesIds requeridos');
    }

    $ids = is_array($detallesIds) ? $detallesIds : explode(',', $detallesIds);
    $pdo = getDB();
    $pdo->beginTransaction();

    try {
        foreach ($ids as $idDetalle) {
            $idDetalle = (int)trim($idDetalle);
            if ($idDetalle <= 0) continue;
            $stmt = $pdo->prepare("UPDATE PrestamoDetalle SET Estado = 'Pagado', FechaPagado = NOW() WHERE IdPrestamoDetalle = ? AND IdPrestamo = ? AND Estado = 'Pendiente'");
            $stmt->execute([$idDetalle, $idPrestamo]);
        }

        $stmt = $pdo->prepare("SELECT COUNT(*) FROM PrestamoDetalle WHERE IdPrestamo = ? AND Estado = 'Pendiente'");
        $stmt->execute([$idPrestamo]);
        if ($stmt->fetchColumn() == 0) {
            $pdo->prepare("UPDATE Prestamo SET Estado = 'Cancelado' WHERE IdPrestamo = ?")->execute([$idPrestamo]);
        }

        $pdo->commit();
        jsonResponse(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonError('Error al pagar: ' . $e->getMessage(), 500);
    }
}
