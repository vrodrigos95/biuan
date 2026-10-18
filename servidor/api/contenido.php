<?php
// GET ?f=lecciones/L05.json con las cabeceras X-Permiso y X-Dispositivo → el archivo de pago.
declare(strict_types=1);
define('BIUAN_API', true);
require __DIR__ . '/_comun.php';

cors(['GET']);

$permiso = leerPermiso();
if ($permiso === null) {
    responder(401, ['error' => 'sin_permiso', 'mensaje' => 'Activa tu clave para ver este contenido.']);
}
$dispositivo = (string)($_SERVER['HTTP_X_DISPOSITIVO'] ?? '');
if (!hash_equals((string)$permiso['d'], $dispositivo)) {
    responder(401, ['error' => 'sin_permiso', 'mensaje' => 'Activa tu clave en este dispositivo.']);
}

// Si el dispositivo se liberó, su permiso deja de servir aunque no haya vencido.
try {
    $sigueRegistrado = dispositivoRegistrado((string)$permiso['l'], $dispositivo);
} catch (PDOException $e) {
    error_log('contenido.php: ' . $e->getMessage());
    responder(503, ['error' => 'servidor', 'mensaje' => 'No pudimos cargar el contenido. Inténtalo en unos minutos.']);
}
if (!$sigueRegistrado) {
    responder(401, ['error' => 'sin_permiso', 'mensaje' => 'Activa tu clave en este dispositivo.']);
}

limitar('contenido', $permiso['l'], (int)$CONFIG['limite_contenido_hora'], 3600);

// Solo archivos de contenido con nombres conocidos: nada de rutas arbitrarias.
$f = (string)($_GET['f'] ?? '');
if (!preg_match('#^(lecciones/L\d{2}|controles/(A1|A2|B1)|simulacro)\.json$#', $f)) {
    responder(404, ['error' => 'no_existe', 'mensaje' => 'Ese contenido no existe.']);
}
$ruta = $CONFIG['contenido_dir'] . '/' . $f;
if (!is_file($ruta)) {
    responder(404, ['error' => 'no_existe', 'mensaje' => 'Ese contenido no existe.']);
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-cache');
header('X-Content-Type-Options: nosniff');
readfile($ruta);
