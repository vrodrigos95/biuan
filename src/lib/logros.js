// XP, racha diaria y meta del día.
import { guardarProgreso, leerProgreso } from './progreso.js'

export const XP_POR_ACIERTO = 10
export const XP_POR_LECCION = 20
export const META_DIARIA = 2 // lecciones de 5 minutos = 10 minutos al día

export function hoy(fecha = new Date()) {
  const d = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 10)
}

function ayer() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return hoy(d)
}

// Racha vigente: si el último día de estudio fue antes de ayer, ya se rompió.
export function rachaVigente(progreso) {
  const r = progreso.racha || {}
  if (r.ultimoDia === hoy() || r.ultimoDia === ayer()) return r.actual || 0
  return 0
}

export function metaDeHoy(progreso) {
  const h = progreso.hoy || {}
  return { hechas: h.dia === hoy() ? h.lecciones : 0, meta: META_DIARIA }
}

// Registra una actividad del día (lección o repaso) y actualiza la racha.
function marcarDia(progreso) {
  const dia = hoy()
  const r = progreso.racha || { actual: 0, mejor: 0, ultimoDia: null }
  if (r.ultimoDia === dia) return r
  const actual = r.ultimoDia === ayer() ? (r.actual || 0) + 1 : 1
  return { actual, mejor: Math.max(actual, r.mejor || 0), ultimoDia: dia }
}

export function registrarLeccion(id, aciertos, total) {
  const p = leerProgreso()
  const anterior = p.lecciones?.[id]
  const xpGanada = aciertos * XP_POR_ACIERTO + XP_POR_LECCION
  const racha = marcarDia(p)
  const h = p.hoy?.dia === hoy() ? p.hoy : { dia: hoy(), lecciones: 0 }
  guardarProgreso({
    lecciones: {
      ...p.lecciones,
      [id]: { aciertos, total, mejor: Math.max(aciertos, anterior?.mejor || 0), fecha: new Date().toISOString() },
    },
    xp: (p.xp || 0) + xpGanada,
    racha,
    hoy: { dia: h.dia, lecciones: h.lecciones + 1 },
  })
  return { xpGanada, racha: racha.actual, primeraDelDia: (p.racha?.ultimoDia !== hoy()) }
}

export const XP_POR_REPASO = 5

// Una sesión de repaso también cuenta para la racha del día.
export function registrarRepaso(aciertos) {
  const p = leerProgreso()
  const xpGanada = aciertos * XP_POR_REPASO
  const racha = marcarDia(p)
  guardarProgreso({ xp: (p.xp || 0) + xpGanada, racha })
  return { xpGanada, racha: racha.actual }
}
