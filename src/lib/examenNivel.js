// Examen de nivel adaptativo: bloques de 6 preguntas por nivel, de A1 a B2.
// Con 4 aciertos en un bloque sube de nivel; con 3 fallos en el bloque termina.
import { barajar } from './azar.js'

export const NIVELES = ['A1', 'A2', 'B1', 'B2']
export const POR_BLOQUE = 6
export const PARA_APROBAR = 4
export const FALLOS_PARA_PARAR = 3
const ORDEN_HABILIDADES = ['gramatica', 'vocabulario', 'lectura', 'gramatica', 'escucha', 'vocabulario']

function armarBloque(preguntas, hayVoz) {
  const disponibles = barajar(preguntas.filter((p) => hayVoz || p.habilidad !== 'escucha'))
  const elegidas = []
  for (const hab of ORDEN_HABILIDADES) {
    const quiero = hab === 'escucha' && !hayVoz ? 'lectura' : hab
    let i = disponibles.findIndex((p) => p.habilidad === quiero)
    if (i === -1) i = 0
    if (disponibles[i]) elegidas.push(disponibles.splice(i, 1)[0])
  }
  // Opciones en orden aleatorio, recordando cuál es la correcta.
  return elegidas.map((p) => {
    const orden = barajar(p.opciones.map((_, i) => i))
    return { ...p, opciones: orden.map((i) => p.opciones[i]), correcta: orden.indexOf(p.correcta) }
  })
}

export function iniciarExamen(banco, hayVoz) {
  return {
    banco,
    hayVoz,
    nivel: 0,
    bloque: armarBloque(banco[NIVELES[0]], hayVoz),
    pos: 0,
    resultados: {},
    historial: [],
    terminado: false,
  }
}

export const preguntaActual = (ex) => ex.bloque[ex.pos]

export const MAX_PREGUNTAS = NIVELES.length * POR_BLOQUE

export function responder(ex, eleccion) {
  const p = preguntaActual(ex)
  const nivel = NIVELES[ex.nivel]
  const acierto = eleccion === p.correcta
  const historial = [...ex.historial, { pregunta: p, eleccion, acierto }]
  const r = ex.resultados[nivel] || { aciertos: 0, fallos: 0 }
  const resultados = { ...ex.resultados, [nivel]: { aciertos: r.aciertos + (acierto ? 1 : 0), fallos: r.fallos + (acierto ? 0 : 1) } }
  const actual = resultados[nivel]
  const finBloque = ex.pos + 1 >= ex.bloque.length || actual.fallos >= FALLOS_PARA_PARAR

  if (!finBloque) return { ...ex, pos: ex.pos + 1, historial, resultados }

  const aprobado = actual.aciertos >= PARA_APROBAR && actual.fallos < FALLOS_PARA_PARAR
  const siguiente = ex.nivel + 1
  if (!aprobado || siguiente >= NIVELES.length) return { ...ex, historial, resultados, terminado: true }
  return {
    ...ex,
    nivel: siguiente,
    bloque: armarBloque(ex.banco[NIVELES[siguiente]], ex.hayVoz),
    pos: 0,
    historial,
    resultados,
  }
}

// nivel: 'A1 inicial' | 'A1' | 'A2' | 'B1' | 'B2+'; arranque: subnivel donde empieza o null si ya es B1 o más.
export function calcularResultado(resultados) {
  let aprobados = 0
  for (const n of NIVELES) {
    const r = resultados[n]
    if (r && r.aciertos >= PARA_APROBAR && r.fallos < FALLOS_PARA_PARAR) aprobados++
    else break
  }
  // Cada nivel vale 25 puntos, proporcionales a sus aciertos.
  const puntaje = Math.round(NIVELES.reduce((s, n) => s + (25 * (resultados[n]?.aciertos || 0)) / POR_BLOQUE, 0))

  if (aprobados === NIVELES.length) return { nivel: 'B2+', arranque: null, puntaje, alcanzaB1: true }
  const fallado = NIVELES[aprobados]
  const casi = (resultados[fallado]?.aciertos || 0) >= 3
  const nivel = aprobados === 0 ? 'A1 inicial' : NIVELES[aprobados - 1]
  const alcanzaB1 = aprobados >= 3
  const arranque = alcanzaB1 ? null : `${fallado}.${casi ? 2 : 1}`
  return { nivel, arranque, puntaje, alcanzaB1 }
}

export function etiquetaNivel(nivel) {
  return nivel === 'B2+' ? 'B2 o más' : nivel
}
