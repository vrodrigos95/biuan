import { useEffect, useState } from 'react'
import { ir } from '../App.jsx'
import { cargarJSON } from '../lib/contenido.js'
import { prepararVoz, callar } from '../lib/voz.js'
import { estaLista, evaluar, preparar, respuestaCorrecta } from '../lib/ejercicios.js'
import { guardarProgreso, leerProgreso } from '../lib/progreso.js'
import Explicacion from '../componentes/Explicacion.jsx'
import Ejercicio from '../ejercicios/Ejercicio.jsx'

export default function Leccion({ id }) {
  const [leccion, setLeccion] = useState(null)
  const [hayVoz, setHayVoz] = useState(false)
  const [error, setError] = useState(null)
  const [fase, setFase] = useState('explicacion')
  const [cola, setCola] = useState([])
  const [pos, setPos] = useState(0)
  const [respuesta, setRespuesta] = useState(null)
  const [revelado, setRevelado] = useState(null)
  const [primerIntento, setPrimerIntento] = useState({})

  useEffect(() => {
    let vivo = true
    if (!/^L\d{2}$/.test(id || '')) {
      setError('Esta lección no existe.')
      return
    }
    Promise.all([cargarJSON(`lecciones/${id}.json`), prepararVoz()])
      .then(([l, voz]) => {
        if (!vivo) return
        setLeccion(l)
        setHayVoz(voz)
      })
      .catch(() => vivo && setError('Esta lección todavía no está disponible.'))
    return () => {
      vivo = false
      callar()
    }
  }, [id])

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
    setRespuesta(null)
    setRevelado(null)
    setFase('ejercicios')
    window.scrollTo(0, 0)
  }

  if (fase === 'explicacion') {
    return (
      <main className="pantalla leccion">
        <header className="barra-examen">
          <button className="cerrar" onClick={() => ir('')} aria-label="Salir de la lección">✕</button>
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
        <button className="boton boton-primario boton-grande" onClick={() => ir('')}>Continuar</button>
        <button className="enlace centrado" onClick={() => { setFase('explicacion'); window.scrollTo(0, 0) }}>Repetir la lección</button>
      </main>
    )
  }

  const { ej, repaso } = cola[pos]

  function comprobar(valor = respuesta) {
    const correcto = evaluar(ej, valor)
    setRevelado({ correcto })
    if (!repaso) {
      setPrimerIntento((p) => ({ ...p, [ej.id]: correcto }))
      // Lo que se falla regresa una vez al final de la lección.
      if (!correcto) setCola((c) => [...c, { ej: preparar(leccion.ejercicios.find((e) => e.id === ej.id)), repaso: true }])
    }
  }

  function continuar() {
    if (pos + 1 >= cola.length) {
      const anterior = leerProgreso().lecciones[leccion.id]
      guardarProgreso({
        lecciones: {
          ...leerProgreso().lecciones,
          [leccion.id]: {
            aciertos,
            total,
            mejor: Math.max(aciertos, anterior?.mejor || 0),
            fecha: new Date().toISOString(),
          },
        },
      })
      setFase('fin')
      window.scrollTo(0, 0)
      return
    }
    setPos(pos + 1)
    setRespuesta(null)
    setRevelado(null)
    window.scrollTo(0, 0)
  }

  const lista = estaLista(ej, respuesta)

  return (
    <main className="pantalla examen leccion">
      <header className="barra-examen">
        <button className="cerrar" onClick={() => confirm('¿Salir de la lección? Perderás tu avance en ella.') && ir('')} aria-label="Salir de la lección">✕</button>
        <div className="progreso" aria-hidden>
          <div style={{ width: `${(pos / cola.length) * 100}%` }} />
        </div>
      </header>
      {repaso && <p className="etiqueta etiqueta-repaso">Otra vez</p>}
      <Ejercicio key={`${pos}-${ej.id}`} ej={ej} respuesta={respuesta} setRespuesta={setRespuesta} revelado={!!revelado} hayVoz={hayVoz} onCompleto={comprobar} />

      {revelado ? (
        <div className={revelado.correcto ? 'retro retro-bien' : 'retro retro-mal'} role="status">
          <p className="retro-titulo">{revelado.correcto ? '¡Correcto!' : 'No exactamente'}</p>
          {!revelado.correcto && (
            <p>Respuesta correcta: <strong lang="en">{respuestaCorrecta(ej)}</strong></p>
          )}
          {ej.audio && hayVoz && <p className="retro-audio">Se dijo: <em lang="en">{ej.audio}</em></p>}
          <p className="retro-porque">{ej.porque}</p>
          <button className="boton boton-grande boton-retro" onClick={continuar}>Continuar</button>
        </div>
      ) : (
        <div className="acciones-fijas">
          <button className="boton boton-primario boton-grande" disabled={!lista} onClick={() => comprobar()}>Comprobar</button>
        </div>
      )}
    </main>
  )
}
