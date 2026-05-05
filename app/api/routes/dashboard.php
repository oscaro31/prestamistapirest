<?php
function resumen() {
    $pdo = getDB();

    $totalClientes = (int)$pdo->query("SELECT COUNT(*) FROM Cliente")->fetchColumn();
    $totalPrestamos = (int)$pdo->query("SELECT COUNT(*) FROM Prestamo")->fetchColumn();
    $prestamosPendientes = (int)$pdo->query("SELECT COUNT(*) FROM Prestamo WHERE Estado = 'Pendiente'")->fetchColumn();
    $prestamosCancelados = (int)$pdo->query("SELECT COUNT(*) FROM Prestamo WHERE Estado = 'Cancelado'")->fetchColumn();
    $montoTotalPrestado = (float)$pdo->query("SELECT COALESCE(SUM(MontoPrestamo), 0) FROM Prestamo")->fetchColumn();
    $pagadoCuotas = (float)$pdo->query("SELECT COALESCE(SUM(MontoPagado), 0) FROM PrestamoDetalle WHERE Estado = 'Pagado'")->fetchColumn();

    $totalCuotasPendientes = (int)$pdo->query("SELECT COUNT(*) FROM PrestamoDetalle WHERE Estado = 'Pendiente'")->fetchColumn();
    $totalUsuarios = (int)$pdo->query("SELECT COUNT(*) FROM usuario")->fetchColumn();
    $interesTotal = (float)$pdo->query("SELECT COALESCE(SUM(ValorInteres), 0) FROM Prestamo")->fetchColumn();
    $montoPendiente = (float)$pdo->query("SELECT COALESCE(SUM(MontoCuota), 0) FROM PrestamoDetalle WHERE Estado = 'Pendiente'")->fetchColumn();

    // Ultimos pagos
    $stmtPagos = $pdo->query("SELECT pd.IdPrestamoDetalle, pd.MontoPagado, pd.FechaPago,
                                     c.Nombre as cliente_nombre, c.Apellido as cliente_apellido
                              FROM PrestamoDetalle pd
                              JOIN Prestamo p ON p.IdPrestamo = pd.IdPrestamo
                              JOIN Cliente c ON c.IdCliente = p.IdCliente
                              WHERE pd.Estado = 'Pagado' AND pd.FechaPago IS NOT NULL
                              ORDER BY pd.FechaPago DESC LIMIT 10");
    $ultimosPagos = $stmtPagos->fetchAll();

    // Usuarios activos
    $stmtU = $pdo->query("SELECT u.nombre, u.login, c.nombre as cargo_nombre, u.activo
                          FROM usuario u
                          LEFT JOIN Cargos c ON c.idcargo = u.idcargo
                          ORDER BY u.activo DESC LIMIT 10");
    $usuarios = $stmtU->fetchAll();

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
        'CuotasVencidas' => (string)($totalCuotasPendientes > 0 ? min($totalCuotasPendientes, 1) : '0'),
        'CuotasProximas' => (string)($totalCuotasPendientes > 0 ? '1' : '0'),
        'TotalUsuarios' => (string)$totalUsuarios,
        'InteresTotal' => number_format($interesTotal, 2, '.', ''),
        'MontoPendiente' => number_format($montoPendiente, 2, '.', ''),
        'MostrarGanancias' => '1',
        'CuotasVencidasDetalle' => [],
        'CuotasProximasDetalle' => [],
        'UltimosPagos' => $ultimosPagos,
        'Usuarios' => $usuarios,
        'UltimosPrestamos' => $ultimos,
    ]);
}
