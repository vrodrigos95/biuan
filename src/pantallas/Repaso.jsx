import { useEffect, useState } from 'react'
import { ir } from '../App.jsx'
import { cargarEstructura, cargarJSON } from '../lib/contenido.js'
import { leccionGratis, tieneAcceso } from '../lib/acceso.js'
import { prepararVoz, callar } from '../lib/voz.js'
import { preparar } from '../lib/ejercicios.js'
import { leerProgreso } from '../lib/progreso.js'
import { calificarRepaso, MAX_POR_SESION, pendientes, separar } from '../lib/repaso.js'
import { registrarRepaso } from '../lib/logros.js'
import Ronda from '../componentes/Ronda.jsx'

const ORIGEN_VALIDO = /^(L\d{2}|control:(A1|A2|B1))$/

async function cargarOrigen(origen) {
  if (origen.startsWith('control:')) {
    const c = await cargarJSON(`controles/${origen.slice(8)}.json`)
    return c.secciones.flatMap((s) => s.preguntas)
  }
  const l = await cargarJSON(`lecciones/${origen}.json`)
  return l.ejercicios
}

export default function Repaso() {
  const [cola, setCola] = useState(null)
  const [hayVoz, setHayVoz] = useState(false)
  const [pos, setPos] = useState(0)
  const [aciertos, setAciertos] = useState(0)
  const [logro, setLogro] = useState(null)

  useEffect(() => {
    let vivo = true
    // Sin licencia solo se repasa lo gratis.
    const permitido = (o, est) => tieneAcceso() || (!o.startsWith('control:') && leccionGratis(est, o))
    cargarEstructura().then((est) => {
    const claves = pendientes(leerProgreso(), undefined, (o) => permitido(o, est)).slice(0, MAX_POR_SESION)
    const origenes = [...new Set(claves.map((c) => separar(c).origen))].filter((o) => ORIGEN_VALIDO.test(o))
    return Promise.all([Promise.all(origenes.map((o) => cargarOrigen(o).then((ejs) => [o, ejs]).catch(() => [o, []]))), prepararVoz()]).then(
      ([fuentes, voz]) => {
        if (!vivo) return
        const mapa = Object.fromEntries(fuentes)
        // Los ejercicios cuyo contenido ya no existe se omiten.
        const lista = claves
          .map((c) => {
            const { origen, id } = separar(c)
            const ej = mapa[origen]?.find((e) => e.id === id)
            return ej ? { clave: c, ej: preparar(ej) } : null
          })
          .filter(Boolean)
        setHayVoz(voz)
        setCola(lista)
      },
    )
    })
    return () => {
      vivo = false
      callar()
    }
  }, [])

  if (!cola) return <main className="pantalla cargando">Cargando…</main>

  if (!cola.length) {
    return (
      <main className="pantalla">
        <div className="tarjeta">
          <h1>Nada que repasar hoy</h1>
          <p>Los ejercicios que falles en lecciones y exámenes aparecerán aquí en los días siguientes.</p>
        </div>
        <button className="boton boton-primario boton-grande" onClick={() => ir('ruta')}>Volver a la ruta</button>
      </main>
    )
  }

  if (logro) {
    return (
      <main className="pantalla leccion fin">
        <div className="tarjeta nivel">
          <p className="etiqueta">Repaso terminado</p>
          <p className="nivel-grande">{aciertos}/{cola.length}</p>
          <p>Lo que acertaste volverá más adelante; lo que fallaste, mañana.</p>
        </div>
        <div className="logros">
          <div className="logro"><span>⭐</span><strong>+{logro.xpGanada} XP</strong></div>
          <div className="logro"><span>🔥</span><strong>{logro.racha} {logro.racha === 1 ? 'día' : 'días'} de racha</strong></div>
        </div>
        <button className="boton boton-primario boton-grande" onClick={() => ir('ruta')}>Continuar</button>
      </main>
    )
  }

  const { clave, ej } = cola[pos]

  function calificar(ok) {
    calificarRepaso(clave, ok)
    if (ok) setAciertos((a) => a + 1)
  }

  function continuar() {
    if (pos + 1 >= cola.length) {
      setLogro(registrarRepaso(aciertos))
      window.scrollTo(0, 0)
      return
    }
    setPos(pos + 1)
    window.scrollTo(0, 0)
  }

  return (
    <Ronda
      key={clave}
      ej={ej}
      etiqueta={`Repaso · ${pos + 1} de ${cola.length}`}
      avance={pos / cola.length}
      hayVoz={hayVoz}
      onSalir={() => ir('ruta')}
      onCalificar={calificar}
      onContinuar={continuar}
    />
  )
}
