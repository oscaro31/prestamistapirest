<?php
function resumen() {
    $pdo = getDB();

    $totalClientes = (int)$pdo->query("SELECT COUNT(*) FROM Cliente")->fetchColumn();
    $totalPrestamos = (int)$pdo->query("SELECT COUNT(*) FROM Prestamo")->fetchColumn();
    $prestamosPendientes = (int)$pdo->query("SELECT COUNT(*) FROM Prestamo WHERE Estado = 'Pendiente' OR Estado IS NULL")->fetchColumn();
    $prestamosCancelados = (int)$pdo->query("SELECT COUNT(*) FROM Prestamo WHERE Estado = 'Cancelado'")->fetchColumn();
    $montoTotalPrestado = (float)$pdo->query("SELECT COALESCE(SUM(MontoPrestamo), 0) FROM Prestamo")->fetchColumn();
    $pagadoCuotas = (float)$pdo->query("SELECT COALESCE(SUM(IFNULL(MontoPagado, MontoCuota)), 0) FROM PrestamoDetalle WHERE Estado = 'Pagado'")->fetchColumn();

    $totalCuotasPendientes = (int)$pdo->query("SELECT COUNT(*) FROM PrestamoDetalle WHERE Estado = 'Pendiente'")->fetchColumn();
    $totalUsuarios = (int)$pdo->query("SELECT COUNT(*) FROM usuario")->fetchColumn();
    $usuariosActivos = (int)$pdo->query("SELECT COUNT(*) FROM usuario WHERE idtipoestatususuarios = 1")->fetchColumn();
    $interesTotal = (float)$pdo->query("SELECT COALESCE(SUM(ValorInteres), 0) FROM Prestamo")->fetchColumn();
    $montoPendiente = (float)$pdo->query("SELECT COALESCE(SUM(MontoCuota), 0) FROM PrestamoDetalle WHERE Estado = 'Pendiente'")->fetchColumn();

    // Cuotas vencidas (FechaPago pasada y aún Pendiente)
    $stmtVencidas = $pdo->query("SELECT pd.IdPrestamoDetalle, pd.IdPrestamo, pd.NroCuota, pd.FechaPago, pd.MontoCuota,
                                        c.Nombre as cliente_nombre, c.Apellido as cliente_apellido,
                                        p.MontoPrestamo
                                 FROM PrestamoDetalle pd
                                 JOIN Prestamo p ON p.IdPrestamo = pd.IdPrestamo
                                 JOIN Cliente c ON c.IdCliente = p.IdCliente
                                 WHERE pd.Estado = 'Pendiente' AND pd.FechaPago < CURDATE()
                                 ORDER BY pd.FechaPago ASC");
    $cuotasVencidasDetalle = $stmtVencidas->fetchAll();
    $cuotasVencidas = count($cuotasVencidasDetalle);
    $montoVencido = 0;
    foreach ($cuotasVencidasDetalle as &$cv) {
        $montoVencido += (float)$cv['MontoCuota'];
        $cv['MontoCuota'] = number_format((float)$cv['MontoCuota'], 2, '.', '');
        $cv['MontoPrestamo'] = number_format((float)$cv['MontoPrestamo'], 2, '.', '');
    }
    unset($cv);

    // Cuotas próximas a vencer (próximos 7 días)
    $stmtProximas = $pdo->query("SELECT pd.IdPrestamoDetalle, pd.IdPrestamo, pd.NroCuota, pd.FechaPago, pd.MontoCuota,
                                        c.Nombre as cliente_nombre, c.Apellido as cliente_apellido,
                                        p.MontoPrestamo
                                 FROM PrestamoDetalle pd
                                 JOIN Prestamo p ON p.IdPrestamo = pd.IdPrestamo
                                 JOIN Cliente c ON c.IdCliente = p.IdCliente
                                 WHERE pd.Estado = 'Pendiente' AND pd.FechaPago BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                                 ORDER BY pd.FechaPago ASC");
    $cuotasProximasDetalle = $stmtProximas->fetchAll();
    $cuotasProximas = count($cuotasProximasDetalle);
    $montoProximo = 0;
    foreach ($cuotasProximasDetalle as &$cp) {
        $montoProximo += (float)$cp['MontoCuota'];
        $cp['MontoCuota'] = number_format((float)$cp['MontoCuota'], 2, '.', '');
        $cp['MontoPrestamo'] = number_format((float)$cp['MontoPrestamo'], 2, '.', '');
    }
    unset($cp);

    // Ultimos pagos
    $stmtPagos = $pdo->query("SELECT pd.IdPrestamoDetalle, pd.MontoPagado, pd.FechaPago,
                                     c.Nombre as cliente_nombre, c.Apellido as cliente_apellido
                              FROM PrestamoDetalle pd
                              JOIN Prestamo p ON p.IdPrestamo = pd.IdPrestamo
                              JOIN Cliente c ON c.IdCliente = p.IdCliente
                              WHERE pd.Estado = 'Pagado' AND pd.FechaPago IS NOT NULL AND pd.MontoPagado > 0
                              ORDER BY pd.FechaPago DESC LIMIT 10");
    $ultimosPagos = $stmtPagos->fetchAll();

    // Usuarios activos (conectados)
    $stmtU = $pdo->query("SELECT u.nombre, u.login, c.nombre as cargo_nombre,
                                  u.idtipoestatususuarios, tu.Nombre as status_nombre
                          FROM usuario u
                          LEFT JOIN Cargos c ON c.idcargo = u.idcargo
                          LEFT JOIN Tipoestatususuarios tu ON tu.idtipoestatususuarios = u.idtipoestatususuarios
                          WHERE u.idtipoestadosusuarios = 1
                          ORDER BY u.idtipoestatususuarios ASC LIMIT 10");
    $usuarios = $stmtU->fetchAll();

    // Prestamos por mes (para grafico)
    $stmtMes = $pdo->query("SELECT DATE_FORMAT(FechaCreacion, '%Y-%m') as mes, COUNT(*) as total, COALESCE(SUM(MontoPrestamo), 0) as monto
                            FROM Prestamo
                            WHERE FechaCreacion >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
                            GROUP BY DATE_FORMAT(FechaCreacion, '%Y-%m')
                            ORDER BY mes ASC LIMIT 12");
    $prestamosPorMes = $stmtMes->fetchAll();
    foreach ($prestamosPorMes as &$pm) {
        $pm['total'] = (int)$pm['total'];
        $pm['monto'] = number_format((float)$pm['monto'], 2, '.', '');
    }
    unset($pm);

    // Prestamos por quincena (para grafico - dividir mes actual en 2 quincenas)
    $stmtQuincena = $pdo->query("SELECT 
        CASE 
            WHEN DAY(FechaCreacion) <= 15 THEN CONCAT(DATE_FORMAT(FechaCreacion, '%Y-%m'), ' - 1ra')
            ELSE CONCAT(DATE_FORMAT(FechaCreacion, '%Y-%m'), ' - 2da')
        END as quincena,
        COUNT(*) as total,
        COALESCE(SUM(MontoPrestamo), 0) as monto
    FROM Prestamo
    WHERE FechaCreacion >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
    GROUP BY quincena
    ORDER BY quincena ASC LIMIT 6");
    $prestamosPorQuincena = $stmtQuincena->fetchAll();
    foreach ($prestamosPorQuincena as &$pq) {
        $pq['total'] = (int)$pq['total'];
        $pq['monto'] = number_format((float)$pq['monto'], 2, '.', '');
    }
    unset($pq);

    // Ultimos prestamos
    $stmt = $pdo->query("SELECT p.IdPrestamo, c.Nombre as cliente_nombre, c.Apellido as cliente_apellido,
                                p.MontoPrestamo, p.Estado, p.FechaCreacion
                         FROM Prestamo p
                         LEFT JOIN Cliente c ON c.IdCliente = p.IdCliente
                         ORDER BY p.FechaCreacion DESC LIMIT 5");
    $ultimos = $stmt->fetchAll();

    jsonResponse([
        'TotalClientes' => (string)$totalClientes,
        'TotalPrestamos' => (string)$totalPrestamos,
        'PrestamosPendientes' => (string)$prestamosPendientes,
        'PrestamosCancelados' => (string)$prestamosCancelados,
        'MontoTotalPrestado' => number_format($montoTotalPrestado, 2, '.', ''),
        'PagadoCuotas' => number_format($pagadoCuotas, 2, '.', ''),
        'CuotasVencidas' => (string)$cuotasVencidas,
        'MontoVencido' => number_format($montoVencido, 2, '.', ''),
        'CuotasProximas' => (string)$cuotasProximas,
        'MontoProximo' => number_format($montoProximo, 2, '.', ''),
        'TotalUsuarios' => (string)$totalUsuarios,
        'UsuariosActivos' => (string)$usuariosActivos,
        'InteresTotal' => number_format($interesTotal, 2, '.', ''),
        'MontoPendiente' => number_format($montoPendiente, 2, '.', ''),
        'MostrarGanancias' => '1',
        'CuotasVencidasDetalle' => $cuotasVencidasDetalle,
        'CuotasProximasDetalle' => $cuotasProximasDetalle,
        'PrestamosPorMes' => $prestamosPorMes,
        'PrestamosPorQuincena' => $prestamosPorQuincena,
        'UltimosPagos' => $ultimosPagos,
        'Usuarios' => $usuarios,
        'UltimosPrestamos' => $ultimos,
    ]);
}

// ============================================================
// NOTIFICACIONES AUTOMÁTICAS
// ============================================================

function generarNotificaciones() {
    global $authUser;
    if (!$authUser) return;
    $pdo = getDB();
    
    // 1. Cuotas vencidas hoy (no notificadas aún)
    $vencidas = $pdo->query("SELECT pd.IdPrestamoDetalle, pd.IdPrestamo, pd.NroCuota, pd.MontoCuota, pd.FechaPago,
                                   c.Nombre as cliente_nombre, c.Apellido as cliente_apellido
                            FROM PrestamoDetalle pd
                            JOIN Prestamo p ON p.IdPrestamo = pd.IdPrestamo
                            JOIN Cliente c ON c.IdCliente = p.IdCliente
                            WHERE pd.Estado = 'Pendiente' AND pd.FechaPago < CURDATE()
                            AND NOT EXISTS (SELECT 1 FROM notificaciones WHERE idref = pd.IdPrestamoDetalle AND tipo = 'vencida')
                            ORDER BY pd.FechaPago ASC LIMIT 5")->fetchAll();
    foreach ($vencidas as $v) {
        $dias = (int)((time() - strtotime($v['FechaPago'])) / 86400);
        $msg = $v['cliente_nombre'] . ' ' . $v['cliente_apellido'] . ' debe cuota #' . $v['NroCuota'] . ' (RD$' . number_format($v['MontoCuota'],2) . ') desde hace ' . $dias . ' días';
        $pdo->prepare("INSERT IGNORE INTO notificaciones (idusuario, tipo, mensaje, idref, fecha) VALUES (?, 'vencida', ?, ?, NOW())")
            ->execute([$authUser['idusuario'], $msg, $v['IdPrestamoDetalle']]);
    }
    
    // 2. Cuotas próximas (2 días)
    $proximas = $pdo->query("SELECT pd.IdPrestamoDetalle, pd.IdPrestamo, pd.NroCuota, pd.MontoCuota, pd.FechaPago,
                                   c.Nombre as cliente_nombre, c.Apellido as cliente_apellido
                            FROM PrestamoDetalle pd
                            JOIN Prestamo p ON p.IdPrestamo = pd.IdPrestamo
                            JOIN Cliente c ON c.IdCliente = p.IdCliente
                            WHERE pd.Estado = 'Pendiente' AND pd.FechaPago BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 2 DAY)
                            AND NOT EXISTS (SELECT 1 FROM notificaciones WHERE idref = pd.IdPrestamoDetalle AND tipo = 'proxima')
                            ORDER BY pd.FechaPago ASC LIMIT 5")->fetchAll();
    foreach ($proximas as $p) {
        $msg = 'Cuota #' . $p['NroCuota'] . ' de ' . $p['cliente_nombre'] . ' ' . $p['cliente_apellido'] . ' vence el ' . $p['FechaPago'] . ' (RD$' . number_format($p['MontoCuota'],2) . ')';
        $pdo->prepare("INSERT IGNORE INTO notificaciones (idusuario, tipo, mensaje, idref, fecha) VALUES (?, 'proxima', ?, ?, NOW())")
            ->execute([$authUser['idusuario'], $msg, $p['IdPrestamoDetalle']]);
    }
}
