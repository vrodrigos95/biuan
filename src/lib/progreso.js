const CLAVE = 'biuan:progreso:v1'

function vacio() {
  return {
    version: 1,
    dispositivo: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
    nombre: '',
    colocacion: null,
    subnivelActual: null,
    arranque: null,
    lecciones: {},
    controles: {},
    simulacro: [],
    xp: 0,
    racha: { actual: 0, mejor: 0, ultimoDia: null },
    hoy: null,
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

export const tieneProgreso = (p = leerProgreso()) =>
  !!(p.colocacion || p.arranque || Object.keys(p.lecciones || {}).length)

// --- Exportar e importar (para cambiar de dispositivo) ---
const NO_SE_EXPORTA = ['licencia', 'dispositivo']

export function exportarProgreso() {
  const datos = { ...leerProgreso() }
  for (const k of NO_SE_EXPORTA) delete datos[k]
  return new Blob([JSON.stringify({ app: 'biuan', exportado: new Date().toISOString(), progreso: datos }, null, 2)], {
    type: 'application/json',
  })
}

const esObjeto = (v) => v && typeof v === 'object' && !Array.isArray(v)
const esNumero = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0
const FECHA = /^\d{4}-\d{2}-\d{2}/
const SUBNIVEL = /^(A1|A2|B1)\.[12]$/
const ID_LECCION = /^L\d{2}$/

// Valida el archivo y conserva solo campos conocidos con el tipo correcto.
export function importarProgreso(texto) {
  if (texto.length > 1_000_000) throw new Error('El archivo es demasiado grande.')
  let datos
  try {
    datos = JSON.parse(texto)
  } catch {
    throw new Error('El archivo no es un respaldo de Biuan.')
  }
  if (!esObjeto(datos) || datos.app !== 'biuan' || !esObjeto(datos.progreso) || datos.progreso.version !== 1)
    throw new Error('El archivo no es un respaldo de Biuan.')
  const e = datos.progreso
  const limpio = {}
  if (typeof e.nombre === 'string') limpio.nombre = e.nombre.slice(0, 40)
  if (esObjeto(e.colocacion) && typeof e.colocacion.nivel === 'string') limpio.colocacion = e.colocacion
  for (const k of ['subnivelActual', 'arranque']) if (SUBNIVEL.test(e[k] || '')) limpio[k] = e[k]
  if (esObjeto(e.lecciones)) {
    limpio.lecciones = {}
    for (const [id, l] of Object.entries(e.lecciones)) {
      if (ID_LECCION.test(id) && esObjeto(l) && esNumero(l.aciertos) && esNumero(l.total)) limpio.lecciones[id] = l
    }
  }
  if (esObjeto(e.controles)) limpio.controles = e.controles
  if (Array.isArray(e.simulacro)) limpio.simulacro = e.simulacro.slice(-100)
  if (esNumero(e.xp)) limpio.xp = Math.floor(e.xp)
  if (esObjeto(e.racha) && esNumero(e.racha.actual) && esNumero(e.racha.mejor) && (e.racha.ultimoDia === null || FECHA.test(e.racha.ultimoDia || '')))
    limpio.racha = { actual: e.racha.actual, mejor: e.racha.mejor, ultimoDia: e.racha.ultimoDia }
  if (esObjeto(e.repaso)) limpio.repaso = e.repaso
  if (esObjeto(e.hoy) && FECHA.test(e.hoy.dia || '') && esNumero(e.hoy.lecciones)) limpio.hoy = { dia: e.hoy.dia, lecciones: e.hoy.lecciones }
  const actual = leerProgreso()
  estado = { ...vacio(), ...limpio, dispositivo: actual.dispositivo, licencia: actual.licencia }
  return guardarProgreso({})
}
