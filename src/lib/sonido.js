// Sonido corto al acertar, generado en el navegador (sin archivos). Se puede apagar.
// Se reproduce como audio de "reproducción" (igual que música o video), así suena aunque el
// iPhone esté en silencio. A cambio, pausa la música que esté sonando en otras apps.
const CLAVE = 'biuan:sonido'
const MUESTREO = 22050
let reproductor = null
const cache = new Map()

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

// Convierte muestras (-1…1) en un archivo WAV de 16 bits.
function wav(muestras) {
  const datos = new DataView(new ArrayBuffer(44 + muestras.length * 2))
  const texto = (o, s) => [...s].forEach((c, i) => datos.setUint8(o + i, c.charCodeAt(0)))
  texto(0, 'RIFF')
  datos.setUint32(4, 36 + muestras.length * 2, true)
  texto(8, 'WAVEfmt ')
  datos.setUint32(16, 16, true)
  datos.setUint16(20, 1, true)
  datos.setUint16(22, 1, true)
  datos.setUint32(24, MUESTREO, true)
  datos.setUint32(28, MUESTREO * 2, true)
  datos.setUint16(32, 2, true)
  datos.setUint16(34, 16, true)
  texto(36, 'data')
  datos.setUint32(40, muestras.length * 2, true)
  muestras.forEach((m, i) => datos.setInt16(44 + i * 2, Math.max(-1, Math.min(1, m)) * 0x7fff, true))
  return URL.createObjectURL(new Blob([datos], { type: 'audio/wav' }))
}

// Dos notas (la segunda una quinta arriba) con ataque rápido y caída suave.
function campanita(base) {
  if (cache.has(base)) return cache.get(base)
  const total = Math.floor(MUESTREO * 0.6)
  const m = new Float32Array(total)
  ;[base, base * 1.5].forEach((f, n) => {
    const inicio = Math.floor(MUESTREO * 0.1 * n)
    for (let i = 0; i < MUESTREO * 0.45 && inicio + i < total; i++) {
      const t = i / MUESTREO
      const onda = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * f * t)) // triangular
      const env = Math.min(1, t / 0.015) * Math.exp(-t * 9)
      m[inicio + i] += onda * env * 0.45
    }
  })
  const url = wav(m)
  cache.set(base, url)
  return url
}

function obtenerReproductor() {
  if (!reproductor) {
    reproductor = new Audio()
    reproductor.preload = 'auto'
    reproductor.setAttribute('playsinline', '')
  }
  return reproductor
}

// Safari solo deja reproducir si el primer play ocurre durante un toque del usuario.
function despertar() {
  try {
    const a = obtenerReproductor()
    a.src = wav(new Float32Array(200))
    a.volume = 0
    a.play().then(() => { a.volume = 1 }).catch(() => { a.volume = 1 })
  } catch {
    // Sin audio.
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

// Con más aciertos seguidos el tono sube un poco.
export function sonarAcierto(racha = 1) {
  if (!sonidoActivo()) return
  try {
    const base = Math.round(660 * Math.pow(2, Math.min(racha - 1, 6) / 12))
    const a = obtenerReproductor()
    a.src = campanita(base)
    a.volume = 1
    a.currentTime = 0
    a.play().catch(() => {})
  } catch {
    // Navegador sin audio: sin sonido.
  }
}

export function vibrarAcierto() {
  try {
    navigator.vibrate?.(12)
  } catch {
    // Sin vibración.
  }
}
