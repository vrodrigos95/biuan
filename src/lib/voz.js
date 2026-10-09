// Voz sintetizada del navegador (Web Speech API).
let vozIngles = null
let listo = null

function elegirVoz() {
  const voces = window.speechSynthesis.getVoices()
  const ingles = voces.filter((v) => /^en[-_]/i.test(v.lang))
  vozIngles =
    ingles.find((v) => /en[-_]US/i.test(v.lang) && v.localService) ||
    ingles.find((v) => /en[-_]US/i.test(v.lang)) ||
    ingles[0] ||
    null
  return vozIngles
}

// Resuelve true si hay una voz en inglés disponible.
export function prepararVoz() {
  if (listo) return listo
  listo = new Promise((resolve) => {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return resolve(false)
    if (elegirVoz()) return resolve(true)
    const alCambiar = () => resolve(!!elegirVoz())
    window.speechSynthesis.addEventListener?.('voiceschanged', alCambiar, { once: true })
    setTimeout(() => resolve(!!elegirVoz()), 1500)
  })
  return listo
}

export function hablar(texto, { lento = false } = {}) {
  if (!vozIngles) return false
  const s = window.speechSynthesis
  s.cancel()
  const u = new SpeechSynthesisUtterance(texto)
  u.voice = vozIngles
  u.lang = vozIngles.lang
  u.rate = lento ? 0.65 : 0.9
  s.speak(u)
  return true
}

export function callar() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
