# Despliegue de Biuan

## Pruebas: GitHub Pages
Automático. Cada vez que se sube un cambio, GitHub compila la app y la publica en
`https://vrodrigos95.github.io/biuan/` (rama `gh-pages`). Todo es público y la licencia
funciona en modo de demostración con la clave `BIUAN-DEMO-2026`.

## Producción: Hostinger

### Qué se sube y a dónde
En cada cambio, GitHub también arma el paquete para Hostinger:
GitHub → pestaña **Actions** → la ejecución más reciente de "Publicar" → **Artifacts** →
descarga **biuan-hostinger** (un .zip). Adentro hay dos carpetas:

| Carpeta del zip | Dónde va en Hostinger | Qué tiene |
|---|---|---|
| `public_html/` | dentro de `public_html` de tu dominio | la app, la API y el contenido gratis |
| `biuan-privado/` | **al lado** de `public_html` (no adentro) | el contenido de pago, la configuración y los datos |

En Hostinger la carpeta del dominio suele ser `domains/tudominio.com/`, así que queda:
```
domains/tudominio.com/
├─ public_html/        ← contenido de public_html del zip
└─ biuan-privado/      ← carpeta biuan-privado del zip
```

### Primera vez
1. hPanel → **Seguridad → SSL**: activa el certificado (la app necesita https).
2. hPanel → **Archivos → Administrador de archivos**: sube el zip, descomprímelo y mueve
   cada carpeta a su lugar (tabla de arriba).
3. En `biuan-privado/`, copia `config.ejemplo.php` como **`config.php`** y llena:
   - `gumroad_product_id`: Gumroad → tu producto → Content → License key.
   - `secreto`: 64 caracteres al azar (letras a–f y números 0–9).
   - `origenes`: `['https://tudominio.com']`.
4. Sube las **lecciones de pago** a `biuan-privado/contenido/lecciones/`, los exámenes de
   control a `biuan-privado/contenido/controles/` y el simulacro como
   `biuan-privado/contenido/simulacro.json`. Las de la Unidad 1 (gratis) van en
   `public_html/contenido/lecciones/`.
5. Revisa que `biuan-privado/datos/` se pueda escribir (permisos 755).
6. Abre tu dominio, activa tu clave de prueba y abre una lección de pago.

### Actualizar la app
Descarga el zip nuevo y reemplaza **solo** el contenido de `public_html` (excepto, si
existen, tus lecciones gratis propias). No toques `biuan-privado/`: ahí están tu
configuración, tus lecciones de pago y los dispositivos activados. Los usuarios reciben el
aviso "Hay una versión nueva" y su progreso se conserva.

### Agregar o corregir contenido
Solo sube o reemplaza el archivo JSON en su carpeta. No hay que recompilar: el servidor
arma la lista de lecciones disponibles leyendo las carpetas.

### Link de compra y dominio
`public_html/config.json` se genera desde `servidor/config.produccion.json` del
repositorio. Para que no se pierdan al actualizar, el link de Gumroad (`gumroadUrl`) y
el dominio (`sitioUrl`) se guardan ahí, en el repositorio (no son secretos).

## Cómo funciona la licencia
- `api/activar.php`: comprueba la clave con Gumroad y entrega un permiso firmado por
  30 días para ese dispositivo. La app lo renueva sola con internet.
- `api/contenido.php`: entrega lecciones de pago, exámenes y simulacro solo con permiso válido.
- `api/indice.php`: lista el contenido disponible leyendo las carpetas.
- Hasta 3 dispositivos por clave. Para liberar dispositivos de una clave, borra su archivo
  en `biuan-privado/datos/licencias/`.
- Límites: activar 5 intentos cada 15 min y 20 al día por IP; contenido 300 archivos por
  hora por clave.
- Si Gumroad marca la compra como reembolsada o en disputa, al renovar se quita el acceso.

## Sin conexión
Después de la primera visita la app funciona sin internet (examen de nivel, ruta, lecciones
gratis). En producción, al activar la clave se descargan todas las lecciones de pago para
usarlas sin conexión.

## Armar el paquete en tu computadora (opcional)
```
CONTENIDO_DIR=/ruta/a/tu/contenido npm run build:produccion
```
