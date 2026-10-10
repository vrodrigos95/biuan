import { useEffect, useState } from 'react'
import { ir, leerReto } from '../App.jsx'
import { getConfig } from '../lib/config.js'
import { cargarEstructura } from '../lib/contenido.js'
import { etiquetaNivel } from '../lib/examenNivel.js'
import { dibujarResultado } from '../lib/imagenResultado.js'
import { compartirImagen, compartirTexto, sitioCorto } from '../lib/compartir.js'
import { calcularPlan } from '../lib/plan.js'
import { guardarProgreso, leerProgreso } from '../lib/progreso.js'
import { ultimaRevision } from './ExamenNivel.jsx'
import Marca from '../componentes/Marca.jsx'

const DESCRIPCION = {
  'A1 inicial': 'Estás empezando. La ruta desde A1.1 te lleva paso a paso desde lo más básico.',
  A1: 'Entiendes y usas frases básicas: presentarte, hablar de tu familia y de tu día.',
  A2: 'Te comunicas en situaciones cotidianas: compras, planes y contar lo que hiciste.',
  B1: 'Te defiendes en la mayoría de las situaciones: opinas, narras y entiendes textos claros.',
  'B2+': 'Manejas el inglés con soltura en temas variados. Ya superas el B1.',
}

export default function Resultado() {
  const progreso = leerProgreso()
  const r = progreso.colocacion
  const config = getConfig()
  const [nombre, setNombre] = useState(progreso.nombre || '')
  const [imagenes, setImagenes] = useState({})
  const [estructura, setEstructura] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [verRevision, setVerRevision] = useState(false)
  const reto = leerReto()

  useEffect(() => {
    cargarEstructura().then(setEstructura).catch(() => {})
  }, [])

  // Las imágenes se generan antes del toque para que compartir sea inmediato.
  useEffect(() => {
    if (!r) return
    let vivo = true
    const t = setTimeout(async () => {
      const limpio = nombre.trim()
      guardarProgreso({ nombre: limpio })
      const datos = { nombre: limpio, nivel: r.nivel, sitio: sitioCorto(config.sitioUrl) }
      try {
        const [historia, cuadrada] = await Promise.all([
          dibujarResultado({ ...datos, formato: 'historia' }),
          dibujarResultado({ ...datos, formato: 'cuadrada' }),
        ])
        if (!vivo) return
        setImagenes((prev) => {
          if (prev.vista) URL.revokeObjectURL(prev.vista)
          return { historia, cuadrada, vista: URL.createObjectURL(cuadrada) }
        })
      } catch {
        if (vivo) setMensaje('No se pudo crear la imagen en este navegador.')
      }
    }, 350)
    return () => {
      vivo = false
      clearTimeout(t)
    }
  }, [nombre, r?.nivel])

  if (!r) {
    return (
      <main className="pantalla">
        <p>Todavía no tienes un resultado.</p>
        <button className="boton boton-primario" onClick={() => ir('examen')}>Hacer examen de nivel</button>
      </main>
    )
  }

  const etiqueta = etiquetaNivel(r.nivel)
  const textoCompartir = `Mi nivel estimado de inglés es ${etiqueta}. ¿Y el tuyo? Haz el examen gratis en Biuan:`

  async function compartir(formato) {
    const blob = imagenes[formato]
    if (!blob) return
    const res = await compartirImagen(blob, `biuan-nivel-${formato}.png`, `${textoCompartir} ${config.sitioUrl}`)
    setMensaje(res === 'descargado' ? 'Imagen guardada en tus descargas.' : '')
  }

  async function retar() {
    const url = `${config.sitioUrl}#/reto/${r.puntaje}`
    await compartirTexto(`Saqué ${r.puntaje} puntos en el examen de nivel de inglés de Biuan. ¿Me ganas? Es gratis y dura unos 7 minutos:`, url)
  }

  const plan = !r.alcanzaB1 && estructura ? calcularPlan(estructura, r.arranque) : null

  return (
    <main className="pantalla resultado">
      <header className="cabecera">
        <button className="enlace" onClick={() => ir('ruta')}>‹ Mi ruta</button>
        <Marca />
      </header>

      <section className="tarjeta nivel">
        <p className="etiqueta">Tu nivel estimado</p>
        <p className="nivel-grande">{etiqueta}</p>
        <p>{DESCRIPCION[r.nivel]}</p>
        <p className="puntaje">Puntaje: <strong>{r.puntaje}</strong> de 100</p>
        {reto !== null && (
          <p className="comparacion">
            Tu amigo sacó {reto}.{' '}
            {r.puntaje > reto ? '¡Le ganaste!' : r.puntaje === reto ? '¡Empate!' : 'Esta vez ganó tu amigo.'}
          </p>
        )}
        <p className="nota">Es una estimación de nivel, no una certificación oficial.</p>
      </section>

      {r.alcanzaB1 && (
        <section className="tarjeta felicidades">
          <h2>¡Felicidades!</h2>
          <p>Ya tienes el nivel que te piden. Compártelo y reta a tus amigos a ver si llegan.</p>
        </section>
      )}

      <section className="tarjeta compartir">
        <h2>Comparte tu resultado</h2>
        <label className="campo">
          <span>Tu nombre (aparece en la imagen)</span>
          <input
            type="text"
            value={nombre}
            maxLength={24}
            autoComplete="given-name"
            placeholder="Opcional"
            onChange={(e) => setNombre(e.target.value)}
          />
        </label>
        {imagenes.vista && <img className="vista-previa" src={imagenes.vista} alt="Vista previa de la imagen de resultado" />}
        <div className="botones-compartir">
          <button className="boton boton-primario" disabled={!imagenes.historia} onClick={() => compartir('historia')}>
            Para historias
          </button>
          <button className="boton boton-primario" disabled={!imagenes.cuadrada} onClick={() => compartir('cuadrada')}>
            Cuadrada
          </button>
        </div>
        <p className="nota">Cuadrada: para WhatsApp y LinkedIn. Historias: Instagram, Facebook y TikTok.</p>
        <button className="boton boton-secundario boton-ancho" onClick={retar}>
          Reta a un amigo
        </button>
        <p className="nota">Se comparte tu puntaje, no tu nivel.</p>
        {mensaje && <p className="aviso">{mensaje}</p>}
      </section>

      {plan && (
        <section className="tarjeta plan">
          <h2>Tu plan para llegar a B1</h2>
          <ul className="plan-datos">
            <li>
              <span>Empiezas en</span>
              <strong>{plan.subnivel.id} · {plan.subnivel.titulo}</strong>
            </li>
            <li>
              <span>Te faltan</span>
              <strong>{plan.lecciones} lecciones y {plan.controles} {plan.controles === 1 ? 'examen' : 'exámenes'} de control</strong>
            </li>
            <li>
              <span>Con 10 minutos al día</span>
              <strong>{plan.dias < 21 ? `unos ${plan.dias} días` : `unas ${plan.semanas} semanas`}</strong>
            </li>
          </ul>
          {config.gumroadUrl ? (
            <a className="boton boton-primario boton-grande" href={config.gumroadUrl} target="_blank" rel="noopener noreferrer">
              Desbloquear el curso completo
            </a>
          ) : (
            <button className="boton boton-primario boton-grande" disabled>
              Curso completo: muy pronto
            </button>
          )}
          <p className="nota">Pago único. La primera unidad es gratis.</p>
          <button className="enlace centrado" onClick={() => ir('desbloquear')}>Ya compré: tengo una clave</button>
        </section>
      )}

      {ultimaRevision && (
        <section className="tarjeta revision">
          <button className="enlace" onClick={() => setVerRevision(!verRevision)}>
            {verRevision ? 'Ocultar mis respuestas' : 'Revisar mis respuestas'}
          </button>
          {verRevision && (
            <ol>
              {ultimaRevision.map(({ pregunta, eleccion, acierto }) => (
                <li key={pregunta.id} className={acierto ? 'bien' : 'mal'}>
                  <p className="enunciado-chico">{pregunta.enunciado}</p>
                  {!acierto && <p>Tu respuesta: {pregunta.opciones[eleccion]}</p>}
                  <p>Correcta: <strong>{pregunta.opciones[pregunta.correcta]}</strong></p>
                  <p className="porque">{pregunta.porque}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <button className="boton boton-primario boton-grande" onClick={() => ir('ruta')}>
        {r.alcanzaB1 ? 'Ver la ruta' : `Empezar mi ruta en ${r.arranque}`}
      </button>
      <button className="enlace centrado" onClick={() => ir('examen')}>Repetir el examen</button>
    </main>
  )
}
