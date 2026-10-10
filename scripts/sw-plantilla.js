// Service worker de Biuan (generado al compilar; no editar dist/sw.js a mano).
const VERSION = '__VERSION__'
const PRECACHE = __ARCHIVOS__
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
