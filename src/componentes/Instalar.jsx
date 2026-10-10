import { useState } from 'react'
import { esIOS, instalada, instalar, puedeInstalarDirecto } from '../lib/pwa.js'

// Invita a agregar Biuan a la pantalla de inicio (así funciona sin conexión y el progreso queda más seguro).
export default function Instalar() {
  const [cerrada, setCerrada] = useState(() => {
    try { return localStorage.getItem('biuan:instalar-cerrado') === '1' } catch { return false }
  })
  if (instalada() || cerrada) return null
  const ios = esIOS()
  if (!ios && !puedeInstalarDirecto()) return null

  function cerrar() {
    try { localStorage.setItem('biuan:instalar-cerrado', '1') } catch { /* sin almacenamiento */ }
    setCerrada(true)
  }

  return (
    <section className="tarjeta instalar">
      <button className="cerrar-chico" onClick={cerrar} aria-label="Cerrar">✕</button>
      <h2>Instala Biuan en tu celular</h2>
      <p className="nota">Se abre como app, funciona sin internet y tu progreso queda más protegido.</p>
      {ios ? (
        <ol className="pasos">
          <li>Toca el botón <strong>Compartir</strong> de Safari (el cuadro con la flecha hacia arriba).</li>
          <li>Elige <strong>Agregar a inicio</strong>.</li>
        </ol>
      ) : (
        <button className="boton boton-secundario boton-ancho" onClick={() => instalar().then((ok) => ok && cerrar())}>
          Instalar app
        </button>
      )}
    </section>
  )
}
