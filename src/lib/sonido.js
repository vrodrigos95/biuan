// Sonido corto al acertar, generado en el navegador (sin archivos). Se puede apagar.
const CLAVE = 'biuan:sonido'
let ctx = null

export function sonidoActivo() {
  try {
    return localStorage.getItem(CLAVE) !== 'no'
  } catch {
    return true
  }
}

export function cambiarSonido(activo) {
  try {
    localStorage.setItem(CLAVE, activo ? 'si' : 'no')
  } catch {
    // Sin almacenamiento: no se recuerda la preferencia.
  }
  if (activo) despertar()
}

function contexto() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  return ctx
}

// Safari solo deja sonar el audio si se activó durante un toque del usuario:
// en el primer toque se crea el contexto y se reproduce un instante de silencio.
function despertar() {
  try {
    // iPhone: que suene aunque el interruptor de silencio esté activado (iOS 17+), sin pausar la música de otras apps.
    if (navigator.audioSession && navigator.audioSession.type !== 'transient') navigator.audioSession.type = 'transient'
    const c = contexto()
    if (!c) return
    if (c.state !== 'running') c.resume().catch(() => {})
    const b = c.createBuffer(1, 1, 22050)
    const s = c.createBufferSource()
    s.buffer = b
    s.connect(c.destination)
    s.start(0)
  } catch {
    // Sin Web Audio.
  }
}

export function prepararSonido() {
  const al = () => {
    despertar()
    window.removeEventListener('pointerdown', al, true)
    window.removeEventListener('touchend', al, true)
    window.removeEventListener('keydown', al, true)
  }
  window.addEventListener('pointerdown', al, true)
  window.addEventListener('touchend', al, true)
  window.addEventListener('keydown', al, true)
}

function tocar(c, base) {
  const t = c.currentTime + 0.02
  ;[base, base * 1.5].forEach((f, i) => {
    const osc = c.createOscillator()
    const vol = c.createGain()
    osc.type = 'triangle'
    osc.frequency.value = f
    const inicio = t + i * 0.1
    vol.gain.setValueAtTime(0.0001, inicio)
    vol.gain.exponentialRampToValueAtTime(0.35, inicio + 0.02)
    vol.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.4)
    osc.connect(vol).connect(c.destination)
    osc.start(inicio)
    osc.stop(inicio + 0.45)
  })
}

// Dos notas; con más aciertos seguidos el tono sube un poco.
export function sonarAcierto(racha = 1) {
  if (!sonidoActivo()) return
  try {
    const c = contexto()
    if (!c) return
    const base = 660 * Math.pow(2, Math.min(racha - 1, 6) / 12)
    if (c.state === 'running') tocar(c, base)
    else c.resume().then(() => tocar(c, base)).catch(() => {})
  } catch {
    // Navegador sin Web Audio: sin sonido.
  }
}

export function vibrarAcierto() {
  try {
    navigator.vibrate?.(12)
  } catch {
    // Sin vibración.
  }
}
