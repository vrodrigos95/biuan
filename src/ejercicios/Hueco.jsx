import { Texto } from '../componentes/Texto.jsx'

function Frase({ frase, relleno }) {
  const [antes, despues] = frase.split('___')
  return (
    <p className="frase" lang="en">
      {antes}
      <span className={relleno ? 'hueco lleno' : 'hueco'}>{relleno || ' '}</span>
      {despues}
    </p>
  )
}

export default function Hueco({ ej, respuesta, setRespuesta, revelado }) {
  if (ej.opciones) {
    return (
      <div className="ejercicio">
        <h2 className="enunciado"><Texto>{ej.enunciado || 'Completa la frase.'}</Texto></h2>
        <Frase frase={ej.frase} relleno={Number.isInteger(respuesta) ? ej.opciones[respuesta] : ''} />
        <div className="fichas">
          {ej.opciones.map((op, i) => {
            let clase = 'ficha'
            if (respuesta === i) clase += ' elegida'
            if (revelado && i === ej.correcta) clase += ' correcta'
            if (revelado && respuesta === i && i !== ej.correcta) clase += ' incorrecta'
            return (
              <button key={i} type="button" className={clase} disabled={revelado} onClick={() => setRespuesta(i)}>
                {op}
              </button>
            )
          })}
        </div>
      </div>
    )
  }
  return (
    <div className="ejercicio">
      <h2 className="enunciado"><Texto>{ej.enunciado || 'Escribe la palabra que falta.'}</Texto></h2>
      <Frase frase={ej.frase} relleno={respuesta || ''} />
      {ej.pista && <p className="nota">Pista: {ej.pista}</p>}
      <input
        className="entrada"
        type="text"
        lang="en"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck="false"
        maxLength={60}
        placeholder="Escribe aquí"
        value={respuesta || ''}
        disabled={revelado}
        onChange={(e) => setRespuesta(e.target.value)}
      />
    </div>
  )
}
