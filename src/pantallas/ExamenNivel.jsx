import { useEffect, useState } from 'react'
import { ir } from '../App.jsx'
import { cargarBancoNivel } from '../lib/contenido.js'
import { prepararVoz, callar } from '../lib/voz.js'
import { calcularResultado, iniciarExamen, MAX_PREGUNTAS, preguntaActual, responder } from '../lib/examenNivel.js'
import { guardarProgreso } from '../lib/progreso.js'
import Pregunta from '../componentes/Pregunta.jsx'

// Respuestas del último examen, para la revisión en la pantalla de resultado.
export let ultimaRevision = null

const SUBNIVEL_SI_B1 = 'B1.2'

export default function ExamenNivel() {
  const [examen, setExamen] = useState(null)
  const [error, setError] = useState(null)
  const [seleccion, setSeleccion] = useState(null)

  useEffect(() => {
    let vivo = true
    Promise.all([cargarBancoNivel(), prepararVoz()])
      .then(([banco, hayVoz]) => vivo && setExamen(iniciarExamen(banco, hayVoz)))
      .catch(() => vivo && setError('No se pudo cargar el examen. Revisa tu conexión e inténtalo de nuevo.'))
    return () => {
      vivo = false
      callar()
    }
  }, [])

  if (error)
    return (
      <main className="pantalla">
        <div className="aviso">{error}</div>
        <button className="boton" onClick={() => location.reload()}>Reintentar</button>
      </main>
    )
  if (!examen) return <main className="pantalla cargando">Cargando…</main>

  const p = preguntaActual(examen)
  const numero = examen.historial.length + 1

  function continuar() {
    if (seleccion === null) return
    const nuevo = responder(examen, seleccion)
    setSeleccion(null)
    if (nuevo.terminado) {
      const r = calcularResultado(nuevo.resultados)
      ultimaRevision = nuevo.historial
      guardarProgreso({
        colocacion: { fecha: new Date().toISOString(), ...r },
        subnivelActual: r.arranque || SUBNIVEL_SI_B1,
      })
      ir('resultado')
      return
    }
    setExamen(nuevo)
    window.scrollTo(0, 0)
  }

  function salir() {
    if (confirm('¿Salir del examen? Perderás tus respuestas.')) ir('')
  }

  return (
    <main className="pantalla examen">
      <header className="barra-examen">
        <button className="cerrar" onClick={salir} aria-label="Salir del examen">✕</button>
        <div className="progreso" aria-hidden>
          <div style={{ width: `${(examen.historial.length / MAX_PREGUNTAS) * 100}%` }} />
        </div>
        <span className="contador">{numero}</span>
      </header>
      {numero === 1 && <p className="instruccion">Elige la respuesta correcta. Si no la sabes, elige la que te parezca mejor.</p>}
      <Pregunta key={p.id} pregunta={p} seleccion={seleccion} onSeleccion={setSeleccion} hayVoz={examen.hayVoz} />
      <div className="acciones-fijas">
        <button className="boton boton-primario boton-grande" disabled={seleccion === null} onClick={continuar}>
          Continuar
        </button>
      </div>
    </main>
  )
}
