import { useEffect, useRef, useState } from 'react'
import { ir } from '../App.jsx'
import { cargarJSON } from '../lib/contenido.js'
import { prepararVoz, callar } from '../lib/voz.js'
import { estaLista, evaluar, preparar, respuestaCorrecta } from '../lib/ejercicios.js'
import { guardarProgreso, leerProgreso } from '../lib/progreso.js'
import { crearFolio, dibujarConstancia, pdfDesdeJpeg } from '../lib/constancia.js'
import { descargar } from '../lib/compartir.js'
import { nivelAbierto } from '../lib/ruta.js'
import Ejercicio from '../ejercicios/Ejercicio.jsx'

function textoRespuesta(ej, r) {
  if (r == null) return 'Sin respuesta'
  if (Number.isInteger(r) && ej.opciones) return ej.opciones[r]
  if (ej.tipo === 'hueco') return r
  if (ej.tipo === 'ordenar') return r.map((id) => ej.fichas.find((f) => f.id === id).texto).join(' ')
  if (ej.tipo === 'emparejar') return r.errores ? `${r.errores} ${r.errores === 1 ? 'error' : 'errores'} al unir` : 'Sin errores'
  return ''
}

function formatoTiempo(s) {
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

export default function Control({ nivel }) {
  const [examen, setExamen] = useState(null)
  const [hayVoz, setHayVoz] = useState(false)
  const [error, setError] = useState(null)
  const [fase, setFase] = useState('intro')
  const [preguntas, setPreguntas] = useState([])
  const [pos, setPos] = useState(0)
  const [respuestas, setRespuestas] = useState({})
  const [restante, setRestante] = useState(0)
  const [resultado, setResultado] = useState(null)
  const [progreso, setProgreso] = useState(leerProgreso)
  const terminarRef = useRef(null)

  useEffect(() => {
    let vivo = true
    if (!['A1', 'A2', 'B1'].includes(nivel)) {
      setError('Este examen no existe.')
      return
    }
    Promise.all([cargarJSON(`controles/${nivel}.json`), prepararVoz()])
      .then(([c, voz]) => {
        if (!vivo) return
        setExamen(c)
        setHayVoz(voz)
      })
      .catch(() => vivo && setError('Este examen todavía no está disponible.'))
    return () => {
      vivo = false
      callar()
    }
  }, [nivel])

  // Cronómetro: al llegar a cero se entrega el examen.
  useEffect(() => {
    if (fase !== 'examen' || !examen?.minutos) return
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
  }, [fase, examen])

  if (error)
    return (
      <main className="pantalla">
        <div className="aviso">{error}</div>
        <button className="boton" onClick={() => ir('ruta')}>Volver a la ruta</button>
      </main>
    )
  if (!examen) return <main className="pantalla cargando">Cargando…</main>

  const previo = progreso.controles?.[nivel]
  const total = examen.secciones.reduce((n, s) => n + s.preguntas.length, 0)
  const esperaMs = (examen.espera_horas_reintento || 0) * 3600 * 1000
  const listoDesde = previo && !previo.aprobado && previo.ultimoIntento ? new Date(previo.ultimoIntento).getTime() + esperaMs : 0
  const faltaEspera = Math.max(0, listoDesde - Date.now())
  const abierto = nivelAbierto(nivel, progreso)

  function empezar() {
    const lista = examen.secciones.flatMap((s) => s.preguntas.map((p) => ({ ...preparar(p), seccion: s.titulo })))
    setPreguntas(lista)
    setRespuestas({})
    setPos(0)
    setRestante((examen.minutos || 0) * 60)
    setFase('examen')
    window.scrollTo(0, 0)
  }

  function terminar(resps = respuestas) {
    const porSeccion = {}
    let aciertos = 0
    for (const p of preguntas) {
      const ok = resps[p.id] != null && evaluar(p, resps[p.id])
      if (ok) aciertos++
      porSeccion[p.seccion] = porSeccion[p.seccion] || { aciertos: 0, total: 0 }
      porSeccion[p.seccion].total++
      if (ok) porSeccion[p.seccion].aciertos++
    }
    const puntaje = Math.round((aciertos / preguntas.length) * 100)
    const aprobado = puntaje >= examen.aprobacion
    const ahora = new Date().toISOString()
    const p = leerProgreso()
    const antes = p.controles?.[nivel] || {}
    const registro = {
      aprobado: antes.aprobado || aprobado,
      puntaje: Math.max(antes.puntaje || 0, aprobado ? puntaje : 0) || puntaje,
      intentos: (antes.intentos || 0) + 1,
      ultimoIntento: ahora,
      fecha: aprobado && !antes.aprobado ? ahora : antes.fecha || (aprobado ? ahora : null),
      folio: antes.folio || (aprobado ? crearFolio() : null),
    }
    setProgreso(guardarProgreso({ controles: { ...p.controles, [nivel]: registro } }))
    setResultado({ aciertos, puntaje, aprobado, porSeccion, resps })
    setFase('resultado')
    callar()
    window.scrollTo(0, 0)
  }
  terminarRef.current = terminar

  if (fase === 'intro') {
    return (
      <main className="pantalla control">
        <header className="cabecera">
          <button className="enlace" onClick={() => ir('ruta')}>‹ Mi ruta</button>
        </header>
        <section className="tarjeta">
          <p className="etiqueta">Examen de control</p>
          <h1>{examen.titulo}</h1>
          <ul className="plan-datos">
            <li><span>Preguntas</span><strong>{total}</strong></li>
            {examen.minutos && <li><span>Tiempo</span><strong>{examen.minutos} minutos</strong></li>}
            <li><span>Para aprobar</span><strong>{examen.aprobacion}% de aciertos</strong></li>
            {examen.desbloquea && <li><span>Si apruebas</span><strong>Se abre {examen.desbloquea} y recibes tu constancia</strong></li>}
          </ul>
          <p className="nota">No verás si acertaste hasta el final. Al terminar podrás revisar cada respuesta con su explicación.</p>
        </section>
        {previo?.aprobado && <BloqueConstancia nivel={nivel} examen={examen} registro={previo} progreso={progreso} />}
        {!abierto ? (
          <div className="aviso">Este examen se abre cuando llegas a este nivel.</div>
        ) : faltaEspera > 0 ? (
          <div className="aviso">Podrás intentarlo de nuevo en {Math.ceil(faltaEspera / 3600000)} h. Mientras, repasa las lecciones del nivel.</div>
        ) : (
          <button className="boton boton-primario boton-grande" onClick={empezar}>
            {previo ? 'Volver a presentar' : 'Empezar examen'}
          </button>
        )}
      </main>
    )
  }

  if (fase === 'resultado') {
    const r = resultado
    return (
      <main className="pantalla control">
        <section className={`tarjeta nivel ${r.aprobado ? '' : 'reprobado'}`}>
          <p className="etiqueta">{examen.titulo}</p>
          <p className="nivel-grande">{r.puntaje}%</p>
          <p><strong>{r.aprobado ? '¡Aprobaste!' : 'Esta vez no alcanzó'}</strong> · {r.aciertos} de {preguntas.length} correctas · se necesita {examen.aprobacion}%</p>
          {r.aprobado && examen.desbloquea && <p>Ya puedes avanzar a {examen.desbloquea}.</p>}
          {!r.aprobado && examen.espera_horas_reintento > 0 && <p>Repasa los temas que fallaste; podrás intentarlo de nuevo en {examen.espera_horas_reintento} h.</p>}
        </section>
        <section className="tarjeta">
          <h2>Por sección</h2>
          <ul className="plan-datos">
            {Object.entries(r.porSeccion).map(([s, v]) => (
              <li key={s}><span>{s}</span><strong>{v.aciertos} de {v.total}</strong></li>
            ))}
          </ul>
        </section>
        {r.aprobado && <BloqueConstancia nivel={nivel} examen={examen} registro={progreso.controles[nivel]} progreso={progreso} />}
        <section className="tarjeta revision">
          <h2>Tus respuestas</h2>
          <ol>
            {preguntas.map((p) => {
              const ok = r.resps[p.id] != null && evaluar(p, r.resps[p.id])
              return (
                <li key={p.id} className={ok ? 'bien' : 'mal'}>
                  <p className="enunciado-chico">{p.enunciado || p.pregunta || p.frase || p.traduccion || 'Une las parejas'}</p>
                  {!ok && <p>Tu respuesta: {textoRespuesta(p, r.resps[p.id])}</p>}
                  <p>Correcta: <strong>{respuestaCorrecta(p)}</strong></p>
                  <p className="porque">{p.porque}</p>
                </li>
              )
            })}
          </ol>
        </section>
        <button className="boton boton-primario boton-grande" onClick={() => ir('ruta')}>Volver a la ruta</button>
      </main>
    )
  }

  const ej = preguntas[pos]
  const resp = respuestas[ej.id]
  const ultima = pos + 1 >= preguntas.length

  function siguiente() {
    if (ultima) {
      if (confirm('¿Entregar el examen?')) terminar()
      return
    }
    setPos(pos + 1)
    window.scrollTo(0, 0)
  }

  return (
    <main className="pantalla examen leccion control">
      <header className="barra-examen">
        <button className="cerrar" onClick={() => confirm('¿Salir del examen? No se guardará este intento.') && ir('ruta')} aria-label="Salir del examen">✕</button>
        <div className="progreso" aria-hidden>
          <div style={{ width: `${(pos / preguntas.length) * 100}%` }} />
        </div>
        {examen.minutos ? <span className={`contador ${restante < 60 ? 'urgente' : ''}`}>{formatoTiempo(restante)}</span> : <span className="contador">{pos + 1}</span>}
      </header>
      <p className="etiqueta">{ej.seccion} · {pos + 1} de {preguntas.length}</p>
      <Ejercicio
        key={ej.id}
        ej={ej}
        respuesta={resp ?? null}
        setRespuesta={(v) => setRespuestas((rs) => ({ ...rs, [ej.id]: typeof v === 'function' ? v(rs[ej.id]) : v }))}
        revelado={false}
        hayVoz={hayVoz}
      />
      <div className="acciones-fijas">
        <button className="boton boton-primario boton-grande" disabled={!estaLista(ej, resp ?? null)} onClick={siguiente}>
          {ultima ? 'Entregar examen' : 'Siguiente'}
        </button>
      </div>
    </main>
  )
}

function BloqueConstancia({ nivel, examen, registro, progreso }) {
  const [nombre, setNombre] = useState(progreso.nombre || '')
  const [generando, setGenerando] = useState(false)
  const [aviso, setAviso] = useState('')

  async function generar() {
    const limpio = nombre.trim()
    if (!limpio) return setAviso('Escribe tu nombre como quieres que aparezca.')
    setGenerando(true)
    setAviso('')
    try {
      guardarProgreso({ nombre: limpio })
      const jpeg = await dibujarConstancia({
        nombre: limpio,
        nivel,
        titulo: examen.titulo,
        puntaje: registro.puntaje,
        fecha: registro.fecha,
        folio: registro.folio,
      })
      descargar(await pdfDesdeJpeg(jpeg), `constancia-biuan-${nivel}.pdf`)
      setAviso('Constancia descargada.')
    } catch {
      setAviso('No se pudo crear la constancia en este navegador.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <section className="tarjeta constancia">
      <h2>Tu constancia {nivel}</h2>
      <p className="nota">Documento en PDF que indica tu nivel estimado. No es una certificación oficial.</p>
      <label className="campo">
        <span>Nombre completo (aparece en la constancia)</span>
        <input type="text" value={nombre} maxLength={40} autoComplete="name" onChange={(e) => setNombre(e.target.value)} />
      </label>
      <button className="boton boton-secundario boton-ancho" disabled={generando} onClick={generar}>
        {generando ? 'Creando…' : 'Descargar constancia (PDF)'}
      </button>
      {aviso && <p className="nota">{aviso}</p>}
    </section>
  )
}
