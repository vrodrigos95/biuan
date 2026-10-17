<?php
// Configuración privada de Biuan. Copia este archivo como config.php en la carpeta
// privada (fuera de public_html) y llena los valores. Nunca lo subas al repositorio.
return [
    // Gumroad: Producto → Content → License key → "product_id".
    'gumroad_product_id' => '',

    // Secreto para firmar los permisos. Genera uno con: php -r "echo bin2hex(random_bytes(32));"
    'secreto' => '',

    // Dispositivos distintos que puede activar una misma clave.
    'max_dispositivos' => 3,

    // Base de datos de trucosdeaula.com (la misma de /api/licencia.php): los dispositivos se
    // guardan en su tabla licencia_dispositivos con app = 'biuan'. Usa los mismos datos que
    // trucosdeaula-privado/config.php. Si 'dsn' queda vacío, se usan archivos en datos/licencias/.
    'db' => [
        'dsn' => '', // p. ej. 'mysql:host=localhost;dbname=u000000000_trucos;charset=utf8mb4'
        'usuario' => '',
        'clave' => '',
    ],

    // Días que dura un permiso antes de renovarse con Gumroad (la app renueva sola con internet).
    'dias_permiso' => 30,

    // Dominios desde donde se puede llamar a la API, p. ej. ['https://biuan.com.mx'].
    // Vacío = solo el mismo dominio donde está la API.
    'origenes' => [],

    // Aceptar compras de prueba de Gumroad (las que haces tú con descuento del 100% sí son reales;
    // estas son las marcadas como "test"). Déjalo en false en producción.
    'permitir_compras_prueba' => false,

    // Límites de uso.
    'limite_activar_15min' => 5,
    'limite_activar_dia' => 20,
    'limite_contenido_hora' => 300,

    // Carpetas (normalmente no se cambian).
    'contenido_dir' => __DIR__ . '/contenido',
    'datos_dir' => __DIR__ . '/datos',
    'gumroad_url' => 'https://api.gumroad.com/v2/licenses/verify',
];
