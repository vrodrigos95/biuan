import { useEffect, useState } from 'react'
import { alActualizar } from '../lib/pwa.js'

// Avisos globales: sin conexión y versión nueva disponible.
export default function Avisos() {
  const [enLinea, setEnLinea] = useState(navigator.onLine)
  const [nueva, setNueva] = useState(false)

  useEffect(() => {
    const on = () => setEnLinea(true)
    const off = () => setEnLinea(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    const quitar = alActualizar(() => setNueva(true))
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
      quitar()
    }
  }, [])

  if (nueva)
    return (
      <div className="aviso-global">
        Hay una versión nueva de Biuan.
        <button className="enlace" onClick={() => location.reload()}>Actualizar</button>
      </div>
    )
  if (!enLinea) return <div className="aviso-global aviso-offline">Sin conexión: puedes seguir estudiando lo que ya está guardado.</div>
  return null
}
