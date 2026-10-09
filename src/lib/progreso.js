const CLAVE = 'biuan:progreso:v1'

function vacio() {
  return {
    version: 1,
    dispositivo: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
    nombre: '',
    colocacion: null,
    subnivelActual: null,
    lecciones: {},
    controles: {},
    simulacro: [],
    xp: 0,
    racha: { actual: 0, mejor: 0, ultimoDia: null },
    repaso: {},
  }
}

let estado = null

export function leerProgreso() {
  if (estado) return estado
  try {
    const crudo = localStorage.getItem(CLAVE)
    estado = crudo ? { ...vacio(), ...JSON.parse(crudo) } : vacio()
  } catch {
    estado = vacio()
  }
  return estado
}

export function guardarProgreso(cambios) {
  estado = { ...leerProgreso(), ...cambios }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(estado))
  } catch {
    // Almacenamiento lleno o bloqueado (modo privado): se conserva en memoria.
  }
  pedirPersistencia()
  return estado
}

let persistenciaPedida = false
function pedirPersistencia() {
  if (persistenciaPedida) return
  persistenciaPedida = true
  navigator.storage?.persist?.().catch(() => {})
}
