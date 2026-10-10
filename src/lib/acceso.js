// Contenido gratis contra de pago y licencia de Gumroad.
// Modos: 'servidor' (producción, con API PHP), 'demo' (pruebas, clave de demostración) y 'abierto' (todo libre).
import { getConfig } from './config.js'
import { guardarProgreso, leerProgreso } from './progreso.js'

export const CLAVE_DEMO = 'BIUAN-DEMO-2026'
const RENOVAR_ANTES = 7 * 86400 // segundos antes del vencimiento

export function modoLicencia() {
  const c = getConfig()
  if (c.apiUrl) return 'servidor'
  if (c.demoLicencia) return 'demo'
  return 'abierto'
}

export function tieneAcceso(progreso = leerProgreso()) {
  if (modoLicencia() === 'abierto') return true
  return !!progreso.licencia?.permiso
}

// Gratis: el examen de nivel, la estructura y las unidades marcadas "gratis".
export function leccionGratis(estructura, id) {
  for (const s of estructura.subniveles) for (const u of s.unidades) if (u.lecciones.some((l) => l.id === id)) return !!u.gratis
  return false
}

export function rutaGratis(ruta, estructura) {
  if (ruta === 'estructura.json' || ruta === 'indice.json' || ruta.startsWith('examen-nivel/')) return true
  const m = /^lecciones\/(L\d{2})\.json$/.exec(ruta)
  return !!(m && estructura && leccionGratis(estructura, m[1]))
}

export const puedeAbrirLeccion = (estructura, id, progreso) => leccionGratis(estructura, id) || tieneAcceso(progreso)

class ErrorLicencia extends Error {
  constructor(codigo, mensaje) {
    super(mensaje)
    this.codigo = codigo
  }
}
export const esErrorLicencia = (e) => e instanceof ErrorLicencia

const urlApi = (archivo) => new URL(archivo, new URL(getConfig().apiUrl, location.href)).href

async function pedirPermiso(clave) {
  let r
  try {
    r = await fetch(urlApi('activar.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave, dispositivo: leerProgreso().dispositivo }),
    })
  } catch {
    throw new ErrorLicencia('sin_conexion', 'Necesitas internet para activar tu clave.')
  }
  const datos = await r.json().catch(() => ({}))
  if (!r.ok) throw new ErrorLicencia(datos.error || 'error', datos.mensaje || 'No se pudo activar la clave. Inténtalo de nuevo.')
  return datos
}

export async function activar(claveEscrita) {
  const clave = claveEscrita.trim().toUpperCase()
  if (!clave) throw new ErrorLicencia('datos', 'Escribe tu clave.')
  if (modoLicencia() === 'demo') {
    if (clave !== CLAVE_DEMO) throw new ErrorLicencia('clave_invalida', 'Esa clave no es válida.')
    guardarProgreso({ licencia: { clave, permiso: 'demo', vence: null } })
    return
  }
  const { permiso, vence } = await pedirPermiso(clave)
  guardarProgreso({ licencia: { clave, permiso, vence } })
}

// Con internet, renueva el permiso antes de que venza. Si Gumroad dice que se reembolsó, se quita.
export async function renovarSiToca({ forzar = false } = {}) {
  if (modoLicencia() !== 'servidor' || !navigator.onLine) return
  const lic = leerProgreso().licencia
  if (!lic?.clave) return
  if (!forzar && lic.vence && lic.vence - Date.now() / 1000 > RENOVAR_ANTES) return
  try {
    const { permiso, vence } = await pedirPermiso(lic.clave)
    guardarProgreso({ licencia: { ...lic, permiso, vence } })
  } catch (e) {
    if (['reembolsada', 'clave_invalida', 'limite_dispositivos'].includes(e.codigo)) await quitarLicencia()
  }
}

export async function quitarLicencia() {
  guardarProgreso({ licencia: null })
  // Borra de este dispositivo el contenido de pago guardado para usar sin conexión.
  if ('caches' in window) await caches.delete('biuan-pago').catch(() => {})
}

// Descarga un archivo de pago desde la API.
export async function pedirContenidoPago(ruta, reintentar = true) {
  const lic = leerProgreso().licencia
  if (!lic?.permiso) throw new ErrorLicencia('sin_licencia', 'Este contenido es parte del curso completo.')
  const url = urlApi('contenido.php') + '?f=' + encodeURIComponent(ruta)
  const r = await fetch(url, { headers: { 'X-Permiso': lic.permiso, 'X-Dispositivo': leerProgreso().dispositivo } })
  if (r.status === 401 && reintentar) {
    await renovarSiToca({ forzar: true })
    return pedirContenidoPago(ruta, false)
  }
  if (r.status === 401) throw new ErrorLicencia('sin_licencia', 'Activa tu clave para ver este contenido.')
  if (!r.ok) throw new Error(`No se pudo cargar ${ruta}`)
  return r.json()
}
