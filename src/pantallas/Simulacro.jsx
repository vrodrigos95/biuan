import { useEffect, useRef, useState } from 'react'
import { ir } from '../App.jsx'
import { cargarJSON } from '../lib/contenido.js'
import { esErrorLicencia, tieneAcceso } from '../lib/acceso.js'
import { preparar, evaluar } from '../lib/ejercicios.js'
import { guardarProgreso, leerProgreso } from '../lib/progreso.js'
import { agregarAlRepaso } from '../lib/repaso.js'
import { barajar } from '../lib/azar.js'
import Pregunta from '../componentes/Pregunta.jsx'
import Bloqueado from '../componentes/Bloqueado.jsx'

// Lección donde se repasa cada tema del simulacro.
const LECCION_DEL_TEMA = { pascont: 'L53', futuro: 'L57', modales: 'L60', conectores: 'L56' }

// Toma n preguntas al azar repartidas entre los temas.
function elegir(preguntas, n) {
  if (n >= preguntas.length) return barajar(preguntas)
  const porTema = {}
  for (const p of barajar(preguntas)) (porTema[p.tema] ||= []).push(p)
  const grupos = Object.values(porTema)
  const elegidas = []
  for (let i = 0; elegidas.length < n; i++) {
    const g = grupos[i % grupos.length]
    if (g.length) elegidas.push(g.shift())
    if (grupos.every((x) => !x.length)) break
  }
  return barajar(elegidas)
}

const formato = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

export default function Simulacro() {
  const [sim, setSim] = useState(null)
  const [error, setError] = useState(null)
  const [fase, setFase] = useState('intro')
  const [modo, setModo] = useState(null)
  const [preguntas, setPreguntas] = useState([])
  const [pos, setPos] = useState(0)
  const [resps, setResps] = useState({})
  const [restante, setRestante] = useState(0)
  const [resultado, setResultado] = useState(null)
  const terminarRef = useRef(null)

  useEffect(() => {
    if (!tieneAcceso()) return setError('bloqueo')
    cargarJSON('simulacro.json')
      .then(setSim)
      .catch((e) => setError(esErrorLicencia(e) ? 'bloqueo' : 'El simulacro todavía no está disponible.'))
  }, [])

  useEffect(() => {
    if (fase !== 'examen') return
    const t = setInterval(() => {
      setRestante((s) => {
        if (s <= 1) {
          clearInterval(t)
          setTimeout(() => terminarRef.current?.(), 0)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [fase])

  if (error === 'bloqueo') return <Bloqueado que="El simulacro" />
  if (error)
    return (
      <main className="pantalla">
        <div className="aviso">{error}</div>
        <button className="boton" onClick={() => ir('ruta')}>Volver a la ruta</button>
      </main>
    )
  if (!sim) return <main className="pantalla cargando">Cargando…</main>

  const historial = leerProgreso().simulacro || []

  function empezar(m) {
    setModo(m)
    setPreguntas(elegir(sim.preguntas, m.preguntas).map(preparar))
    setResps({})
    setPos(0)
    setRestante(m.minutos * 60)
    setFase('examen')
    window.scrollTo(0, 0)
  }

  function terminar(r = resps) {
    const porTema = {}
    let aciertos = 0
    const fallados = []
    for (const p of preguntas) {
      const ok = r[p.id] != null && evaluar(p, r[p.id])
      porTema[p.tema] ||= [0, 0]
      porTema[p.tema][1]++
      if (ok) {
        aciertos++
        porTema[p.tema][0]++
      } else fallados.push(p.id)
    }
    const puntaje = Math.round((aciertos / preguntas.length) * 100)
    const p = leerProgreso()
    guardarProgreso({ simulacro: [...(p.simulacro || []), { fecha: new Date().toISOString(), modo: modo.id, puntaje, porTema }].slice(-50) })
    agregarAlRepaso('simulacro', fallados)
    setResultado({ aciertos, puntaje, porTema, r })
    setFase('resultado')
    window.scrollTo(0, 0)
  }
  terminarRef.current = terminar

  if (fase === 'intro') {
    const mejor = historial.length ? Math.max(...historial.map((h) => h.puntaje)) : null
    return (
      <main className="pantalla control">
        <header className="cabecera">
          <button className="enlace" onClick={() => ir('ruta')}>‹ Mi ruta</button>
        </header>
        <section className="tarjeta">
          <p className="etiqueta">Práctica bajo presión de tiempo</p>
          <h1>{sim.titulo}</h1>
          <p>{sim.descripcion}</p>
          <p className="nota">Puedes saltar preguntas; las que no contestes cuentan como incorrectas. Al final verás el análisis por tema y la explicación de cada respuesta.</p>
          {mejor !== null && <p className="nota">Tu mejor resultado: <strong>{mejor}%</strong> · {historial.length} {historial.length === 1 ? 'intento' : 'intentos'}</p>}
        </section>
        <div className="modos">
          {sim.modos.map((m) => (
            <button key={m.id} className="tarjeta modo" onClick={() => empezar(m)}>
              <strong>{m.titulo}</strong>
              <span>{Math.min(m.preguntas, sim.preguntas.length)} preguntas · {m.minutos} min</span>
            </button>
          ))}
        </div>
      </main>
    )
  }

  if (fase === 'resultado') {
    const { puntaje, aciertos, porTema, r } = resultado
    const debiles = Object.entries(porTema)
      .filter(([, [ok, tot]]) => ok < tot)
      .sort((a, b) => b[1][1] - b[1][0] - (a[1][1] - a[1][0]) || a[1][0] / a[1][1] - b[1][0] / b[1][1])
    return (
      <main className="pantalla control">
        <section className="tarjeta nivel">
          <p className="etiqueta">{sim.titulo} · {modo.titulo}</p>
          <p className="nivel-grande">{puntaje}%</p>
          <p>{aciertos} de {preguntas.length} correctas</p>
          <p>
            {puntaje >= 90 ? '¡Excelente! Dominas este nivel.' : puntaje >= 70 ? 'Muy bien, solo faltan detalles por repasar.' : puntaje >= 50 ? 'Vas bien; repasa los temas donde fallaste.' : 'Repasa las lecciones de los temas de abajo y vuelve a intentarlo.'}
          </p>
        </section>
        <section className="tarjeta">
          <h2>Análisis por tema</h2>
          {debiles.length === 0 ? (
            <p>No tuviste errores. Sigue practicando temas mezclados para mantener el nivel.</p>
          ) : (
            <ul className="plan-datos">
              {debiles.map(([t, [ok, tot]]) => (
                <li key={t}>
                  <span>{sim.temas[t] || t}</span>
                  <strong>{tot - ok} de {tot} incorrectas</strong>
                  {LECCION_DEL_TEMA[t] && (
                    <button className="enlace" onClick={() => ir(`leccion/${LECCION_DEL_TEMA[t]}`)}>Repasar la lección ›</button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="nota">Las preguntas que fallaste se agregaron a tu repaso de los próximos días.</p>
        </section>
        <section className="tarjeta revision">
          <h2>Tus respuestas</h2>
          <ol>
            {preguntas.map((p) => {
              const ok = r[p.id] != null && evaluar(p, r[p.id])
              return (
                <li key={p.id} className={ok ? 'bien' : 'mal'}>
                  <p className="enunciado-chico">{p.enunciado}</p>
                  {!ok && <p>Tu respuesta: {r[p.id] != null ? p.opciones[r[p.id]] : 'Sin contestar'}</p>}
                  <p>Correcta: <strong>{p.opciones[p.correcta]}</strong></p>
                  <p className="porque">{p.porque}</p>
                </li>
              )
            })}
          </ol>
        </section>
        <button className="boton boton-primario boton-grande" onClick={() => setFase('intro')}>Intentar otro simulacro</button>
        <button className="enlace centrado" onClick={() => ir('ruta')}>Volver a la ruta</button>
      </main>
    )
  }

  const p = preguntas[pos]
  const ultima = pos + 1 >= preguntas.length
  const contestada = resps[p.id] != null

  function siguiente() {
    if (ultima) {
      if (confirm('¿Terminar y ver tu resultado?')) terminar()
      return
    }
    setPos(pos + 1)
    window.scrollTo(0, 0)
  }

  return (
    <main className="pantalla examen leccion control">
      <header className="barra-examen">
        <button className="cerrar" onClick={() => confirm('¿Salir del simulacro? No se guardará este intento.') && setFase('intro')} aria-label="Salir">✕</button>
        <div className="progreso" aria-hidden>
          <div style={{ width: `${(pos / preguntas.length) * 100}%` }} />
        </div>
        <span className={`contador ${restante < 60 ? 'urgente' : ''}`}>{formato(restante)}</span>
      </header>
      <p className="etiqueta">{pos + 1} de {preguntas.length}</p>
      <Pregunta key={p.id} pregunta={p} seleccion={resps[p.id] ?? null} onSeleccion={(i) => setResps((rs) => ({ ...rs, [p.id]: i }))} hayVoz={false} />
      <div className="acciones-fijas">
        <button className={`boton boton-grande ${contestada || ultima ? 'boton-primario' : ''}`} onClick={siguiente}>
          {ultima ? 'Terminar' : contestada ? 'Siguiente' : 'Saltar'}
        </button>
      </div>
    </main>
  )
}
