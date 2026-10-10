// Arma las carpetas para Hostinger a partir de dist/:
//   produccion/public_html   → la app, el contenido gratis y la API (se sube a public_html)
//   produccion/biuan-privado → el contenido de pago y la configuración (se sube FUERA de public_html)
// El contenido se toma de CONTENIDO_DIR (por omisión, ./contenido).
import fs from 'node:fs'
import path from 'node:path'
import { generarSW } from './generar-sw.mjs'

const CONTENIDO = path.resolve(process.env.CONTENIDO_DIR || 'contenido')
const DIST = path.resolve('dist')
const SALIDA = path.resolve('produccion')
const PUBLICO = path.join(SALIDA, 'public_html')
const PRIVADO = path.join(SALIDA, 'biuan-privado')

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error('Primero corre npm run build.')
  process.exit(1)
}

const listar = (carpeta, patron) => {
  const dir = path.join(CONTENIDO, carpeta)
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => patron.test(f)).sort() : []
}
const copiar = (de, a) => {
  fs.mkdirSync(path.dirname(a), { recursive: true })
  fs.cpSync(de, a, { recursive: true })
}

fs.rmSync(SALIDA, { recursive: true, force: true })

// 1. App (sin el contenido que trae dist) + configuración de producción + API
fs.cpSync(DIST, PUBLICO, { recursive: true, filter: (f) => !f.startsWith(path.join(DIST, 'contenido')) })
copiar(path.resolve('servidor/config.produccion.json'), path.join(PUBLICO, 'config.json'))
copiar(path.resolve('servidor/api'), path.join(PUBLICO, 'api'))

// 2. Contenido gratis (público): estructura, índice, examen de nivel y lecciones de unidades gratis
const estructura = JSON.parse(fs.readFileSync(path.join(CONTENIDO, 'estructura.json'), 'utf8'))
const gratis = new Set(estructura.subniveles.flatMap((s) => s.unidades.filter((u) => u.gratis).flatMap((u) => u.lecciones.map((l) => l.id))))
const lecciones = listar('lecciones', /^L\d{2}\.json$/)
const controles = listar('controles', /^(A1|A2|B1)\.json$/)
const pubContenido = path.join(PUBLICO, 'contenido')
copiar(path.join(CONTENIDO, 'estructura.json'), path.join(pubContenido, 'estructura.json'))
copiar(path.join(CONTENIDO, 'examen-nivel'), path.join(pubContenido, 'examen-nivel'))
for (const f of lecciones) if (gratis.has(f.slice(0, 3))) copiar(path.join(CONTENIDO, 'lecciones', f), path.join(pubContenido, 'lecciones', f))
fs.writeFileSync(
  path.join(pubContenido, 'indice.json'),
  JSON.stringify({ lecciones: lecciones.map((f) => f.slice(0, 3)), controles: controles.map((f) => f.slice(0, 2)), simulacro: fs.existsSync(path.join(CONTENIDO, 'simulacro.json')) }, null, 2) + '\n',
)

// La lista de archivos para usar sin conexión cambia: se regenera el service worker.
generarSW(PUBLICO)
copiar(path.resolve('servidor/public_html.htaccess'), path.join(PUBLICO, '.htaccess'))

// 3. Privado: todo el contenido de pago, configuración de ejemplo y carpeta de datos
for (const f of lecciones) if (!gratis.has(f.slice(0, 3))) copiar(path.join(CONTENIDO, 'lecciones', f), path.join(PRIVADO, 'contenido', 'lecciones', f))
for (const f of controles) copiar(path.join(CONTENIDO, 'controles', f), path.join(PRIVADO, 'contenido', 'controles', f))
if (fs.existsSync(path.join(CONTENIDO, 'simulacro.json'))) copiar(path.join(CONTENIDO, 'simulacro.json'), path.join(PRIVADO, 'contenido', 'simulacro.json'))
copiar(path.resolve('servidor/privado/config.ejemplo.php'), path.join(PRIVADO, 'config.ejemplo.php'))
copiar(path.resolve('servidor/privado/.htaccess'), path.join(PRIVADO, '.htaccess'))
fs.mkdirSync(path.join(PRIVADO, 'datos'), { recursive: true })

const pagadas = lecciones.filter((f) => !gratis.has(f.slice(0, 3))).length
console.log(`Listo en ${path.relative(process.cwd(), SALIDA)}/`)
console.log(`  public_html: app, API y ${lecciones.length - pagadas} lecciones gratis`)
console.log(`  biuan-privado: ${pagadas} lecciones de pago, ${controles.length} exámenes de control${fs.existsSync(path.join(CONTENIDO, 'simulacro.json')) ? ' y el simulacro' : ''}`)
