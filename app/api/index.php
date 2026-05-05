<?php
// =============================================
// PrestamistAPI - Main Router
// =============================================
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/routes/contabilidad.php';

$route = $_GET['route'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

$body = null;
if (in_array($method, ['POST', 'PUT'])) {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true) ?? [];
}

try {
    switch ($route) {
        // AUTH
        case 'auth/login':
            require __DIR__ . '/routes/auth.php';
            login($body);
            break;
        case 'auth/validate':
            $user = validateToken();
            jsonResponse(['user' => $user]);
            break;

        // USERS
        case 'users/list':
            $user = validateToken();
            require __DIR__ . '/routes/users.php';
            listUsers();
            break;
        case 'users/create':
            $user = validateToken();
            require __DIR__ . '/routes/users.php';
            createUser($body);
            break;
        case 'users/update':
            $user = validateToken();
            require __DIR__ . '/routes/users.php';
            updateUser($body);
            break;
        case 'users/toggle':
            $user = validateToken();
            require __DIR__ . '/routes/users.php';
            toggleUser($body);
            break;
        case 'users/password':
            $user = validateToken();
            require __DIR__ . '/routes/users.php';
            changePassword($body);
            break;

        // CLIENTES
        case 'clientes/list':
            $user = validateToken();
            require __DIR__ . '/routes/clientes.php';
            listClientes();
            break;
        case 'clientes/get':
            $user = validateToken();
            require __DIR__ . '/routes/clientes.php';
            getCliente($_GET['NroDocumento'] ?? '');
            break;
        case 'clientes/create':
            $user = validateToken();
            require __DIR__ . '/routes/clientes.php';
            createCliente($body);
            break;
        case 'clientes/update':
            $user = validateToken();
            require __DIR__ . '/routes/clientes.php';
            updateCliente($body);
            break;
        case 'clientes/delete':
            $user = validateToken();
            require __DIR__ . '/routes/clientes.php';
            deleteCliente($body);
            break;

        // MONEDAS
        case 'monedas/list':
            $user = validateToken();
            require __DIR__ . '/routes/monedas.php';
            listMonedas();
            break;
        case 'monedas/create':
            $user = validateToken();
            require __DIR__ . '/routes/monedas.php';
            createMoneda($body);
            break;
        case 'monedas/update':
            $user = validateToken();
            require __DIR__ . '/routes/monedas.php';
            updateMoneda($body);
            break;
        case 'monedas/delete':
            $user = validateToken();
            require __DIR__ . '/routes/monedas.php';
            deleteMoneda($body);
            break;

        // PRESTAMOS
        case 'prestamos/list':
            $user = validateToken();
            require __DIR__ . '/routes/prestamos.php';
            listPrestamos($_GET);
            break;
        case 'prestamos/create':
            $user = validateToken();
            require __DIR__ . '/routes/prestamos.php';
            createPrestamo($body);
            break;
        case 'prestamos/pagar':
            $user = validateToken();
            require __DIR__ . '/routes/prestamos.php';
            pagarCuotas($body);
            break;

        // DASHBOARD
        case 'dashboard/resumen':
            $user = validateToken();
            require __DIR__ . '/routes/dashboard.php';
            resumen();
            break;

        // CONFIG
        case 'config/list':
            $user = validateToken();
            require __DIR__ . '/routes/config.php';
            listConfig();
            break;
        case 'config/update':
            $user = validateToken();
            require __DIR__ . '/routes/config.php';
            updateConfig($body);
            break;

        // CARGOS / TIPOS
        case 'cargos/list':
            $user = validateToken();
            require __DIR__ . '/routes/cargos.php';
            listCargos();
            break;
        case 'tipos/documento':
            $user = validateToken();
            $pdo = getDB();
            jsonResponse($pdo->query("SELECT * FROM TipoDocumento WHERE estado = 1")->fetchAll());
            break;
        case 'tipos/estados':
            $user = validateToken();
            $pdo = getDB();
            jsonResponse($pdo->query("SELECT * FROM Tipoestados WHERE estado = 1")->fetchAll());
            break;

        // SP lista
        case 'sp_listaUsuario':
            $user = validateToken();
            $pdo = getDB();
            jsonResponse($pdo->query("SELECT * FROM usuario WHERE activo = 1 ORDER BY nombre")->fetchAll());
            break;
        case 'sp_listaTipoDocumento':
            $user = validateToken();
            $pdo = getDB();
            jsonResponse($pdo->query("SELECT * FROM TipoDocumento WHERE estado = 1")->fetchAll());
            break;

        // AVATAR UPLOAD
        case 'upload/avatar':
            $user = validateToken();
            $id = (int)($user['idusuario'] ?? 0);
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
            $url = 'https://prestamist.optecnology.com/uploads/avatars/' . $filename;
            $pdo = getDB();
            $pdo->prepare("UPDATE usuario SET avatar = ? WHERE idusuario = ?")->execute([$url, $id]);
            jsonResponse(['avatar' => $url, 'success' => true]);
            break;

        case 'cargo/permissions':
            $user = validateToken();
            require __DIR__ . '/routes/cargos.php';
            getCargoPermissions();
            break;
        case 'db/tokens_describe':
            $user = validateToken();
            require __DIR__ . '/routes/setup.php';
            describeTokens();
            break;
        case 'db/create_triggers':
            $user = validateToken();
            require __DIR__ . '/routes/setup.php';
            createTriggers();
            break;
        case 'db/describe_all':
            $user = validateToken();
            require __DIR__ . '/routes/setup.php';
            describeAll();
            break;
        case 'db/describe':
            $user = validateToken();
            require __DIR__ . '/routes/setup.php';
            showTableInfo();
            break;
        case 'db/tables':
            $user = validateToken();
            require __DIR__ . '/routes/setup.php';
            listTables();
            break;
        case 'setup/permissions':
            require __DIR__ . '/routes/setup.php';
            createPermissionsTable();
            break;
        
        // CONTABILIDAD
        case 'plan-cuenta/list':
            $user = validateToken();
            listPlanCuentas();
            break;
        case 'plan-cuenta/create':
            $user = validateToken();
            createPlanCuenta($body);
            break;
        case 'plan-cuenta/update':
            $user = validateToken();
            updatePlanCuenta($body);
            break;
        case 'plan-cuenta/delete':
            $user = validateToken();
            deletePlanCuenta($body);
            break;
        case 'asientos/list':
            $user = validateToken();
            listAsientos($body);
            break;
        case 'asientos/create':
            $user = validateToken();
            createAsiento($body);
            break;
        case 'asientos/get':
            $user = validateToken();
            getAsiento($body);
            break;
        case 'asientos/generar':
            $user = validateToken();
            generarAsientosPrestamo($body);
            break;
        case 'config-contable/list':
            $user = validateToken();
            listConfigContable();
            break;
        case 'config-contable/update':
            $user = validateToken();
            updateConfigContable($body);
            break;
        case 'reportes/balance-comprobacion':
            $user = validateToken();
            balanceComprobacion($body);
            break;
        case 'reportes/libro-diario':
            $user = validateToken();
            libroDiario($body);
            break;
        case 'reportes/libro-mayor':
            $user = validateToken();
            libroMayor($body);
            break;
        case 'reportes/estado-resultados':
            $user = validateToken();
            estadoResultados($body);
            break;
        case 'reportes/balance-general':
            $user = validateToken();
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
