// Registro del service worker y avisos de actualización.
const oyentes = new Set()
let hayActualizacion = false

export function alActualizar(fn) {
  oyentes.add(fn)
  if (hayActualizacion) fn()
  return () => oyentes.delete(fn)
}

export function registrarSW() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return
  const registrar = () =>
    navigator.serviceWorker
      .register('sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const nuevo = reg.installing
          nuevo?.addEventListener('statechange', () => {
            // Solo avisa si ya había una versión anterior controlando la página.
            if (nuevo.state === 'activated' && navigator.serviceWorker.controller) {
              hayActualizacion = true
              oyentes.forEach((fn) => fn())
            }
          })
        })
        // Busca versiones nuevas cada vez que la app vuelve a primer plano.
        document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && reg.update().catch(() => {}))
      })
      .catch(() => {})
  // La app arranca después de leer config.json; puede que "load" ya haya ocurrido.
  if (document.readyState === 'complete') registrar()
  else window.addEventListener('load', registrar)
}

export const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const instalada = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true

let eventoInstalar = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  eventoInstalar = e
})
export const puedeInstalarDirecto = () => !!eventoInstalar
export async function instalar() {
  if (!eventoInstalar) return false
  eventoInstalar.prompt()
  const r = await eventoInstalar.userChoice.catch(() => null)
  eventoInstalar = null
  return r?.outcome === 'accepted'
}
