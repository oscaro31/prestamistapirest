<?php
// =============================================
// PrestamistAPI - Main Router
// =============================================
$allowedOrigins = ['https://prestamist.optecnology.com', 'https://www.prestamist.optecnology.com'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://prestamist.optecnology.com');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Security headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: same-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/routes/contabilidad.php';

// Variable global con datos del usuario autenticado (seteada por validateToken)
$authUser = null;

$route = $_GET['route'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

$body = null;
if (in_array($method, ['POST', 'PUT'])) {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true) ?? [];
}

try {
    // =========================================
    // MIDDLEWARE: permisos
    // Se cargan 1 sola vez al cargar el router
    // =========================================
    require_once __DIR__ . '/routes/cargos.php';

    switch ($route) {
        // AUTH (sin token)
        case 'auth/login':
            require __DIR__ . '/routes/auth.php';
            login($body);
            break;

        // ======= RUTAS CON VALIDACIÓN DE TOKEN =======

        // AUTH validate
        case 'auth/validate':
            $authUser = validateToken();
            jsonResponse(['user' => $authUser]);
            break;
        // AUTH logout
        case 'auth/logout':
            $authUser = validateToken();
            $pdo = getDB();
            $pdo->prepare("UPDATE usuario SET idtipoestatususuarios = 2 WHERE idusuario = ?")->execute([$authUser['idusuario']]);
            $pdo->prepare("DELETE FROM tokens WHERE idusuario = ?")->execute([$authUser['idusuario']]);
            jsonResponse(['success' => true]);
            break;

        // USERS list — cualquiera autenticado
        case 'users/list':
            $authUser = validateToken();
            require __DIR__ . '/routes/users.php';
            listUsers();
            break;
        // USERS create — solo admin (cargo 1)
        case 'users/create':
            $authUser = validateToken();
            requirePermission('usuarios');
            require __DIR__ . '/routes/users.php';
            $login = $body['login'] ?? '?';
            registrarActividad(getDB(), $authUser['idusuario'], 'crear_usuario', 'Creó usuario: ' . $login);
            createUser($body);
            break;
        // USERS update — admin (cargo 1) O el propio usuario
        case 'users/update':
            $authUser = validateToken();
            $targetId = (int)($body['idusuario'] ?? 0);
            // Permitir si es admin o si es el mismo usuario
            if ((int)$authUser['idcargo'] !== 1 && (int)$authUser['idusuario'] !== $targetId) {
                jsonError('No tienes permiso para modificar este usuario', 403);
            }
            require __DIR__ . '/routes/users.php';
            updateUser($body);
            break;
        // USERS toggle (desactivar) — solo admin
        case 'users/toggle':
            $authUser = validateToken();
            requirePermission('usuarios');
            require __DIR__ . '/routes/users.php';
            $uid = (int)($body['idusuario'] ?? 0);
            registrarActividad(getDB(), $authUser['idusuario'], 'toggle_usuario', 'Cambió estado del usuario ID: ' . $uid);
            toggleUser($body);
            break;
        // USERS password — admin O el propio usuario
        case 'users/password':
            $authUser = validateToken();
            $targetId = (int)($body['idusuario'] ?? 0);
            if ((int)$authUser['idcargo'] !== 1 && (int)$authUser['idusuario'] !== $targetId) {
                jsonError('No tienes permiso para cambiar esta clave', 403);
            }
            require __DIR__ . '/routes/users.php';
            changePassword($body);
            break;

        // CLIENTES
        case 'clientes/list':
            $authUser = validateToken();
            require __DIR__ . '/routes/clientes.php';
            listClientes();
            break;
        case 'clientes/get':
            $authUser = validateToken();
            require __DIR__ . '/routes/clientes.php';
            getCliente($_GET['NroDocumento'] ?? '');
            break;
        case 'clientes/create':
            $authUser = validateToken();
            requirePermission('clientes');
            require __DIR__ . '/routes/clientes.php';
            createCliente($body);
            break;
        case 'clientes/update':
            $authUser = validateToken();
            requirePermission('clientes');
            require __DIR__ . '/routes/clientes.php';
            updateCliente($body);
            break;
        case 'clientes/delete':
            $authUser = validateToken();
            requirePermission('clientes');
            require __DIR__ . '/routes/clientes.php';
            deleteCliente($body);
            break;
        case 'clientes/list-vendedor':
            $authUser = validateToken();
            requirePermission('config');
            require __DIR__ . '/routes/clientes.php';
            $idv = (int)($_GET['idvendedor'] ?? 0);
            if (!$idv) jsonError('idvendedor requerido');
            listClientesVendedor($idv);
            break;
        case 'clientes/asignar':
            $authUser = validateToken();
            requirePermission('config');
            require __DIR__ . '/routes/clientes.php';
            asignarClientes($body);
            break;

        // MONEDAS
        case 'monedas/list':
            $authUser = validateToken();
            require __DIR__ . '/routes/monedas.php';
            listMonedas();
            break;
        case 'monedas/create':
            $authUser = validateToken();
            requirePermission('monedas');
            require __DIR__ . '/routes/monedas.php';
            registrarActividad(getDB(), $authUser['idusuario'], 'crear_moneda', 'Creó moneda: ' . ($body['Nombre'] ?? '?'));
            createMoneda($body);
            break;
        case 'monedas/update':
            $authUser = validateToken();
            requirePermission('monedas');
            require __DIR__ . '/routes/monedas.php';
            updateMoneda($body);
            break;
        case 'monedas/delete':
            $authUser = validateToken();
            requirePermission('monedas');
            require __DIR__ . '/routes/monedas.php';
            deleteMoneda($body);
            break;

        // PRESTAMOS
        case 'prestamos/list':
            $authUser = validateToken();
            require __DIR__ . '/routes/prestamos.php';
            listPrestamos($_GET);
            break;
        case 'prestamos/create':
            $authUser = validateToken();
            requirePermission('prestamos');
            require __DIR__ . '/routes/prestamos.php';
            $body['_userId'] = (int)$authUser['idusuario'];
            createPrestamo($body);
            break;
        case 'prestamos/pagar':
            $authUser = validateToken();
            requirePermission('prestamos');
            require __DIR__ . '/routes/prestamos.php';
            $body['_userId'] = (int)$authUser['idusuario'];
            pagarCuotas($body);
            break;

        // DASHBOARD
        case 'dashboard/resumen':
            $authUser = validateToken();
            require __DIR__ . '/routes/dashboard.php';
            generarNotificaciones();
            resumen();
            break;
        case 'notificaciones/list':
            $authUser = validateToken();
            $pdo = getDB();
            $stmt = $pdo->prepare("SELECT n.* FROM notificaciones n WHERE n.idusuario = ? AND n.leida = 0 ORDER BY n.fecha DESC LIMIT 20");
            $stmt->execute([$authUser['idusuario']]);
            $notis = $stmt->fetchAll();
            jsonResponse($notis);
            break;
        case 'notificaciones/marcar-leida':
            $authUser = validateToken();
            $id = (int)($body['idnotificacion'] ?? 0);
            if (!$id) jsonError('idnotificacion requerido');
            $pdo = getDB();
            $pdo->prepare("UPDATE notificaciones SET leida = 1 WHERE idnotificacion = ? AND idusuario = ?")->execute([$id, $authUser['idusuario']]);
            jsonResponse(['success' => true]);
            break;
        case 'notificaciones/marcar-todas':
            $authUser = validateToken();
            $pdo = getDB();
            $pdo->prepare("UPDATE notificaciones SET leida = 1 WHERE idusuario = ?")->execute([$authUser['idusuario']]);
            jsonResponse(['success' => true]);
            break;

        // CONFIG
        case 'config/list':
            $authUser = validateToken();
            require __DIR__ . '/routes/config.php';
            listConfig();
            break;
        case 'config/update':
            $authUser = validateToken();
            requirePermission('config');
            require __DIR__ . '/routes/config.php';
            updateConfig($body);
            break;

        // CARGOS / TIPOS
        case 'cargos/list':
            $authUser = validateToken();
            listCargos();
            break;
        case 'cargo/permissions':
            $authUser = validateToken();
            getCargoPermissions();
            break;
        case 'cargos/permisos':
            $authUser = validateToken();
            requirePermission('config');
            require __DIR__ . '/routes/setup.php';
            listPermisos();
            break;
        case 'cargos/permisos/save':
            $authUser = validateToken();
            requirePermission('config');
            require __DIR__ . '/routes/setup.php';
            savePermisos($body);
            break;
        case 'tipos/documento':
            $authUser = validateToken();
            $pdo = getDB();
            jsonResponse($pdo->query("SELECT * FROM TipoDocumento WHERE estado = 1")->fetchAll());
            break;
        case 'tipos/estados':
            $authUser = validateToken();
            $pdo = getDB();
            jsonResponse($pdo->query("SELECT * FROM Tipoestados WHERE estado = 1")->fetchAll());
            break;

        // SP lista
        case 'sp_listaUsuario':
            $authUser = validateToken();
            $pdo = getDB();
            jsonResponse($pdo->query("SELECT * FROM usuario WHERE activo = 1 ORDER BY nombre")->fetchAll());
            break;
        case 'sp_listaTipoDocumento':
            $authUser = validateToken();
            $pdo = getDB();
            jsonResponse($pdo->query("SELECT * FROM TipoDocumento WHERE estado = 1")->fetchAll());
            break;

        // AVATAR UPLOAD — solo el propio usuario
        case 'upload/avatar':
            $authUser = validateToken();
            $id = (int)($authUser['idusuario'] ?? 0);
            if (!$id) jsonError('Usuario invalido', 400);
            if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
                jsonError('Error al subir archivo', 400);
            }
            $ext = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (!in_array($ext, $allowed)) jsonError('Formato no permitido (jpg, png, gif, webp)', 400);
            $filename = 'avatar_' . $id . '_' . time() . '.' . $ext;
            $dest = __DIR__ . '/../uploads/avatars/' . $filename;
            if (!move_uploaded_file($_FILES['avatar']['tmp_name'], $dest)) {
                jsonError('Error al guardar archivo', 500);
            }
            $pdo = getDB();
            $pdo->prepare("UPDATE usuario SET avatar = ? WHERE idusuario = ?")->execute([$filename, $id]);
            jsonResponse(['avatar' => $filename, 'success' => true]);
            break;

        // DB / SETUP — solo admin
        case 'db/tokens_describe':
        case 'db/create_triggers':
        case 'db/describe_all':
        case 'db/describe':
        case 'db/tables':
            $authUser = validateToken();
            requirePermission('config');
            require __DIR__ . '/routes/setup.php';
            if ($route === 'db/tokens_describe') describeTokens();
            elseif ($route === 'db/create_triggers') createTriggers();
            elseif ($route === 'db/describe_all') describeAll();
            elseif ($route === 'db/describe') showTableInfo();
            elseif ($route === 'db/tables') listTables();
            break;
        case 'setup/permissions':
            // Sin token — ruta de bootstrap interno
            require __DIR__ . '/routes/setup.php';
            createPermissionsTable();
            break;
        
        // CONTABILIDAD
        case 'plan-cuenta/list':
            $authUser = validateToken();
            requirePermission('plan-cuentas');
            $body['_userId'] = (int)$authUser['idusuario'];
            listPlanCuentas($body);
            break;
        case 'plan-cuenta/create':
            $authUser = validateToken();
            requirePermission('plan-cuentas');
            $body['_userId'] = (int)$authUser['idusuario'];
            createPlanCuenta($body);
            break;
        case 'plan-cuenta/update':
            $authUser = validateToken();
            requirePermission('plan-cuentas');
            $body['_userId'] = (int)$authUser['idusuario'];
            updatePlanCuenta($body);
            break;
        case 'plan-cuenta/delete':
            $authUser = validateToken();
            requirePermission('plan-cuentas');
            $body['_userId'] = (int)$authUser['idusuario'];
            deletePlanCuenta($body);
            break;
        case 'asientos/list':
            $authUser = validateToken();
            requirePermission('asientos');
            listAsientos($body);
            break;
        case 'asientos/create':
            $authUser = validateToken();
            requirePermission('asientos');
            $body['_userId'] = (int)$authUser['idusuario'];
            createAsiento($body);
            break;
        case 'asientos/get':
            $authUser = validateToken();
            requirePermission('asientos');
            getAsiento($body);
            break;
        case 'asientos/anular':
            $authUser = validateToken();
            requirePermission('asientos');
            $body['_userId'] = (int)$authUser['idusuario'];
            anularAsiento($body);
            break;
        case 'asientos/generar':
            $authUser = validateToken();
            requirePermission('prestamos');
            $body['_userId'] = (int)$authUser['idusuario'];
            generarAsientosPrestamo($body);
            break;
        case 'config-contable/list':
            $authUser = validateToken();
            requirePermission('config-contable');
            listConfigContable();
            break;
        case 'config-contable/update':
            $authUser = validateToken();
            requirePermission('config-contable');
            updateConfigContable($body);
            break;
        case 'reportes/balance-comprobacion':
            $authUser = validateToken();
            requirePermission('reportes-contables');
            balanceComprobacion($body);
            break;
        case 'reportes/libro-diario':
            $authUser = validateToken();
            requirePermission('reportes-contables');
            libroDiario($body);
            break;
        case 'reportes/libro-mayor':
            $authUser = validateToken();
            requirePermission('reportes-contables');
            libroMayor($body);
            break;
        case 'reportes/estado-resultados':
            $authUser = validateToken();
            requirePermission('reportes-contables');
            estadoResultados($body);
            break;
        case 'reportes/balance-general':
            $authUser = validateToken();
            requirePermission('reportes-contables');
            balanceGeneral();
            break;
        default:
            jsonError('Ruta no encontrada: ' . $route, 404);
    }
} catch (PDOException $e) {
    jsonError('Error de base de datos: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    jsonError('Error: ' . $e->getMessage(), 500);
}
