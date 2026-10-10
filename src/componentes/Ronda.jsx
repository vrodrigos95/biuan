import { useState } from 'react'
import { estaLista, evaluar, respuestaCorrecta } from '../lib/ejercicios.js'
import Ejercicio from '../ejercicios/Ejercicio.jsx'

// Un ejercicio con "Comprobar" y retroalimentación inmediata. Se usa en lecciones y repasos.
// El padre debe darle una key distinta por ejercicio para reiniciar su estado.
export default function Ronda({ ej, etiqueta, avance, hayVoz, onSalir, onCalificar, onContinuar }) {
  const [respuesta, setRespuesta] = useState(null)
  const [revelado, setRevelado] = useState(null)

  function comprobar(valor = respuesta) {
    if (revelado) return
    const correcto = evaluar(ej, valor)
    setRevelado({ correcto })
    onCalificar(correcto)
  }

  return (
    <main className="pantalla examen leccion">
      <header className="barra-examen">
        <button className="cerrar" onClick={onSalir} aria-label="Salir">✕</button>
        <div className="progreso" aria-hidden>
          <div style={{ width: `${avance * 100}%` }} />
        </div>
      </header>
      {etiqueta && <p className="etiqueta etiqueta-repaso">{etiqueta}</p>}
      <Ejercicio ej={ej} respuesta={respuesta} setRespuesta={setRespuesta} revelado={!!revelado} hayVoz={hayVoz} onCompleto={comprobar} />

      {revelado ? (
        <div className={revelado.correcto ? 'retro retro-bien' : 'retro retro-mal'} role="status">
          <p className="retro-titulo">{revelado.correcto ? '¡Correcto!' : 'No exactamente'}</p>
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
