// Ruta: subniveles, niveles desbloqueados y avance.
export const NIVELES_RUTA = ['A1', 'A2', 'B1']

export function subnivelesPlanos(estructura) {
  return estructura.subniveles.map((s) => ({
    ...s,
    lecciones: s.unidades.flatMap((u) => u.lecciones.map((l) => ({ ...l, unidad: u.numero }))),
  }))
}

// Un nivel se abre si el examen de nivel colocó al usuario en él o más arriba,
// o si aprobó el examen de control del nivel anterior.
export function nivelAbierto(nivel, progreso) {
  const i = NIVELES_RUTA.indexOf(nivel)
  if (i <= 0) return true
  const arranque = progreso.arranque || progreso.subnivelActual
  if (arranque && NIVELES_RUTA.indexOf(arranque.slice(0, 2)) >= i) return true
  return !!progreso.controles?.[NIVELES_RUTA[i - 1]]?.aprobado
}

export const leccionHecha = (progreso, id) => !!progreso.lecciones?.[id]

// El subnivel actual es el primero, desde el de arranque, que aún tiene lecciones sin hacer.
export function subnivelActual(estructura, progreso) {
  const subs = subnivelesPlanos(estructura)
  const arranque = progreso.arranque || progreso.subnivelActual || 'A1.1'
  const desde = Math.max(0, subs.findIndex((s) => s.id === arranque))
  for (let i = desde; i < subs.length; i++) {
    // Un nivel con examen de control aprobado se da por terminado.
    if (progreso.controles?.[subs[i].nivel]?.aprobado) continue
    if (subs[i].lecciones.some((l) => !leccionHecha(progreso, l.id))) return subs[i]
  }
  return subs[subs.length - 1]
}

// Primera lección disponible y sin hacer en cualquier nivel abierto (para repasar mientras llega contenido).
export function leccionPendienteAbierta(estructura, progreso, disponibles) {
  for (const s of subnivelesPlanos(estructura)) {
    if (!nivelAbierto(s.nivel, progreso)) continue
    const l = s.lecciones.find((x) => disponibles.has(x.id) && !leccionHecha(progreso, x.id))
    if (l) return l
  }
  return null
}

export function avanceSubnivel(sub, progreso) {
  const hechas = sub.lecciones.filter((l) => leccionHecha(progreso, l.id)).length
  return { hechas, total: sub.lecciones.length }
}

// Siguiente lección disponible y sin hacer, para el botón "Continuar".
export function siguienteLeccion(estructura, progreso, disponibles) {
  const subs = subnivelesPlanos(estructura)
  const actual = subnivelActual(estructura, progreso)
  const desde = subs.findIndex((s) => s.id === actual.id)
  for (let i = desde; i < subs.length; i++) {
    if (!nivelAbierto(subs[i].nivel, progreso)) break
    const l = subs[i].lecciones.find((x) => disponibles.has(x.id) && !leccionHecha(progreso, x.id))
    if (l) return l
  }
  return null
}
