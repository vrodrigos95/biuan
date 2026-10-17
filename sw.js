// Service worker de Biuan (generado al compilar; no editar dist/sw.js a mano).
const VERSION = "38ce9108f311"
const PRECACHE = [
  "./",
  "./assets/baloo-2-latin-700-normal-CqTg7A15.woff2",
  "./assets/baloo-2-latin-700-normal-Ld3Zm3l2.woff",
  "./assets/index-CXH5nP6I.css",
  "./assets/index-Cg_SSdS2.js",
  "./assets/nunito-latin-400-normal-DKg4f3fz.woff",
  "./assets/nunito-latin-400-normal-r8SDr6Up.woff2",
  "./assets/nunito-latin-600-normal-Br8yIETf.woff2",
  "./assets/nunito-latin-600-normal-Cd0eNu1l.woff",
  "./assets/nunito-latin-700-normal-Dort48En.woff2",
  "./assets/nunito-latin-700-normal-OcDqTBcA.woff",
  "./assets/nunito-latin-800-normal-D-J0wlBY.woff",
  "./assets/nunito-latin-800-normal-Dz8SOQK_.woff2",
  "./config.json",
  "./contenido/controles/A1.json",
  "./contenido/controles/A2.json",
  "./contenido/estructura.json",
  "./contenido/examen-nivel/a1.json",
  "./contenido/examen-nivel/a2.json",
  "./contenido/examen-nivel/b1.json",
  "./contenido/examen-nivel/b2.json",
  "./contenido/indice.json",
  "./contenido/lecciones/L01.json",
  "./contenido/lecciones/L02.json",
  "./contenido/lecciones/L03.json",
  "./contenido/lecciones/L04.json",
  "./contenido/lecciones/L05.json",
  "./contenido/lecciones/L06.json",
  "./contenido/lecciones/L07.json",
  "./contenido/lecciones/L08.json",
  "./contenido/lecciones/L09.json",
  "./contenido/lecciones/L10.json",
  "./contenido/lecciones/L11.json",
  "./contenido/lecciones/L12.json",
  "./contenido/lecciones/L13.json",
  "./contenido/lecciones/L14.json",
  "./contenido/lecciones/L15.json",
  "./contenido/lecciones/L16.json",
  "./contenido/lecciones/L17.json",
  "./contenido/lecciones/L18.json",
  "./contenido/lecciones/L19.json",
  "./contenido/lecciones/L20.json",
  "./contenido/lecciones/L21.json",
  "./contenido/lecciones/L22.json",
  "./contenido/lecciones/L23.json",
  "./contenido/lecciones/L24.json",
  "./contenido/lecciones/L25.json",
  "./contenido/lecciones/L26.json",
  "./contenido/lecciones/L27.json",
  "./contenido/lecciones/L28.json",
  "./contenido/lecciones/L29.json",
  "./contenido/lecciones/L30.json",
  "./contenido/lecciones/L31.json",
  "./contenido/lecciones/L32.json",
  "./contenido/lecciones/L33.json",
  "./contenido/lecciones/L34.json",
  "./contenido/lecciones/L35.json",
  "./contenido/lecciones/L36.json",
  "./contenido/lecciones/L37.json",
  "./contenido/lecciones/L38.json",
  "./contenido/lecciones/L39.json",
  "./contenido/lecciones/L40.json",
  "./contenido/lecciones/L41.json",
  "./contenido/lecciones/L42.json",
  "./contenido/lecciones/L43.json",
  "./contenido/lecciones/L44.json",
  "./contenido/lecciones/L45.json",
  "./contenido/lecciones/L46.json",
  "./contenido/lecciones/L47.json",
  "./contenido/lecciones/L48.json",
  "./contenido/lecciones/L49.json",
  "./contenido/lecciones/L50.json",
  "./contenido/lecciones/L51.json",
  "./contenido/lecciones/L52.json",
  "./contenido/lecciones/L53.json",
  "./contenido/lecciones/L54.json",
  "./contenido/lecciones/L55.json",
  "./contenido/lecciones/L56.json",
  "./contenido/lecciones/L57.json",
  "./contenido/lecciones/L58.json",
  "./contenido/lecciones/L59.json",
  "./contenido/lecciones/L60.json",
  "./contenido/lecciones/L72.json",
  "./contenido/simulacro.json",
  "./iconos/apple-touch-icon.png",
  "./iconos/icono-192.png",
  "./iconos/icono-512.png",
  "./iconos/icono-maskable-512.png",
  "./index.html",
  "./manifest.webmanifest"
]
const APP = 'biuan-app-' + VERSION
const CONTENIDO = 'biuan-contenido'
const PAGO = 'biuan-pago'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(APP).then((c) => c.addAll(PRECACHE.map((f) => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith('biuan-app-') && k !== APP).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

async function redPrimero(req, cache, clave = req) {
  try {
    const r = await fetch(req)
    if (r.ok) (await caches.open(cache)).put(clave, r.clone())
    return r
  } catch {
    const g = await caches.match(clave)
    if (g) return g
    throw new Error('sin conexión')
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  const rel = url.pathname.slice(new URL(self.registration.scope).pathname.length)

  // Contenido de pago: siempre se intenta la red (para respetar la licencia) y se guarda para usar sin conexión.
  if (rel === 'api/contenido.php') {
    e.respondWith(redPrimero(req, PAGO, url.href))
    return
  }
  if (rel === 'api/indice.php') {
    e.respondWith(redPrimero(req, CONTENIDO, url.origin + url.pathname))
    return
  }
  if (rel.startsWith('api/')) return

  // Páginas: la red primero; sin conexión, la app guardada.
  if (req.mode === 'navigate') {
    e.respondWith(redPrimero(req, APP, './index.html').catch(() => caches.match('./index.html', { ignoreSearch: true })))
    return
  }

  // Configuración y contenido público: la red primero para tomar cambios; sin conexión, lo guardado.
  if (rel === 'config.json' || rel.startsWith('contenido/')) {
    e.respondWith(redPrimero(req, CONTENIDO, url.origin + url.pathname))
    return
  }

  // Archivos de la app (con nombre con hash): lo guardado primero.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((g) => g || fetch(req)))
})
