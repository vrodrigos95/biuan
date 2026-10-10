import { useEffect } from 'react'
import { callar, hablar } from '../lib/voz.js'

export default function BotonEscuchar({ texto }) {
  useEffect(() => callar, [texto])
  return (
    <div className="escuchar">
      <button type="button" className="boton boton-audio" onClick={() => hablar(texto)}>
        <span aria-hidden>🔊</span> Escuchar
      </button>
      <button type="button" className="boton boton-audio-lento" onClick={() => hablar(texto, { lento: true })}>
        <span aria-hidden>🐢</span> Más lento
      </button>
    </div>
  )
}
