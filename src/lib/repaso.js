// Repaso espaciado tipo Leitner: 5 cajas; cada acierto sube de caja y aleja el siguiente repaso,
// un fallo regresa el ejercicio a la caja 1. Al acertar en la caja 5 se da por dominado.
import { guardarProgreso, leerProgreso } from './progreso.js'
import { hoy } from './logros.js'

export const INTERVALOS = [1, 2, 4, 8, 16] // días de espera al estar en la caja 1…5
export const MAX_POR_SESION = 15

function sumarDias(dia, n) {
  const [a, m, d] = dia.split('-').map(Number)
  const f = new Date(a, m - 1, d + n)
  return hoy(f)
}

// clave = "L04#e02" o "control:A1#g03"
export const clave = (origen, id) => `${origen}#${id}`
export function separar(c) {
  const i = c.lastIndexOf('#')
  return { origen: c.slice(0, i), id: c.slice(i + 1) }
}

// Ejercicios fallados en una lección o examen: entran (o regresan) a la caja 1 para mañana.
export function agregarAlRepaso(origen, ids) {
  if (!ids.length) return
  const p = leerProgreso()
  const repaso = { ...p.repaso }
  const dia = hoy()
  for (const id of ids) {
    const c = clave(origen, id)
    const previo = repaso[c]
    repaso[c] = {
      caja: 1,
      proxima: sumarDias(dia, INTERVALOS[0]),
      historial: [...(previo?.historial || []), { dia, ok: false }].slice(-20),
    }
  }
  guardarProgreso({ repaso })
}

export function pendientes(progreso, dia = hoy(), permitido = () => true) {
  return Object.entries(progreso.repaso || {})
    .filter(([c, r]) => r.proxima <= dia && permitido(separar(c).origen))
    .sort(([, a], [, b]) => a.proxima.localeCompare(b.proxima) || a.caja - b.caja)
    .map(([c]) => c)
}

// permitido(origen): sin licencia solo cuenta lo gratis.
export function resumenRepaso(progreso, permitido = () => true) {
  const todos = Object.entries(progreso.repaso || {}).filter(([c]) => permitido(separar(c).origen)).map(([, r]) => r)
  const deHoy = pendientes(progreso, hoy(), permitido).length
  const proxima = todos.map((r) => r.proxima).sort()[0] || null
  return { deHoy, total: todos.length, proxima }
}

// Resultado de un ejercicio dentro de una sesión de repaso.
export function calificarRepaso(c, ok) {
  const p = leerProgreso()
  const r = p.repaso?.[c]
  if (!r) return
  const dia = hoy()
  const repaso = { ...p.repaso }
  const historial = [...(r.historial || []), { dia, ok }].slice(-20)
  if (ok && r.caja >= INTERVALOS.length) {
    delete repaso[c] // dominado
  } else {
    const caja = ok ? r.caja + 1 : 1
    repaso[c] = { caja, proxima: sumarDias(dia, INTERVALOS[caja - 1]), historial }
  }
  guardarProgreso({ repaso })
}
