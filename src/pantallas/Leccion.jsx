import { useEffect, useState } from 'react'
import { ir } from '../App.jsx'
import { cargarEstructura, cargarJSON } from '../lib/contenido.js'
import { esErrorLicencia, puedeAbrirLeccion } from '../lib/acceso.js'
import { leerProgreso } from '../lib/progreso.js'
import Bloqueado from '../componentes/Bloqueado.jsx'
import { prepararVoz, callar } from '../lib/voz.js'
import { preparar } from '../lib/ejercicios.js'
import { agregarAlRepaso } from '../lib/repaso.js'
import { registrarLeccion, XP_POR_ACIERTO } from '../lib/logros.js'
import Explicacion from '../componentes/Explicacion.jsx'
import Ronda from '../componentes/Ronda.jsx'

export default function Leccion({ id }) {
  const [leccion, setLeccion] = useState(null)
  const [hayVoz, setHayVoz] = useState(false)
  const [error, setError] = useState(null)
  const [fase, setFase] = useState('explicacion')
  const [cola, setCola] = useState([])
  const [pos, setPos] = useState(0)
  const [primerIntento, setPrimerIntento] = useState({})
  const [logro, setLogro] = useState(null)
  const [seguidas, setSeguidas] = useState(0)
  const [xpSesion, setXpSesion] = useState(0)

  useEffect(() => {
    let vivo = true
    if (!/^L\d{2}$/.test(id || '')) {
      setError('Esta lección no existe.')
      return
    }
    cargarEstructura()
      .then((est) => {
        if (!puedeAbrirLeccion(est, id, leerProgreso())) return Promise.reject(Object.assign(new Error(), { bloqueo: true }))
        return Promise.all([cargarJSON(`lecciones/${id}.json`), prepararVoz()])
      })
      .then(([l, voz]) => {
        if (!vivo) return
        setLeccion(l)
        setHayVoz(voz)
      })
      .catch((e) => vivo && setError(e?.bloqueo || esErrorLicencia(e) ? 'bloqueo' : 'Esta lección todavía no está disponible.'))
    return () => {
      vivo = false
      callar()
    }
  }, [id])

  if (error === 'bloqueo') return <Bloqueado />
  if (error)
    return (
      <main className="pantalla">
        <div className="aviso">{error}</div>
        <button className="boton" onClick={() => ir('')}>Volver al inicio</button>
      </main>
    )
  if (!leccion) return <main className="pantalla cargando">Cargando…</main>

  function empezar() {
    setCola(leccion.ejercicios.map((ej) => ({ ej: preparar(ej), repaso: false })))
    setPos(0)
    setPrimerIntento({})
    setSeguidas(0)
    setXpSesion(0)
    setFase('ejercicios')
    window.scrollTo(0, 0)
  }

  if (fase === 'explicacion') {
    return (
      <main className="pantalla leccion">
        <header className="barra-examen">
          <button className="cerrar" onClick={() => ir('ruta')} aria-label="Salir de la lección">✕</button>
          <span className="etiqueta">{leccion.subnivel} · Lección {Number(leccion.id.slice(1))}</span>
        </header>
        <h1>{leccion.titulo}</h1>
        <Explicacion bloques={leccion.explicacion} hayVoz={hayVoz} />
        <div className="acciones-fijas">
          <button className="boton boton-primario boton-grande" onClick={empezar}>Empezar ejercicios</button>
        </div>
      </main>
    )
  }

  const total = leccion.ejercicios.length
  const aciertos = Object.values(primerIntento).filter(Boolean).length

  if (fase === 'fin') {
    return (
      <main className="pantalla leccion fin">
        <div className="tarjeta nivel">
          <p className="etiqueta">Lección terminada</p>
          <p className="nivel-grande">{aciertos}/{total}</p>
          <p>{aciertos === total ? '¡Perfecta! Sin un solo error.' : aciertos >= total * 0.75 ? '¡Muy bien! Repasaste lo que fallaste.' : 'Buen trabajo. Lo que fallaste volverá en tus repasos.'}</p>
        </div>
        {logro && (
          <div className="logros">
            <div className="logro"><span>⭐</span><strong>+{logro.xpGanada} XP</strong></div>
            <div className="logro"><span>🔥</span><strong>{logro.racha} {logro.racha === 1 ? 'día' : 'días'} de racha</strong></div>
          </div>
        )}
        {logro?.primeraDelDia && <p className="nota centrado-texto">¡Ya estudiaste hoy! Vuelve mañana para mantener tu racha.</p>}
        <button className="boton boton-primario boton-grande" onClick={() => ir('ruta')}>Continuar</button>
        <button className="enlace centrado" onClick={() => { setFase('explicacion'); window.scrollTo(0, 0) }}>Repetir la lección</button>
      </main>
    )
  }

  const { ej, repaso } = cola[pos]

  function calificar(correcto) {
    setSeguidas((n) => (correcto ? n + 1 : 0))
    if (correcto && !repaso) setXpSesion((x) => x + XP_POR_ACIERTO)
    if (repaso) return
    setPrimerIntento((p) => ({ ...p, [ej.id]: correcto }))
    // Lo que se falla regresa una vez al final de la lección.
    if (!correcto) setCola((c) => [...c, { ej: preparar(leccion.ejercicios.find((e) => e.id === ej.id)), repaso: true }])
  }

  function continuar() {
    if (pos + 1 >= cola.length) {
      const fallados = Object.entries(primerIntento).filter(([, ok]) => !ok).map(([id]) => id)
      agregarAlRepaso(leccion.id, fallados)
      setLogro(registrarLeccion(leccion.id, aciertos, total))
      setFase('fin')
      window.scrollTo(0, 0)
      return
    }
    setPos(pos + 1)
    window.scrollTo(0, 0)
  }

  return (
    <Ronda
      key={`${pos}-${ej.id}`}
      ej={ej}
      etiqueta={repaso ? 'Otra vez' : null}
      racha={seguidas}
      xp={xpSesion}
      xpPorAcierto={repaso ? 0 : XP_POR_ACIERTO}
      avance={pos / cola.length}
      hayVoz={hayVoz}
      onSalir={() => confirm('¿Salir de la lección? Perderás tu avance en ella.') && ir('ruta')}
      onCalificar={calificar}
      onContinuar={continuar}
    />
  )
}
