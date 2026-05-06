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
        $stmt2 = $pdo->prepare("SELECT *, 
            CASE WHEN Estado = 'Pendiente' AND FechaPago < CURDATE() THEN 1 ELSE 0 END as vencida
            FROM PrestamoDetalle WHERE IdPrestamo = ? ORDER BY NroCuota");
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
    $idTipoCuota = (int)($body['IdTipoCuota'] ?? $body['id_tipo_cuota'] ?? 3);

    if (!$idCliente || !$idMoneda || $monto <= 0 || $nroCuotas <= 0) {
        jsonError('Datos de préstamo incompletos');
    }

    // Validar límite máximo del cliente
    $stmtCliente = $pdo->prepare("SELECT LimiteMaximoPrestamo, LimitePrestamosActivos FROM Cliente WHERE IdCliente = ?");
    $stmtCliente->execute([$idCliente]);
    $clienteData = $stmtCliente->fetch();
    if ($clienteData) {
        // Validar límite de cantidad de préstamos activos
        if ($clienteData['LimitePrestamosActivos'] !== null && $clienteData['LimitePrestamosActivos'] > 0) {
            $stmtCount = $pdo->prepare("SELECT COUNT(*) as total FROM Prestamo WHERE IdCliente = ? AND Estado IN ('Pendiente', 'Activo')");
            $stmtCount->execute([$idCliente]);
            $activos = (int)$stmtCount->fetchColumn();
            $limiteActivos = (int)$clienteData['LimitePrestamosActivos'];
            if ($activos >= $limiteActivos) {
                jsonError('Límite de préstamos activos alcanzado para este cliente. Activos: ' . $activos . ', Límite: ' . $limiteActivos);
            }
        }
        // Validar límite monetario
        if ($clienteData['LimiteMaximoPrestamo'] !== null && $clienteData['LimiteMaximoPrestamo'] > 0) {
            $stmtSum = $pdo->prepare("SELECT COALESCE(SUM(MontoPrestamo), 0) as total_activo FROM Prestamo WHERE IdCliente = ? AND Estado IN ('Pendiente', 'Activo')");
            $stmtSum->execute([$idCliente]);
            $totalActivo = (float)$stmtSum->fetchColumn();
            $limite = (float)$clienteData['LimiteMaximoPrestamo'];
            if (($totalActivo + (float)$monto) > $limite) {
                jsonError('Límite máximo de préstamo excedido para este cliente. Monto actual activo: RD$' . number_format($totalActivo, 2) . ', Límite: RD$' . number_format($limite, 2));
            }
        }
    }

    // Mapa de tipo cuota a intervalo
    $intervalos = [
        1 => 'week',    // Semanal
        2 => '2 weeks', // Quincenal
        3 => 'month',   // Mensual
    ];
    $intervalo = $intervalos[$idTipoCuota] ?? 'month';

    $pdo = getDB();
    $pdo->beginTransaction();

    try {
        $stmt = $pdo->prepare("INSERT INTO Prestamo (IdCliente, IdMoneda, IdTipoCuota, FechaInicioPago, MontoPrestamo,
                               InteresPorcentaje, NroCuotas, FormaDePago, ValorPorCuota, ValorInteres, ValorTotal, Estado)
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente')");
        $stmt->execute([$idCliente, $idMoneda, $idTipoCuota, $fechaInicio, $monto, $interes, $nroCuotas,
                        $formaPago, $valorCuota, $valorInteres, $valorTotal]);
        $idPrestamo = (int)$pdo->lastInsertId();

        $cuotaMonto = $valorCuota > 0 ? $valorCuota : round($valorTotal / $nroCuotas, 2);
        $fechaBase = \DateTime::createFromFormat('Y-m-d', $fechaInicio);
        if (!$fechaBase) $fechaBase = new \DateTime();

        for ($i = 1; $i <= $nroCuotas; $i++) {
            $fechaVto = clone $fechaBase;
            $fechaVto->modify("+{$i} {$intervalo}");
            $stmt = $pdo->prepare("INSERT INTO PrestamoDetalle (IdPrestamo, NroCuota, FechaPago, MontoCuota, Estado) VALUES (?, ?, ?, ?, 'Pendiente')");
            $stmt->execute([$idPrestamo, $i, $fechaVto->format('Y-m-d'), $cuotaMonto]);
        }

        // Generar asiento contable automático (si hay configuración)
        try {
            generarAsientoAutomatico($pdo, 'prestamo_creado', $idPrestamo, $monto, 0, $fechaInicio, $body['_userId'] ?? 0);
        } catch (Exception $e) {
            // Si no hay config contable, no falla el préstamo
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
    $montosPagar = $body['montosPagar'] ?? [];
    $pagarTodo = !empty($body['pagarTodo']);

    if (!$idPrestamo || empty($detallesIds)) {
        jsonError('IdPrestamo y detallesIds requeridos');
    }

    $ids = is_array($detallesIds) ? $detallesIds : explode(',', $detallesIds);
    $montosArray = is_array($montosPagar) ? $montosPagar : [];
    $pdo = getDB();
    $pdo->beginTransaction();

    try {
        $idx = 0;
        foreach ($ids as $idDetalle) {
            $idDetalle = (int)trim($idDetalle);
            if ($idDetalle <= 0) continue;
            
            // Obtener monto actual de la cuota
            $stmtCuota = $pdo->prepare("SELECT MontoCuota, COALESCE(MontoPagado, 0) as Pagado, COALESCE(MoraCalculada, 0) as Mora FROM PrestamoDetalle WHERE IdPrestamoDetalle = ? AND IdPrestamo = ?");
            $stmtCuota->execute([$idDetalle, $idPrestamo]);
            $cuotaData = $stmtCuota->fetch();
            if (!$cuotaData) continue;
            
            $montoCuota = (float)$cuotaData['MontoCuota'];
            $yaPagado = (float)$cuotaData['Pagado'];
            $mora = (float)$cuotaData['Mora'];
            $totalCuota = $montoCuota + $mora;
            
            // Determinar monto a pagar en esta cuota
            if (!$pagarTodo && isset($montosArray[$idx])) {
                $montoPago = (float)$montosArray[$idx];
            } else {
                // Pago completo: montoCuota + mora - lo ya pagado
                $montoPago = $totalCuota - $yaPagado;
            }
            $montoPago = max(0, $montoPago);
            
            $nuevoPagado = $yaPagado + $montoPago;
            if ($nuevoPagado >= $totalCuota) {
                // Cuota pagada completamente (incluye mora)
                $stmt = $pdo->prepare("UPDATE PrestamoDetalle SET Estado = 'Pagado', FechaPagado = NOW(), MontoPagado = ? WHERE IdPrestamoDetalle = ? AND IdPrestamo = ?");
                $stmt->execute([$totalCuota, $idDetalle, $idPrestamo]);
            } else {
                // Pago parcial
                $stmt = $pdo->prepare("UPDATE PrestamoDetalle SET MontoPagado = ?, FechaPagado = NOW() WHERE IdPrestamoDetalle = ? AND IdPrestamo = ?");
                $stmt->execute([$nuevoPagado, $idDetalle, $idPrestamo]);
            }
            $idx++;
        }

        // Si no quedan cuotas pendientes, marcar préstamo como Cancelado
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM PrestamoDetalle WHERE IdPrestamo = ? AND Estado = 'Pendiente'");
        $stmt->execute([$idPrestamo]);
        if ($stmt->fetchColumn() == 0) {
            $pdo->prepare("UPDATE Prestamo SET Estado = 'Cancelado' WHERE IdPrestamo = ?")->execute([$idPrestamo]);
        }

        // Generar asiento contable automático
        try {
            // Obtener monto total pagado y monto de interes por cuota
            $stmtInfo = $pdo->prepare("SELECT SUM(MontoCuota) as total_pagado FROM PrestamoDetalle WHERE IdPrestamoDetalle IN (" . implode(',', array_fill(0, count($ids), '?')) . ")");
            $stmtInfo->execute(array_map('intval', $ids));
            $totalPagado = (float)$stmtInfo->fetchColumn();
            
            // Obtener el ValorInteres total del préstamo
            $stmtP = $pdo->prepare("SELECT ValorInteres, NroCuotas, ValorTotal FROM Prestamo WHERE IdPrestamo = ?");
            $stmtP->execute([$idPrestamo]);
            $pData = $stmtP->fetch();
            $interesTotal = (float)($pData['ValorInteres'] ?? 0);
            $totalCuotas = (int)($pData['NroCuotas'] ?? 1);
            
            // Calcular interés proporcional a las cuotas pagadas
            $interesProporcional = round(($interesTotal / $totalCuotas) * count($ids), 2);
            $capitalPagado = $totalPagado - $interesProporcional;
            
            if ($totalPagado > 0) {
                generarAsientoAutomatico($pdo, 'prestamo_pagado', $idPrestamo, $capitalPagado, $interesProporcional, date('Y-m-d'), $body['_userId'] ?? 0);
            }
        } catch (Exception $e) {
            // No fallar el pago si no hay config contable
        }

        $pdo->commit();
        jsonResponse(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonError('Error al pagar: ' . $e->getMessage(), 500);
    }
}

// =============================================
// Helper: Generar asiento contable automático
// =============================================
function generarAsientoAutomatico($pdo, $tipoAccion, $idPrestamo, $montoCapital, $montoInteres, $fecha, $idusuario) {
    // Mapear tipo de accion al módulo en config_contable
    $moduloMap = [
        'prestamo_creado' => 'prestamo_creado',
        'prestamo_pagado' => 'prestamo_capital_pagado',
    ];
    $modulo = $moduloMap[$tipoAccion] ?? $tipoAccion;
    
    // Buscar configuración contable
    $stmt = $pdo->prepare("SELECT * FROM config_contable WHERE modulo = ? AND (submodulo = '' OR submodulo IS NULL)");
    $stmt->execute([$modulo]);
    $config = $stmt->fetch();
    
    if (!$config) {
        // Intentar con el nombre exacto por si el usuario lo configuró así
        $stmt2 = $pdo->prepare("SELECT * FROM config_contable WHERE modulo = ? AND (submodulo = '' OR submodulo IS NULL)");
        $stmt2->execute([$tipoAccion]);
        $config = $stmt2->fetch();
    }
    
    if (!$config) return; // Sin config contable, no genera asiento
    
    $conceptos = [
        'prestamo_creado' => 'Desembolso de préstamo #' . $idPrestamo,
        'prestamo_pagado' => 'Pago de cuota(s) - Préstamo #' . $idPrestamo,
    ];
    $concepto = $conceptos[$tipoAccion] ?? 'Operación - Préstamo #' . $idPrestamo;
    
    $idcuentaDebe = (int)($config['idcuenta_debe'] ?? 0);
    $idcuentaHaber = (int)($config['idcuenta_haber'] ?? 0);
    
    if (!$idcuentaDebe || !$idcuentaHaber) return;
    
    $stmtAsiento = $pdo->prepare("INSERT INTO asiento_contable (fecha, concepto, idtipocomprobante, idusuarioregistro, idmodulo, idmoduloref) VALUES (?,?,2,?,?,?)");
    $modulo = ($tipoAccion === 'prestamo_creado') ? 'prestamo' : 'pago';
    $stmtAsiento->execute([$fecha, $concepto, $idusuario, $modulo, $idPrestamo]);
    $idasiento = (int)$pdo->lastInsertId();
    
    $detStmt = $pdo->prepare("INSERT INTO asiento_detalle (idasiento, idcuenta, debe, haber) VALUES (?,?,?,?)");
    
    if ($tipoAccion === 'prestamo_creado') {
        // Desembolso: Activo (cuentas x cobrar) vs Caja/Banco
        $detStmt->execute([$idasiento, $idcuentaDebe, $montoCapital, 0]);
        $detStmt->execute([$idasiento, $idcuentaHaber, 0, $montoCapital]);
    } elseif ($tipoAccion === 'prestamo_pagado') {
        if ($montoCapital > 0) {
            $detStmt->execute([$idasiento, $idcuentaDebe, $montoCapital, 0]);
            $detStmt->execute([$idasiento, $idcuentaHaber, 0, $montoCapital]);
        }
        // Si hay interés, registrarlo por separado
        if ($montoInteres > 0) {
            $intCta = $pdo->prepare("SELECT idcuenta FROM plan_cuenta WHERE codigo = '4.1.01'");
            $intCta->execute();
            $idcuentaInteres = (int)$intCta->fetchColumn();
            if ($idcuentaInteres) {
                $detStmt->execute([$idasiento, $idcuentaDebe, $montoInteres, 0]);
                $detStmt->execute([$idasiento, $idcuentaInteres, 0, $montoInteres]);
            }
        }
    }
}
