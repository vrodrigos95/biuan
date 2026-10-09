// Plan para llegar a B1 desde el subnivel de arranque.
export function calcularPlan(estructura, arranque) {
  const subs = estructura.subniveles
  const desde = subs.findIndex((s) => s.id === arranque)
  if (desde === -1) return null
  const restantes = subs.slice(desde)
  const lecciones = restantes.reduce((n, s) => n + s.unidades.reduce((m, u) => m + u.lecciones.length, 0), 0)
  const controles = estructura.controles.filter((c) => restantes.some((s) => s.id === c.despuesDe)).length
  const minutosDia = 10
  const dias = Math.ceil((lecciones * estructura.minutosPorLeccion) / minutosDia) + controles
  return { subnivel: subs[desde], lecciones, controles, dias, semanas: Math.ceil(dias / 7) }
}
