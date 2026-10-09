import { Texto } from './Texto.jsx'
import BotonEscuchar from './BotonEscuchar.jsx'

// Pregunta de opción múltiple (con lectura o audio opcional).
// Si no hay voz, el audio se muestra como texto para leer.
export default function Pregunta({ pregunta, seleccion, onSeleccion, hayVoz, revelada = false }) {
  const audioComoTexto = pregunta.audio && !hayVoz
  return (
    <div className="pregunta">
      {pregunta.texto && (
        <blockquote className="lectura" lang="en">
          {pregunta.texto}
        </blockquote>
      )}
      {pregunta.audio && hayVoz && <BotonEscuchar texto={pregunta.audio} />}
      {audioComoTexto && (
        <>
          <p className="etiqueta">Lee el texto:</p>
          <blockquote className="lectura" lang="en">
            {pregunta.audio}
          </blockquote>
        </>
      )}
      <h2 className="enunciado">
        <Texto>{pregunta.enunciado}</Texto>
      </h2>
      <div className="opciones" role="radiogroup">
        {pregunta.opciones.map((op, i) => {
          let clase = 'opcion'
          if (seleccion === i) clase += ' elegida'
          if (revelada && i === pregunta.correcta) clase += ' correcta'
          if (revelada && seleccion === i && i !== pregunta.correcta) clase += ' incorrecta'
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={seleccion === i}
              className={clase}
              disabled={revelada}
              onClick={() => onSeleccion(i)}
            >
              {op}
            </button>
          )
        })}
      </div>
    </div>
  )
}
