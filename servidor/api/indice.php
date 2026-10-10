<?php
// GET → { lecciones, controles, simulacro }: el contenido disponible (gratis y de pago).
// Se arma leyendo las carpetas, así que agregar una lección es solo subir su archivo.
declare(strict_types=1);
define('BIUAN_API', true);
require __DIR__ . '/_comun.php';

cors(['GET']);

function nombres(string $dir, string $patron): array
{
    if (!is_dir($dir)) {
        return [];
    }
    $res = [];
    foreach (scandir($dir) as $f) {
        if (preg_match($patron, $f, $m)) {
            $res[] = $m[1];
        }
    }
    return $res;
}

$publico = dirname(__DIR__) . '/contenido';
$privado = $CONFIG['contenido_dir'];
$lecciones = array_values(array_unique(array_merge(
    nombres($publico . '/lecciones', '/^(L\d{2})\.json$/'),
    nombres($privado . '/lecciones', '/^(L\d{2})\.json$/')
)));
sort($lecciones);
$controles = nombres($privado . '/controles', '/^(A1|A2|B1)\.json$/');
sort($controles);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');
echo json_encode([
    'lecciones' => $lecciones,
    'controles' => $controles,
    'simulacro' => is_file($privado . '/simulacro.json'),
]);
