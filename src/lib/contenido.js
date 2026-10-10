import { getConfig } from './config.js'

const cache = new Map()

export async function cargarJSON(ruta) {
  if (cache.has(ruta)) return cache.get(ruta)
  const url = new URL(ruta, new URL(getConfig().contenidoUrl, location.href)).href
  const promesa = fetch(url).then((r) => {
    if (!r.ok) throw new Error(`No se pudo cargar ${ruta}`)
    return r.json()
  })
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
    return new Set([...(i.lecciones || []), ...(i.controles || []).map((c) => `control:${c}`)])
  } catch {
    return new Set()
  }
}
