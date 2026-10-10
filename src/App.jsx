import { useEffect, useState } from 'react'
import Inicio from './pantallas/Inicio.jsx'
import ExamenNivel from './pantallas/ExamenNivel.jsx'
import Resultado from './pantallas/Resultado.jsx'
import Leccion from './pantallas/Leccion.jsx'
import Ruta from './pantallas/Ruta.jsx'
import Control from './pantallas/Control.jsx'
import Repaso from './pantallas/Repaso.jsx'
import Desbloquear from './pantallas/Desbloquear.jsx'
import Simulacro from './pantallas/Simulacro.jsx'
import { tieneProgreso } from './lib/progreso.js'

function leerRuta() {
  const h = location.hash.replace(/^#\/?/, '')
  const [pantalla, param] = h.split('/')
  return { pantalla: pantalla || 'inicio', param }
}

export function ir(ruta) {
  location.hash = '#/' + ruta
}

const RETO = 'biuan:reto'
function guardarReto(param) {
  const n = Number(param)
  if (Number.isInteger(n) && n >= 0 && n <= 100) {
    try { sessionStorage.setItem(RETO, String(n)) } catch { /* sin almacenamiento */ }
  }
}
export function leerReto() {
  try {
    const n = Number(sessionStorage.getItem(RETO))
    return sessionStorage.getItem(RETO) !== null && Number.isInteger(n) && n >= 0 && n <= 100 ? n : null
  } catch {
    return null
  }
}

export default function App() {
  const [ruta, setRuta] = useState(leerRuta)

  useEffect(() => {
    const alCambiar = () => {
      setRuta(leerRuta())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  if (ruta.pantalla === 'reto') {
    guardarReto(ruta.param)
    history.replaceState(null, '', '#/')
  }

  switch (ruta.pantalla) {
    case 'examen':
      return <ExamenNivel />
    case 'resultado':
      return <Resultado />
    case 'leccion':
      return <Leccion key={ruta.param} id={ruta.param} />
    case 'ruta':
      return <Ruta />
    case 'simulacro':
      return <Simulacro />
    case 'desbloquear':
      return <Desbloquear />
    case 'repaso':
      return <Repaso />
    case 'control':
      return <Control key={ruta.param} nivel={ruta.param} />
    case 'bienvenida':
      return <Inicio />
    default:
      return tieneProgreso() && ruta.pantalla !== 'reto' ? <Ruta /> : <Inicio />
  }
}
