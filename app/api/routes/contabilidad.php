<?php
// =============================================
// Prestamist - Módulo Contable (Contabilidad)
// =============================================

// ================================
// PLAN DE CUENTAS
// ================================
function listPlanCuentas() {
    $pdo = getDB();
    $stmt = $pdo->query("SELECT * FROM plan_cuenta ORDER BY codigo");
    $rows = $stmt->fetchAll();
    $map = [];
    foreach ($rows as $r) {
        $map[$r['idcuenta']] = $r;
        $map[$r['idcuenta']]['children'] = [];
    }
    $tree = [];
    foreach ($map as $id => &$r) {
        if ($r['idpadre'] && isset($map[$r['idpadre']])) {
            $map[$r['idpadre']]['children'][] = &$r;
        } else {
            $tree[] = &$r;
        }
    }
    unset($r);
    jsonResponse(['success' => true, 'data' => $tree, 'list' => $rows]);
}

function createPlanCuenta($body) {
    $pdo = getDB();
    $codigo = trim($body['codigo'] ?? '');
    $nombre = trim($body['nombre'] ?? '');
    $tipo = $body['tipo'] ?? '';
    $nivel = (int)($body['nivel'] ?? 1);
    $idpadre = $body['idpadre'] ? (int)$body['idpadre'] : null;
    $naturaleza = $body['naturaleza'] ?? 'Debe';
    
    if (!$codigo || !$nombre || !$tipo) {
        jsonError('Código, nombre y tipo son requeridos', 400);
    }
    $validTipos = ['Activo','Pasivo','Capital','Ingreso','Gasto'];
    if (!in_array($tipo, $validTipos)) {
        jsonError('Tipo inválido', 400);
    }
    $validNats = ['Debe','Haber'];
    if (!in_array($naturaleza, $validNats)) {
        jsonError('Naturaleza inválida', 400);
    }
    
    $stmt = $pdo->prepare("INSERT INTO plan_cuenta (codigo, nombre, tipo, nivel, idpadre, naturaleza) VALUES (?,?,?,?,?,?)");
    $stmt->execute([$codigo, $nombre, $tipo, $nivel, $idpadre, $naturaleza]);
    jsonResponse(['success' => true, 'data' => ['idcuenta' => (int)$pdo->lastInsertId()], 'message' => 'Cuenta creada']);
}

function updatePlanCuenta($body) {
    $pdo = getDB();
    $idcuenta = (int)($body['idcuenta'] ?? 0);
    if (!$idcuenta) jsonError('ID requerido', 400);
    
    $fields = [];
    $params = [];
    foreach (['codigo','nombre','tipo','naturaleza'] as $f) {
        if (isset($body[$f])) {
            $fields[] = "$f = ?";
            $params[] = $body[$f];
        }
    }
    if (isset($body['nivel'])) {
        $fields[] = "nivel = ?";
        $params[] = (int)$body['nivel'];
    }
    if (array_key_exists('idpadre', $body)) {
        $fields[] = "idpadre = ?";
        $params[] = $body['idpadre'] ? (int)$body['idpadre'] : null;
    }
    if (array_key_exists('activo', $body)) {
        $fields[] = "activo = ?";
        $params[] = (int)$body['activo'];
    }
    if (empty($fields)) jsonError('Sin campos para actualizar', 400);
    
    $params[] = $idcuenta;
    $sql = "UPDATE plan_cuenta SET " . implode(', ', $fields) . " WHERE idcuenta = ?";
    $pdo->prepare($sql)->execute($params);
    jsonResponse(['success' => true, 'message' => 'Cuenta actualizada']);
}

function deletePlanCuenta($body) {
    $pdo = getDB();
    $idcuenta = (int)($body['idcuenta'] ?? 0);
    if (!$idcuenta) jsonError('ID requerido', 400);
    
    $check = $pdo->prepare("SELECT COUNT(*) FROM plan_cuenta WHERE idpadre = ?");
    $check->execute([$idcuenta]);
    if ($check->fetchColumn() > 0) {
        jsonError('No se puede eliminar: tiene cuentas hijas', 400);
    }
    
    $check = $pdo->prepare("SELECT COUNT(*) FROM asiento_detalle WHERE idcuenta = ?");
    $check->execute([$idcuenta]);
    if ($check->fetchColumn() > 0) {
        jsonError('No se puede eliminar: tiene movimientos contables', 400);
    }
    
    $pdo->prepare("DELETE FROM plan_cuenta WHERE idcuenta = ?")->execute([$idcuenta]);
    jsonResponse(['success' => true, 'message' => 'Cuenta eliminada']);
}

// ================================
// ASIENTOS CONTABLES
// ================================
function listAsientos($body) {
    $pdo = getDB();
    $where = [];
    $params = [];
    
    if (!empty($body['fecha_desde'])) {
        $where[] = "a.fecha >= ?";
        $params[] = $body['fecha_desde'];
    }
    if (!empty($body['fecha_hasta'])) {
        $where[] = "a.fecha <= ?";
        $params[] = $body['fecha_hasta'];
    }
    if (!empty($body['modulo'])) {
        $where[] = "a.idmodulo = ?";
        $params[] = $body['modulo'];
    }
    if (!empty($body['idmoduloref'])) {
        $where[] = "a.idmoduloref = ?";
        $params[] = (int)$body['idmoduloref'];
    }
    
    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM asiento_contable a $whereSQL");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();
    
    $page = max(1, (int)($body['page'] ?? 1));
    $limit = max(1, min(100, (int)($body['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;
    
    $sql = "SELECT a.*, tc.nombre AS tipocomprobante_nombre, tc.abreviatura
            FROM asiento_contable a
            LEFT JOIN tipo_comprobante tc ON a.idtipocomprobante = tc.idtipocomprobante
            $whereSQL
            ORDER BY a.fecha DESC, a.idasiento DESC
            LIMIT $limit OFFSET $offset";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    
    foreach ($rows as &$r) {
        $det = $pdo->prepare("SELECT SUM(debe) as tdebe, SUM(haber) as thaber FROM asiento_detalle WHERE idasiento = ?");
        $det->execute([$r['idasiento']]);
        $tot = $det->fetch();
        $r['total_debe'] = (float)($tot['tdebe'] ?? 0);
        $r['total_haber'] = (float)($tot['thaber'] ?? 0);
    }
    unset($r);
    
    jsonResponse([
        'list' => $rows,
        'total' => $total,
        'page' => $page,
        'pages' => ceil($total / $limit)
    ]);
}

function createAsiento($body) {
    $pdo = getDB();
    $pdo->beginTransaction();
    try {
        $fecha = $body['fecha'] ?? date('Y-m-d');
        $concepto = trim($body['concepto'] ?? '');
        $idtipocomprobante = (int)($body['idtipocomprobante'] ?? 1);
        $idusuario = $body['_userId'] ?? 0;
        $idmodulo = $body['idmodulo'] ?? null;
        $idmoduloref = $body['idmoduloref'] ? (int)$body['idmoduloref'] : null;
        
        if (!$concepto) {
            jsonError('Concepto requerido', 400);
        }
        
        $detalles = $body['detalles'] ?? [];
        if (empty($detalles)) {
            jsonError('Debe incluir al menos un detalle', 400);
        }
        
        $stmt = $pdo->prepare("INSERT INTO asiento_contable (fecha, concepto, idtipocomprobante, idusuarioregistro, idmodulo, idmoduloref) VALUES (?,?,?,?,?,?)");
        $stmt->execute([$fecha, $concepto, $idtipocomprobante, $idusuario, $idmodulo, $idmoduloref]);
        $idasiento = (int)$pdo->lastInsertId();
        
        $totalDebe = 0;
        $totalHaber = 0;
        $detStmt = $pdo->prepare("INSERT INTO asiento_detalle (idasiento, idcuenta, debe, haber) VALUES (?,?,?,?)");
        
        foreach ($detalles as $d) {
            $idcuenta = (int)($d['idcuenta'] ?? 0);
            $debe = (float)($d['debe'] ?? 0);
            $haber = (float)($d['haber'] ?? 0);
            if (!$idcuenta) continue;
            $detStmt->execute([$idasiento, $idcuenta, $debe, $haber]);
            $totalDebe += $debe;
            $totalHaber += $haber;
        }
        
        if (abs($totalDebe - $totalHaber) > 0.01) {
            $pdo->rollBack();
            jsonError('El asiento no está balanceado: Débito ' . number_format($totalDebe,2) . ' ≠ Crédito ' . number_format($totalHaber,2), 400);
        }
        
        $pdo->commit();
        jsonResponse(['success' => true, 'data' => ['idasiento' => $idasiento], 'message' => 'Asiento creado']);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function anularAsiento($body) {
    $pdo = getDB();
    $idasiento = (int)($body['idasiento'] ?? 0);
    if (!$idasiento) jsonError('ID requerido', 400);
    $stmt = $pdo->prepare("UPDATE asiento_contable SET idtipoestados = 2 WHERE idasiento = ?");
    $stmt->execute([$idasiento]);
    jsonResponse(['success' => true, 'message' => 'Asiento anulado']);
}

function getAsiento($body) {
    $pdo = getDB();
    $idasiento = (int)($body['idasiento'] ?? 0);
    if (!$idasiento) jsonError('ID requerido', 400);
    
    $stmt = $pdo->prepare("SELECT a.*, tc.nombre AS tipocomprobante_nombre, tc.abreviatura
        FROM asiento_contable a
        LEFT JOIN tipo_comprobante tc ON a.idtipocomprobante = tc.idtipocomprobante
        WHERE a.idasiento = ?");
    $stmt->execute([$idasiento]);
    $asiento = $stmt->fetch();
    if (!$asiento) jsonError('Asiento no encontrado', 404);
    
    $detStmt = $pdo->prepare("SELECT d.*, p.codigo, p.nombre AS cuenta_nombre
        FROM asiento_detalle d
        JOIN plan_cuenta p ON d.idcuenta = p.idcuenta
        WHERE d.idasiento = ?
        ORDER BY d.iddetalle");
    $detStmt->execute([$idasiento]);
    $detalles = $detStmt->fetchAll();
    
    $totalDebe = 0;
    $totalHaber = 0;
    foreach ($detalles as $d) {
        $totalDebe += (float)$d['debe'];
        $totalHaber += (float)$d['haber'];
    }
    
    $asiento['detalles'] = $detalles;
    $asiento['total_debe'] = $totalDebe;
    $asiento['total_haber'] = $totalHaber;
    
    jsonResponse(['success' => true, 'data' => $asiento]);
}

function generarAsientosPrestamo($body) {
    $pdo = getDB();
    $pdo->beginTransaction();
    try {
        $accion = $body['accion'] ?? '';
        $idprestamo = (int)($body['idmoduloref'] ?? 0);
        $monto = (float)($body['monto'] ?? 0);
        $interes = (float)($body['interes'] ?? 0);
        $idusuario = $body['_userId'] ?? 0;
        $fecha = $body['fecha'] ?? date('Y-m-d');
        
        if (!$accion || !$idprestamo) {
            jsonError('Acción y referencia de préstamo requeridas', 400);
        }
        
        $configStmt = $pdo->prepare("SELECT cc.*, dc.codigo AS codigo_debe, dc.nombre AS nombre_debe,
            hc.codigo AS codigo_haber, hc.nombre AS nombre_haber
            FROM config_contable cc
            LEFT JOIN plan_cuenta dc ON cc.idcuenta_debe = dc.idcuenta
            LEFT JOIN plan_cuenta hc ON cc.idcuenta_haber = hc.idcuenta
            WHERE cc.modulo = ? AND cc.submodulo = ''");
        $configStmt->execute([$accion]);
        $config = $configStmt->fetch();
        
        if (!$config) {
            jsonError('No hay configuración contable para: ' . $accion, 400);
        }
        
        $conceptos = [
            'prestamo_creado' => 'Desembolso de préstamo #' . $idprestamo,
            'prestamo_pagado' => 'Pago de cuota - Préstamo #' . $idprestamo,
            'prestamo_mora' => 'Ingreso por mora - Préstamo #' . $idprestamo,
            'prestamo_abono' => 'Abono parcial - Préstamo #' . $idprestamo,
            'prestamo_interes' => 'Interés devengado - Préstamo #' . $idprestamo,
        ];
        $concepto = $conceptos[$accion] ?? 'Asiento automático - Préstamo #' . $idprestamo;
        
        $stmt = $pdo->prepare("INSERT INTO asiento_contable (fecha, concepto, idtipocomprobante, idusuarioregistro, idmodulo, idmoduloref) VALUES (?,?,2,?,?,?)");
        $stmt->execute([$fecha, $concepto, $idusuario, 'prestamos', $idprestamo]);
        $idasiento = (int)$pdo->lastInsertId();
        
        $detStmt = $pdo->prepare("INSERT INTO asiento_detalle (idasiento, idcuenta, debe, haber) VALUES (?,?,?,?)");
        
        if ($accion === 'prestamo_creado') {
            $detStmt->execute([$idasiento, $config['idcuenta_debe'], $monto, 0]);
            $detStmt->execute([$idasiento, $config['idcuenta_haber'], 0, $monto]);
        } elseif ($accion === 'prestamo_pagado') {
            $capital = $monto - $interes;
            if ($capital > 0) {
                $detStmt->execute([$idasiento, $config['idcuenta_debe'], $capital, 0]);
                $detStmt->execute([$idasiento, $config['idcuenta_haber'], 0, $capital]);
            }
            if ($interes > 0) {
                $interesCta = $pdo->query("SELECT idcuenta FROM plan_cuenta WHERE codigo = '4.1.01'")->fetchColumn();
                $bancoCta = $pdo->query("SELECT idcuenta FROM plan_cuenta WHERE codigo = '1.1.02'")->fetchColumn();
                if ($interesCta && $bancoCta) {
                    $detStmt->execute([$idasiento, $bancoCta, $interes, 0]);
                    $detStmt->execute([$idasiento, $interesCta, 0, $interes]);
                }
            }
        } elseif ($accion === 'prestamo_mora') {
            $detStmt->execute([$idasiento, $config['idcuenta_debe'], $monto, 0]);
            $detStmt->execute([$idasiento, $config['idcuenta_haber'], 0, $monto]);
        } elseif ($accion === 'prestamo_abono') {
            $detStmt->execute([$idasiento, $config['idcuenta_debe'], $monto, 0]);
            $detStmt->execute([$idasiento, $config['idcuenta_haber'], 0, $monto]);
        } elseif ($accion === 'prestamo_interes') {
            $detStmt->execute([$idasiento, $config['idcuenta_debe'], $interes, 0]);
            $detStmt->execute([$idasiento, $config['idcuenta_haber'], 0, $interes]);
        }
        
        $pdo->commit();
        jsonResponse(['success' => true, 'data' => ['idasiento' => $idasiento], 'message' => 'Asiento generado automáticamente']);
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

// ================================
// CONFIGURACIÓN CONTABLE
// ================================
function listConfigContable() {
    $pdo = getDB();
    $stmt = $pdo->query("SELECT cc.*, 
        dc.codigo AS codigo_debe, dc.nombre AS nombre_debe,
        hc.codigo AS codigo_haber, hc.nombre AS nombre_haber
        FROM config_contable cc
        LEFT JOIN plan_cuenta dc ON cc.idcuenta_debe = dc.idcuenta
        LEFT JOIN plan_cuenta hc ON cc.idcuenta_haber = hc.idcuenta
        ORDER BY cc.modulo, cc.submodulo");
    jsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
}

function updateConfigContable($body) {
    $pdo = getDB();
    $idconfig = (int)($body['idconfig'] ?? 0);
    if (!$idconfig) jsonError('ID requerido', 400);
    
    $fields = [];
    $params = [];
    if (array_key_exists('idcuenta_debe', $body)) {
        $fields[] = "idcuenta_debe = ?";
        $params[] = $body['idcuenta_debe'] ? (int)$body['idcuenta_debe'] : null;
    }
    if (array_key_exists('idcuenta_haber', $body)) {
        $fields[] = "idcuenta_haber = ?";
        $params[] = $body['idcuenta_haber'] ? (int)$body['idcuenta_haber'] : null;
    }
    if (isset($body['descripcion'])) {
        $fields[] = "descripcion = ?";
        $params[] = $body['descripcion'];
    }
    if (empty($fields)) jsonError('Sin campos para actualizar', 400);
    
    $params[] = $idconfig;
    $pdo->prepare("UPDATE config_contable SET " . implode(', ', $fields) . " WHERE idconfig = ?")->execute($params);
    jsonResponse(['success' => true, 'message' => 'Configuración actualizada']);
}

// ================================
// REPORTES CONTABLES
// ================================
function balanceComprobacion($body) {
    $pdo = getDB();
    $fecha_desde = $body['fecha_desde'] ?? date('Y-01-01');
    $fecha_hasta = $body['fecha_hasta'] ?? date('Y-m-d');
    
    $sql = "SELECT p.idcuenta, p.codigo, p.nombre, p.tipo, p.naturaleza,
            COALESCE(SUM(d.debe), 0) AS total_debe,
            COALESCE(SUM(d.haber), 0) AS total_haber
            FROM plan_cuenta p
            LEFT JOIN asiento_detalle d ON p.idcuenta = d.idcuenta
            LEFT JOIN asiento_contable a ON d.idasiento = a.idasiento AND a.fecha BETWEEN ? AND ?
            WHERE p.nivel = 3
            GROUP BY p.idcuenta, p.codigo, p.nombre, p.tipo, p.naturaleza
            ORDER BY p.codigo";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$fecha_desde, $fecha_hasta]);
    $rows = $stmt->fetchAll();
    
    foreach ($rows as &$r) {
        $debe = (float)$r['total_debe'];
        $haber = (float)$r['total_haber'];
        if ($r['naturaleza'] === 'Debe') {
            $r['saldo'] = $debe - $haber;
        } else {
            $r['saldo'] = $haber - $debe;
        }
    }
    unset($r);
    
    jsonResponse(['success' => true, 'data' => $rows]);
}

function libroDiario($body) {
    $pdo = getDB();
    $fecha_desde = $body['fecha_desde'] ?? date('Y-01-01');
    $fecha_hasta = $body['fecha_hasta'] ?? date('Y-m-d');
    
    $sql = "SELECT a.idasiento, a.fecha, a.concepto, tc.abreviatura,
            d.iddetalle, d.idcuenta, d.debe, d.haber,
            p.codigo, p.nombre AS cuenta_nombre
            FROM asiento_contable a
            JOIN asiento_detalle d ON a.idasiento = d.idasiento
            LEFT JOIN tipo_comprobante tc ON a.idtipocomprobante = tc.idtipocomprobante
            JOIN plan_cuenta p ON d.idcuenta = p.idcuenta
            WHERE a.fecha BETWEEN ? AND ?
            ORDER BY a.fecha, a.idasiento, d.iddetalle";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$fecha_desde, $fecha_hasta]);
    $rows = $stmt->fetchAll();
    
    // Group by asiento
    $asientos = [];
    foreach ($rows as $r) {
        $id = $r['idasiento'];
        if (!isset($asientos[$id])) {
            $asientos[$id] = [
                'idasiento' => $r['idasiento'],
                'fecha' => $r['fecha'],
                'concepto' => $r['concepto'],
                'abreviatura' => $r['abreviatura'],
                'detalles' => [],
                'total_debe' => 0,
                'total_haber' => 0,
            ];
        }
        $asientos[$id]['detalles'][] = [
            'iddetalle' => $r['iddetalle'],
            'codigo' => $r['codigo'],
            'cuenta_nombre' => $r['cuenta_nombre'],
            'debe' => (float)$r['debe'],
            'haber' => (float)$r['haber'],
        ];
        $asientos[$id]['total_debe'] += (float)$r['debe'];
        $asientos[$id]['total_haber'] += (float)$r['haber'];
    }
    
    jsonResponse(['success' => true, 'data' => array_values($asientos)]);
}

function libroMayor($body) {
    $pdo = getDB();
    $idcuenta = (int)($body['idcuenta'] ?? 0);
    $fecha_desde = $body['fecha_desde'] ?? date('Y-01-01');
    $fecha_hasta = $body['fecha_hasta'] ?? date('Y-m-d');
    
    if ($idcuenta) {
        $sql = "SELECT a.idasiento, a.fecha, a.concepto, d.debe, d.haber, d.idcuenta,
                pc.codigo, pc.nombre, pc.naturaleza,
                tc.abreviatura
                FROM asiento_contable a
                JOIN asiento_detalle d ON a.idasiento = d.idasiento
                JOIN plan_cuenta pc ON d.idcuenta = pc.idcuenta
                LEFT JOIN tipo_comprobante tc ON a.idtipocomprobante = tc.idtipocomprobante
                WHERE d.idcuenta = ? AND a.fecha BETWEEN ? AND ?
                ORDER BY a.fecha, a.idasiento";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$idcuenta, $fecha_desde, $fecha_hasta]);
        $movimientos = $stmt->fetchAll();
        $cuenta = $pdo->prepare("SELECT * FROM plan_cuenta WHERE idcuenta = ?");
        $cuenta->execute([$idcuenta]);
        $info = $cuenta->fetch();
        $saldoAnt = $pdo->prepare("SELECT COALESCE(SUM(CASE WHEN p.naturaleza='Debe' THEN d.debe - d.haber ELSE d.haber - d.debe END), 0) FROM asiento_detalle d JOIN asiento_contable a ON d.idasiento = a.idasiento JOIN plan_cuenta p ON d.idcuenta = p.idcuenta WHERE d.idcuenta = ? AND a.fecha < ?");
        $saldoAnt->execute([$idcuenta, $fecha_desde]);
        $saldoAnterior = (float)$saldoAnt->fetchColumn();
        $saldo = $saldoAnterior;
        foreach ($movimientos as &$m) {
            $debe = (float)$m['debe'];
            $haber = (float)$m['haber'];
            if ($info['naturaleza'] === 'Debe') $saldo += $debe - $haber;
            else $saldo += $haber - $debe;
            $m['saldo'] = $saldo;
        }
        unset($m);
        $totalDebe = $totalHaber = 0;
        foreach ($movimientos as $m) { $totalDebe += (float)$m['debe']; $totalHaber += (float)$m['haber']; }
        jsonResponse(['success'=>true,'data'=>['cuenta'=>$info?:[],'saldo_anterior'=>$saldoAnterior,'movimientos'=>$movimientos,'total_debe'=>$totalDebe,'total_haber'=>$totalHaber,'saldo_final'=>$saldo]]);
    } else {
        $cuentas = $pdo->query("SELECT idcuenta, codigo, nombre, naturaleza FROM plan_cuenta WHERE activo=1 ORDER BY codigo")->fetchAll();
        $resultados = [];
        foreach ($cuentas as $cta) {
            $stmt = $pdo->prepare("SELECT a.idasiento, a.fecha, a.concepto, d.debe, d.haber, pc.codigo, pc.nombre, pc.naturaleza, tc.abreviatura FROM asiento_contable a JOIN asiento_detalle d ON a.idasiento = d.idasiento JOIN plan_cuenta pc ON d.idcuenta = pc.idcuenta LEFT JOIN tipo_comprobante tc ON a.idtipocomprobante = tc.idtipocomprobante WHERE d.idcuenta = ? AND a.fecha BETWEEN ? AND ? ORDER BY a.fecha");
            $stmt->execute([$cta['idcuenta'], $fecha_desde, $fecha_hasta]);
            $movs = $stmt->fetchAll();
            $saldoAnt = $pdo->prepare("SELECT COALESCE(SUM(CASE WHEN p.naturaleza='Debe' THEN d.debe - d.haber ELSE d.haber - d.debe END), 0) FROM asiento_detalle d JOIN asiento_contable a ON d.idasiento = a.idasiento JOIN plan_cuenta p ON d.idcuenta = p.idcuenta WHERE d.idcuenta = ? AND a.fecha < ?");
            $saldoAnt->execute([$cta['idcuenta'], $fecha_desde]);
            $saldoAnterior = (float)$saldoAnt->fetchColumn();
            $saldo = $saldoAnterior;
            foreach ($movs as &$m) {
                $debe = (float)$m['debe'];
                $haber = (float)$m['haber'];
                if ($cta['naturaleza'] === 'Debe') $saldo += $debe - $haber;
                else $saldo += $haber - $debe;
                $m['saldo'] = $saldo;
            }
            unset($m);
            $td = 0; $th = 0;
            foreach ($movs as $mm) { $td += (float)$mm['debe']; $th += (float)$mm['haber']; }
            $resultados[] = ['cuenta'=>$cta, 'saldo_anterior'=>$saldoAnterior, 'movimientos'=>$movs, 'total_debe'=>$td, 'total_haber'=>$th, 'saldo_final'=>$saldo];
        }
        jsonResponse(['success'=>true,'data'=>['cuentas'=>$resultados]]);
    }
}

function estadoResultados($body) {
    $pdo = getDB();
    $fecha_desde = $body['fecha_desde'] ?? date('Y-01-01');
    $fecha_hasta = $body['fecha_hasta'] ?? date('Y-m-d');
    
    // Ingresos
    $ingStmt = $pdo->prepare("SELECT p.idcuenta, p.codigo, p.nombre,
        COALESCE(SUM(CASE WHEN p.naturaleza='Haber' THEN d.haber - d.debe ELSE 0 END), 0) AS total
        FROM plan_cuenta p
        LEFT JOIN asiento_detalle d ON p.idcuenta = d.idcuenta
        LEFT JOIN asiento_contable a ON d.idasiento = a.idasiento AND a.fecha BETWEEN ? AND ?
        WHERE p.tipo = 'Ingreso' AND p.nivel = 3
        GROUP BY p.idcuenta, p.codigo, p.nombre
        ORDER BY p.codigo");
    $ingStmt->execute([$fecha_desde, $fecha_hasta]);
    $ingresos = $ingStmt->fetchAll();
    
    // Gastos
    $gasStmt = $pdo->prepare("SELECT p.idcuenta, p.codigo, p.nombre,
        COALESCE(SUM(CASE WHEN p.naturaleza='Debe' THEN d.debe - d.haber ELSE 0 END), 0) AS total
        FROM plan_cuenta p
        LEFT JOIN asiento_detalle d ON p.idcuenta = d.idcuenta
        LEFT JOIN asiento_contable a ON d.idasiento = a.idasiento AND a.fecha BETWEEN ? AND ?
        WHERE p.tipo = 'Gasto' AND p.nivel = 3
        GROUP BY p.idcuenta, p.codigo, p.nombre
        ORDER BY p.codigo");
    $gasStmt->execute([$fecha_desde, $fecha_hasta]);
    $gastos = $gasStmt->fetchAll();
    
    $totalIngresos = 0;
    foreach ($ingresos as $i) $totalIngresos += (float)$i['total'];
    
    $totalGastos = 0;
    foreach ($gastos as $g) $totalGastos += (float)$g['total'];
    
    $utilidad = $totalIngresos - $totalGastos;
    
    jsonResponse([
        'success' => true,
        'data' => [
            'ingresos' => $ingresos,
            'gastos' => $gastos,
            'total_ingresos' => $totalIngresos,
            'total_gastos' => $totalGastos,
            'utilidad_neta' => $utilidad,
        ]
    ]);
}


function balanceGeneral() {
    $pdo = getDB();
    
    // Activos
    $actStmt = $pdo->query("SELECT p.idcuenta, p.codigo, p.nombre,
        COALESCE(SUM(CASE WHEN p.naturaleza='Debe' THEN d.debe - d.haber ELSE 0 END), 0) AS total
        FROM plan_cuenta p
        LEFT JOIN asiento_detalle d ON p.idcuenta = d.idcuenta
        WHERE p.tipo = 'Activo' AND p.nivel = 3
        GROUP BY p.idcuenta, p.codigo, p.nombre
        ORDER BY p.codigo");
    $activos = $actStmt->fetchAll();
    
    // Pasivos
    $pasStmt = $pdo->query("SELECT p.idcuenta, p.codigo, p.nombre,
        COALESCE(SUM(CASE WHEN p.naturaleza='Haber' THEN d.haber - d.debe ELSE 0 END), 0) AS total
        FROM plan_cuenta p
        LEFT JOIN asiento_detalle d ON p.idcuenta = d.idcuenta
        WHERE p.tipo = 'Pasivo' AND p.nivel = 3
        GROUP BY p.idcuenta, p.codigo, p.nombre
        ORDER BY p.codigo");
    $pasivos = $pasStmt->fetchAll();
    
    // Capital
    $capStmt = $pdo->query("SELECT p.idcuenta, p.codigo, p.nombre,
        COALESCE(SUM(CASE WHEN p.naturaleza='Haber' THEN d.haber - d.debe ELSE 0 END), 0) AS total
        FROM plan_cuenta p
        LEFT JOIN asiento_detalle d ON p.idcuenta = d.idcuenta
        WHERE p.tipo = 'Capital' AND p.nivel = 3
        GROUP BY p.idcuenta, p.codigo, p.nombre
        ORDER BY p.codigo");
    $capital = $capStmt->fetchAll();
    
    $totalActivos = 0;
    foreach ($activos as $a) $totalActivos += (float)$a['total'];
    
    $totalPasivos = 0;
    foreach ($pasivos as $p) $totalPasivos += (float)$p['total'];
    
    $totalCapital = 0;
    foreach ($capital as $c) $totalCapital += (float)$c['total'];
    
    // Add current period net income to capital (Ingresos - Gastos)
    $utilidadStmt = $pdo->query("SELECT 
        COALESCE((SELECT COALESCE(SUM(CASE WHEN p.naturaleza='Haber' THEN d.haber - d.debe ELSE 0 END), 0)
            FROM plan_cuenta p
            JOIN asiento_detalle d ON p.idcuenta = d.idcuenta
            WHERE p.tipo = 'Ingreso' AND p.nivel = 3), 0) -
        COALESCE((SELECT COALESCE(SUM(CASE WHEN p.naturaleza='Debe' THEN d.debe - d.haber ELSE 0 END), 0)
            FROM plan_cuenta p
            JOIN asiento_detalle d ON p.idcuenta = d.idcuenta
            WHERE p.tipo = 'Gasto' AND p.nivel = 3), 0) AS utilidad_neta");
    $utilidadFila = $utilidadStmt->fetch();
    $utilidadNeta = (float)$utilidadFila['utilidad_neta'];
    $totalCapitalConUtilidad = $totalCapital + $utilidadNeta;
    
    jsonResponse([
        'success' => true,
        'data' => [
            'activos' => $activos,
            'pasivos' => $pasivos,
            'capital' => $capital,
            'total_activos' => $totalActivos,
            'total_pasivos' => $totalPasivos,
            'total_capital' => $totalCapital,
            'utilidad_ejercicio' => $utilidadNeta,
            'total_capital_utilidad' => $totalCapitalConUtilidad,
            'ecuacion' => $totalActivos == ($totalPasivos + $totalCapitalConUtilidad),
        ]
    ]);
}
