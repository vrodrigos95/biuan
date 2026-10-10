import { getConfig } from './config.js'
import { modoLicencia, pedirContenidoPago, rutaGratis } from './acceso.js'

const cache = new Map()

function cargarPublico(ruta) {
  const url = new URL(ruta, new URL(getConfig().contenidoUrl, location.href)).href
  return fetch(url).then((r) => {
    if (!r.ok) throw new Error(`No se pudo cargar ${ruta}`)
    return r.json()
  })
}

// En producción el contenido de pago llega por la API con el permiso; lo gratis es público.
async function cargar(ruta) {
  if (modoLicencia() !== 'servidor' || ruta === 'estructura.json') return cargarPublico(ruta)
  // En producción el índice lo arma el servidor leyendo sus carpetas.
  if (ruta === 'indice.json') {
    const url = new URL('indice.php', new URL(getConfig().apiUrl, location.href)).href
    return fetch(url).then((r) => (r.ok ? r.json() : cargarPublico(ruta))).catch(() => cargarPublico(ruta))
  }
  const estructura = await cargarJSON('estructura.json')
  return rutaGratis(ruta, estructura) ? cargarPublico(ruta) : pedirContenidoPago(ruta)
}

export async function cargarJSON(ruta) {
  if (cache.has(ruta)) return cache.get(ruta)
  const promesa = cargar(ruta)
  cache.set(ruta, promesa)
  promesa.catch(() => cache.delete(ruta))
  return promesa
}

export const cargarEstructura = () => cargarJSON('estructura.json')

export async function cargarBancoNivel() {
  const niveles = ['A1', 'A2', 'B1', 'B2']
  const archivos = await Promise.all(niveles.map((n) => cargarJSON(`examen-nivel/${n.toLowerCase()}.json`)))
  return Object.fromEntries(niveles.map((n, i) => [n, archivos[i].preguntas]))
}

// Conjunto con los ids disponibles: lecciones (L04) y exámenes de control (control:A1).
export async function cargarIndice() {
  try {
    const i = await cargarJSON('indice.json')
    return new Set([...(i.lecciones || []), ...(i.controles || []).map((c) => `control:${c}`), ...(i.simulacro ? ['simulacro'] : [])])
  } catch {
    return new Set()
  }
}
