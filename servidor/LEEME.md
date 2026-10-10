# Servidor de Biuan (Hostinger)

## Qué hace
- `api/activar.php`: recibe la clave de Gumroad y el id del dispositivo, la comprueba con
  Gumroad y entrega un permiso firmado que dura 30 días. La app lo renueva sola con internet.
- `api/contenido.php`: entrega las lecciones de pago, los exámenes de control y el simulacro
  solo a quien tiene un permiso válido para ese dispositivo.
- El contenido de pago y la configuración viven en `biuan-privado/`, **fuera de public_html**.

## Armar los archivos
```
CONTENIDO_DIR=/ruta/a/tu/contenido-completo npm run build:produccion
```
Sin `CONTENIDO_DIR` usa la carpeta `contenido/` del repositorio (solo tiene muestras).
Resultado:
- `produccion/public_html/` → se sube a `public_html`
- `produccion/biuan-privado/` → se sube a la carpeta de tu cuenta, **al mismo nivel** que `public_html`

## Configurar (una sola vez)
1. En `biuan-privado/`, copia `config.ejemplo.php` como `config.php` y llena:
   - `gumroad_product_id`: Gumroad → tu producto → Content → License key.
   - `secreto`: una cadena larga al azar (64 caracteres hexadecimales).
   - `origenes`: tu dominio, p. ej. `['https://biuan.com.mx']`.
2. En `public_html/config.json` pon `gumroadUrl` (el link de compra) y `sitioUrl` (tu dominio).
3. La carpeta `biuan-privado/datos/` debe poder escribirse (ahí se guardan los dispositivos
   activados por clave y los límites de intentos).

## Límites
- Activar clave: 5 intentos cada 15 minutos y 20 al día por IP.
- Contenido: 300 archivos por hora por clave.
- Hasta 3 dispositivos por clave (renovar en el mismo dispositivo no cuenta).
- Si Gumroad marca la compra como reembolsada o en disputa, al renovar se quita el acceso.

Para liberar dispositivos de una clave, borra su archivo en `biuan-privado/datos/licencias/`.
