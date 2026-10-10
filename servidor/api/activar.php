<?php
// POST { clave, dispositivo } → { permiso, vence }
// Activa la clave de Gumroad en un dispositivo o renueva su permiso.
declare(strict_types=1);
define('BIUAN_API', true);
require __DIR__ . '/_comun.php';

cors(['POST']);

$entrada = leerJsonEntrada();
$clave = strtoupper(trim((string)($entrada['clave'] ?? '')));
$dispositivo = trim((string)($entrada['dispositivo'] ?? ''));

if (!claveValida($clave) || !dispositivoValido($dispositivo)) {
    responder(400, ['error' => 'datos', 'mensaje' => 'Revisa que la clave esté completa.']);
}

$ip = ipCliente();
limitar('activar15', $ip, (int)$CONFIG['limite_activar_15min'], 900);
limitar('activardia', $ip, (int)$CONFIG['limite_activar_dia'], 86400);

$hashClave = hash('sha256', $clave);
$registro = leerDispositivos($hashClave);
$conocido = in_array($dispositivo, array_column($registro['dispositivos'], 'id'), true);

// Solo un dispositivo nuevo suma un uso en Gumroad; las renovaciones no.
$g = consultarGumroad($clave, !$conocido);
if ($g === null) {
    responder(503, ['error' => 'sin_gumroad', 'mensaje' => 'No pudimos comprobar tu clave en este momento. Inténtalo en unos minutos.']);
}
if (empty($g['success']) || !isset($g['purchase'])) {
    responder(403, ['error' => 'clave_invalida', 'mensaje' => 'Esa clave no es válida. Cópiala tal como aparece en tu correo de Gumroad.']);
}

$compra = $g['purchase'];
if (($compra['product_id'] ?? $CONFIG['gumroad_product_id']) !== $CONFIG['gumroad_product_id']) {
    responder(403, ['error' => 'clave_invalida', 'mensaje' => 'Esa clave es de otro producto.']);
}
if (!empty($compra['refunded']) || !empty($compra['chargebacked']) || !empty($compra['disputed'])) {
    responder(403, ['error' => 'reembolsada', 'mensaje' => 'Esta compra fue reembolsada o está en disputa, así que la clave ya no está activa.']);
}
if (!empty($compra['test']) && empty($CONFIG['permitir_compras_prueba'])) {
    responder(403, ['error' => 'clave_invalida', 'mensaje' => 'Esa clave es de una compra de prueba.']);
}

if (!$conocido) {
    if (count($registro['dispositivos']) >= (int)$CONFIG['max_dispositivos']) {
        responder(403, [
            'error' => 'limite_dispositivos',
            'mensaje' => 'Esta clave ya se activó en ' . (int)$CONFIG['max_dispositivos'] . ' dispositivos. Escríbenos si necesitas liberar uno.',
        ]);
    }
    $registro['dispositivos'][] = ['id' => $dispositivo, 'desde' => date('c')];
    guardarDispositivos($hashClave, $registro);
}

responder(200, crearPermiso($hashClave, $dispositivo));
