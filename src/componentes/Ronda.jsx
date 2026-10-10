import { useState } from 'react'
import { estaLista, evaluar, respuestaCorrecta } from '../lib/ejercicios.js'
import { cambiarSonido, sonarAcierto, sonidoActivo, vibrarAcierto } from '../lib/sonido.js'
import Ejercicio from '../ejercicios/Ejercicio.jsx'
import Celebracion from './Celebracion.jsx'

const FRASES = ['¡Correcto!', '¡Bien hecho!', '¡Exacto!', '¡Así se dice!', '¡Muy bien!']

// Mensaje según cuántas lleva seguidas.
function titulo(racha) {
  if (racha >= 8) return `¡Imparable! ${racha} seguidas`
  if (racha >= 5) return `¡En racha! ${racha} seguidas`
  if (racha >= 3) return `¡${racha} seguidas!`
  return FRASES[Math.floor(Math.random() * FRASES.length)]
}

// Un ejercicio con "Comprobar" y retroalimentación inmediata. Se usa en lecciones y repasos.
// El padre debe darle una key distinta por ejercicio para reiniciar su estado.
// racha: aciertos seguidos antes de este ejercicio; xp: puntos de la sesión; xpPorAcierto: lo que vale este ejercicio.
export default function Ronda({ ej, etiqueta, avance, hayVoz, racha = 0, xp = 0, xpPorAcierto = 0, onSalir, onCalificar, onContinuar }) {
  const [respuesta, setRespuesta] = useState(null)
  const [revelado, setRevelado] = useState(null)
  const [sonido, setSonido] = useState(sonidoActivo)
  const [xpAlEntrar] = useState(xp) // el contador solo salta cuando sube en este ejercicio

  function comprobar(valor = respuesta) {
    if (revelado) return
    const correcto = evaluar(ej, valor)
    setRevelado({ correcto, titulo: correcto ? titulo(racha + 1) : 'No exactamente' })
    if (correcto) {
      sonarAcierto(racha + 1)
      vibrarAcierto()
    }
    onCalificar(correcto)
  }

  function alternarSonido() {
    cambiarSonido(!sonido)
    setSonido(!sonido)
  }

  return (
    <main className="pantalla examen leccion">
      <header className="barra-examen">
        <button className="cerrar" onClick={onSalir} aria-label="Salir">✕</button>
        <div className="progreso" aria-hidden>
          <div style={{ width: `${avance * 100}%` }} />
        </div>
        <button className="boton-sonido" onClick={alternarSonido} aria-label={sonido ? 'Silenciar' : 'Activar sonido'}>
          {sonido ? '🔊' : '🔇'}
        </button>
        <span key={xp} className={`xp-sesion ${xp > xpAlEntrar ? 'salto' : ''}`} aria-label={`${xp} XP en esta sesión`}>⭐ {xp}</span>
      </header>
      {etiqueta && <p className="etiqueta etiqueta-repaso">{etiqueta}</p>}
      <Ejercicio ej={ej} respuesta={respuesta} setRespuesta={setRespuesta} revelado={!!revelado} hayVoz={hayVoz} onCompleto={comprobar} />

      {revelado ? (
        <div className={revelado.correcto ? 'retro retro-bien' : 'retro retro-mal'} role="status">
          <div className="retro-cabeza">
            <p className="retro-titulo">
              {revelado.titulo}
              {revelado.correcto && <Celebracion />}
            </p>
            {revelado.correcto && xpPorAcierto > 0 && <span className="mas-xp">+{xpPorAcierto} XP</span>}
          </div>
          {!revelado.correcto && (
            <p>Respuesta correcta: <strong lang="en">{respuestaCorrecta(ej)}</strong></p>
          )}
          {ej.audio && hayVoz && <p className="retro-audio">Se dijo: <em lang="en">{ej.audio}</em></p>}
          <p className="retro-porque">{ej.porque}</p>
          <button className="boton boton-grande boton-retro" onClick={onContinuar}>Continuar</button>
        </div>
      ) : (
        <div className="acciones-fijas">
          <button className="boton boton-primario boton-grande" disabled={!estaLista(ej, respuesta)} onClick={() => comprobar()}>
            Comprobar
          </button>
        </div>
      )}
    </main>
  )
}
