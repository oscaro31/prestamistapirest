<?php
/**
 * Setup - Creación de tabla de permisos y datos iniciales
 */

function createPermissionsTable() {
    $pdo = getDB();
    
    // Crear tabla usuario_cargo si no existe
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS usuario_cargo (
            idusuario_cargo INT AUTO_INCREMENT PRIMARY KEY,
            idcargo INT NOT NULL,
            permiso VARCHAR(50) NOT NULL,
            valor TINYINT(1) DEFAULT 0,
            UNIQUE KEY uc_permiso (idcargo, permiso),
            FOREIGN KEY (idcargo) REFERENCES Cargos(idcargo) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");
    
    // Definir permisos disponibles (uno por cada módulo del menú)
    $permisos = [
        'dashboard', 'clientes', 'prestamos', 'reimprimir',
        'monedas', 'usuarios', 'config',
        'plan-cuentas', 'asientos', 'config-contable', 'reportes-contables'
    ];
    
    // Obtener todos los cargos
    $cargos = $pdo->query("SELECT idcargo FROM Cargos")->fetchAll();
    
    foreach ($cargos as $cargo) {
        $idcargo = (int)$cargo['idcargo'];
        foreach ($permisos as $permiso) {
            // Si es admin (idcargo=1), todos los permisos en 1
            $valor = ($idcargo === 1) ? 1 : 0;
            $stmt = $pdo->prepare("INSERT IGNORE INTO usuario_cargo (idcargo, permiso, valor) VALUES (?, ?, ?)");
            $stmt->execute([$idcargo, $permiso, $valor]);
        }
    }
    
    jsonResponse(['success' => true, 'message' => 'Tabla de permisos creada']);
}

/**
 * GET /cargos/permisos - Obtiene lista de permisos y estado actual por cargo
 */
function listPermisos() {
    $pdo = getDB();
    $idcargo = (int)($_GET['idcargo'] ?? 0);
    
    if (!$idcargo) {
        jsonError('idcargo requerido', 400);
    }
    
    $stmt = $pdo->prepare("SELECT permiso, valor FROM usuario_cargo WHERE idcargo = ?");
    $stmt->execute([$idcargo]);
    $permisos = [];
    while ($r = $stmt->fetch()) {
        $permisos[$r['permiso']] = (bool)$r['valor'];
    }
    
    jsonResponse(['permisos' => $permisos]);
}

/**
 * POST /cargos/permisos/save - Guarda permisos para un cargo
 */
function savePermisos($body) {
    $pdo = getDB();
    $idcargo = (int)($body['idcargo'] ?? 0);
    $permisos = $body['permisos'] ?? [];
    
    if (!$idcargo) {
        jsonError('idcargo requerido', 400);
    }
    
    $pdo->beginTransaction();
    try {
        // Resetear todos los permisos del cargo a 0
        $pdo->prepare("UPDATE usuario_cargo SET valor = 0 WHERE idcargo = ?")->execute([$idcargo]);
        
        // Activar los permisos enviados
        foreach ($permisos as $permiso => $valor) {
            if ($valor) {
                $stmt = $pdo->prepare("INSERT INTO usuario_cargo (idcargo, permiso, valor) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE valor = 1");
                $stmt->execute([$idcargo, $permiso]);
            }
        }
        
        $pdo->commit();
        jsonResponse(['success' => true]);
    } catch (Exception $e) {
        $pdo->rollBack();
        jsonError('Error al guardar permisos: ' . $e->getMessage(), 500);
    }
}
