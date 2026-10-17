<?php
// Funciones compartidas de la API de Biuan. No se llama directamente.
declare(strict_types=1);

if (!defined('BIUAN_API')) {
    http_response_code(404);
    exit;
}

// Carpeta privada, fuera de public_html. Ajusta la ruta si la app vive en una subcarpeta.
$rutaPrivada = getenv('BIUAN_PRIVADO') ?: dirname(__DIR__, 2) . '/biuan-privado';
$archivoConfig = $rutaPrivada . '/config.php';
if (!is_file($archivoConfig)) {
    responder(500, ['error' => 'sin_config', 'mensaje' => 'El servidor no está configurado.']);
}
$CONFIG = require $archivoConfig;
if (strlen((string)($CONFIG['secreto'] ?? '')) < 32 || ($CONFIG['gumroad_product_id'] ?? '') === '') {
    responder(500, ['error' => 'sin_config', 'mensaje' => 'El servidor no está configurado.']);
}

function responder(int $codigo, array $datos): void
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

// CORS: solo los orígenes de la configuración. Sin orígenes, solo el mismo dominio.
function cors(array $metodos): void
{
    global $CONFIG;
    $origen = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origen !== '' && in_array($origen, $CONFIG['origenes'] ?? [], true)) {
        header('Access-Control-Allow-Origin: ' . $origen);
        header('Vary: Origin');
        header('Access-Control-Allow-Methods: ' . implode(', ', $metodos) . ', OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Permiso, X-Dispositivo');
        header('Access-Control-Max-Age: 86400');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', $metodos, true)) {
        responder(405, ['error' => 'metodo', 'mensaje' => 'Método no permitido.']);
    }
}

function ipCliente(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'desconocida';
}

// Límite de peticiones con archivos (sin base de datos). Devuelve 429 si se excede.
function limitar(string $grupo, string $quien, int $maximo, int $segundos): void
{
    global $CONFIG;
    $dir = $CONFIG['datos_dir'] . '/limites';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $archivo = $dir . '/' . $grupo . '-' . hash('sha256', $quien) . '.json';
    $f = fopen($archivo, 'c+');
    if ($f === false) {
        return;
    }
    flock($f, LOCK_EX);
    $ahora = time();
    $marcas = json_decode((string)stream_get_contents($f), true) ?: [];
    $marcas = array_values(array_filter($marcas, fn($t) => is_int($t) && $t > $ahora - $segundos));
    $excedido = count($marcas) >= $maximo;
    if (!$excedido) {
        $marcas[] = $ahora;
    }
    ftruncate($f, 0);
    rewind($f);
    fwrite($f, json_encode($marcas));
    flock($f, LOCK_UN);
    fclose($f);
    if ($excedido) {
        header('Retry-After: ' . $segundos);
        responder(429, ['error' => 'demasiados_intentos', 'mensaje' => 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.']);
    }
}

function b64url(string $s): string
{
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

function b64urlDecode(string $s): string
{
    return (string)base64_decode(strtr($s, '-_', '+/'), true);
}

// Permiso firmado: { l: hash de la clave, d: dispositivo, exp: vencimiento }.
function crearPermiso(string $hashClave, string $dispositivo): array
{
    global $CONFIG;
    $exp = time() + 86400 * (int)$CONFIG['dias_permiso'];
    $datos = b64url(json_encode(['l' => $hashClave, 'd' => $dispositivo, 'exp' => $exp]));
    $firma = b64url(hash_hmac('sha256', $datos, $CONFIG['secreto'], true));
    return ['permiso' => $datos . '.' . $firma, 'vence' => $exp];
}

function leerPermiso(): ?array
{
    global $CONFIG;
    // Cabecera propia: algunos hostings compartidos eliminan "Authorization".
    $cabecera = $_SERVER['HTTP_X_PERMISO'] ?? '';
    if (!preg_match('/^([A-Za-z0-9_-]{10,400})\.([A-Za-z0-9_-]{43})$/', $cabecera, $m)) {
        return null;
    }
    $esperada = b64url(hash_hmac('sha256', $m[1], $CONFIG['secreto'], true));
    if (!hash_equals($esperada, $m[2])) {
        return null;
    }
    $datos = json_decode(b64urlDecode($m[1]), true);
    if (!is_array($datos) || !isset($datos['l'], $datos['d'], $datos['exp']) || $datos['exp'] < time()) {
        return null;
    }
    return $datos;
}

function claveValida(string $clave): bool
{
    return (bool)preg_match('/^[A-Za-z0-9-]{8,64}$/', $clave);
}

function dispositivoValido(string $d): bool
{
    return (bool)preg_match('/^[A-Za-z0-9-]{8,64}$/', $d);
}

// Consulta la clave en Gumroad. Devuelve la respuesta decodificada o null si no hubo conexión.
function consultarGumroad(string $clave, bool $incrementar): ?array
{
    global $CONFIG;
    $ch = curl_init($CONFIG['gumroad_url']);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'product_id' => $CONFIG['gumroad_product_id'],
            'license_key' => $clave,
            'increment_uses_count' => $incrementar ? 'true' : 'false',
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_CONNECTTIMEOUT => 8,
    ]);
    $cuerpo = curl_exec($ch);
    $codigo = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($cuerpo === false || $codigo === 0 || $codigo >= 500) {
        return null;
    }
    $json = json_decode((string)$cuerpo, true);
    return is_array($json) ? $json : ['success' => false];
}

// Registro de dispositivos por clave (guardado con el hash de la clave).
// Con 'db' en la configuración se usa la tabla central licencia_dispositivos de trucosdeaula.com
// (app = 'biuan'), la misma que usa /api/licencia.php. Sin 'db', un archivo JSON por clave.
const APP_DISPOSITIVOS = 'biuan';

function db(): PDO
{
    global $CONFIG;
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO($CONFIG['db']['dsn'], $CONFIG['db']['usuario'], $CONFIG['db']['clave'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $pdo;
}

function usaBaseDeDatos(): bool
{
    global $CONFIG;
    return !empty($CONFIG['db']['dsn']);
}

function leerDispositivos(string $hashClave): array
{
    global $CONFIG;
    $archivo = $CONFIG['datos_dir'] . '/licencias/' . $hashClave . '.json';
    $datos = is_file($archivo) ? json_decode((string)file_get_contents($archivo), true) : null;
    return is_array($datos) ? $datos : ['dispositivos' => []];
}

function guardarDispositivos(string $hashClave, array $datos): void
{
    global $CONFIG;
    $dir = $CONFIG['datos_dir'] . '/licencias';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    file_put_contents($dir . '/' . $hashClave . '.json', json_encode($datos), LOCK_EX);
}

// Pasa a MySQL los dispositivos que esta clave tenía en archivos (de antes de usar la base de datos).
function importarDispositivosDeArchivo(string $hashClave): void
{
    global $CONFIG;
    $archivo = $CONFIG['datos_dir'] . '/licencias/' . $hashClave . '.json';
    if (!is_file($archivo)) {
        return;
    }
    $st = db()->prepare('INSERT IGNORE INTO licencia_dispositivos (clave_hash, app, dispositivo, alta, ultimo_uso) VALUES (?, ?, ?, ?, ?)');
    foreach (leerDispositivos($hashClave)['dispositivos'] as $d) {
        $alta = date('Y-m-d H:i:s', strtotime((string)($d['desde'] ?? 'now')) ?: time());
        $st->execute([$hashClave, APP_DISPOSITIVOS, (string)$d['id'], $alta, $alta]);
    }
    rename($archivo, $archivo . '.migrado');
}

function dispositivoRegistrado(string $hashClave, string $dispositivo): bool
{
    if (!usaBaseDeDatos()) {
        return in_array($dispositivo, array_column(leerDispositivos($hashClave)['dispositivos'], 'id'), true);
    }
    importarDispositivosDeArchivo($hashClave);
    $st = db()->prepare('SELECT 1 FROM licencia_dispositivos WHERE clave_hash = ? AND app = ? AND dispositivo = ?');
    $st->execute([$hashClave, APP_DISPOSITIVOS, $dispositivo]);
    return $st->fetchColumn() !== false;
}

// Registra el dispositivo (o actualiza su último uso). Devuelve false si la clave ya llegó al límite.
function registrarDispositivo(string $hashClave, string $dispositivo): bool
{
    global $CONFIG;
    $maximo = (int)$CONFIG['max_dispositivos'];
    if (!usaBaseDeDatos()) {
        $registro = leerDispositivos($hashClave);
        if (in_array($dispositivo, array_column($registro['dispositivos'], 'id'), true)) {
            return true;
        }
        if (count($registro['dispositivos']) >= $maximo) {
            return false;
        }
        $registro['dispositivos'][] = ['id' => $dispositivo, 'desde' => date('c')];
        guardarDispositivos($hashClave, $registro);
        return true;
    }
    $pdo = db();
    $ahora = date('Y-m-d H:i:s');
    $pdo->beginTransaction();
    try {
        // FOR UPDATE: dos activaciones a la vez no rebasan el límite.
        $st = $pdo->prepare('SELECT dispositivo FROM licencia_dispositivos WHERE clave_hash = ? AND app = ? FOR UPDATE');
        $st->execute([$hashClave, APP_DISPOSITIVOS]);
        $registrados = $st->fetchAll(PDO::FETCH_COLUMN);
        if (in_array($dispositivo, $registrados, true)) {
            $pdo->prepare('UPDATE licencia_dispositivos SET ultimo_uso = ? WHERE clave_hash = ? AND app = ? AND dispositivo = ?')
                ->execute([$ahora, $hashClave, APP_DISPOSITIVOS, $dispositivo]);
        } elseif (count($registrados) >= $maximo) {
            $pdo->commit();
            return false;
        } else {
            $pdo->prepare('INSERT INTO licencia_dispositivos (clave_hash, app, dispositivo, alta, ultimo_uso) VALUES (?, ?, ?, ?, ?)')
                ->execute([$hashClave, APP_DISPOSITIVOS, $dispositivo, $ahora, $ahora]);
        }
        $pdo->commit();
        return true;
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

function leerJsonEntrada(): array
{
    $crudo = file_get_contents('php://input', false, null, 0, 4096);
    $datos = json_decode((string)$crudo, true);
    return is_array($datos) ? $datos : [];
}
