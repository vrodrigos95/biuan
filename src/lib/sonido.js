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
}

// Dos notas suaves; con más aciertos seguidos el tono sube un poco.
export function sonarAcierto(racha = 1) {
  if (!sonidoActivo()) return
  try {
    ctx ||= new (window.AudioContext || window.webkitAudioContext)()
    if (ctx.state === 'suspended') ctx.resume()
    const base = 660 * Math.pow(2, Math.min(racha - 1, 6) / 12)
    const t = ctx.currentTime
    ;[base, base * 1.5].forEach((f, i) => {
      const osc = ctx.createOscillator()
      const vol = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      const inicio = t + i * 0.09
      vol.gain.setValueAtTime(0, inicio)
      vol.gain.linearRampToValueAtTime(0.08, inicio + 0.015)
      vol.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.32)
      osc.connect(vol).connect(ctx.destination)
      osc.start(inicio)
      osc.stop(inicio + 0.35)
    })
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
