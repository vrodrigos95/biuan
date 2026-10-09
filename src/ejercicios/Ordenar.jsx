import { Texto } from '../componentes/Texto.jsx'

export default function Ordenar({ ej, respuesta, setRespuesta, revelado }) {
  const elegidas = respuesta || []
  const ficha = (id) => ej.fichas.find((f) => f.id === id)
  return (
    <div className="ejercicio">
      <h2 className="enunciado"><Texto>{ej.enunciado || 'Ordena las palabras.'}</Texto></h2>
      {ej.traduccion && <p className="traduccion">«{ej.traduccion}»</p>}
      <div className="linea-respuesta" lang="en">
        {elegidas.map((id) => (
          <button key={id} type="button" className="ficha" disabled={revelado} onClick={() => setRespuesta(elegidas.filter((x) => x !== id))}>
            {ficha(id).texto}
          </button>
        ))}
      </div>
      <div className="fichas" lang="en">
        {ej.fichas.map((f) => {
          const usada = elegidas.includes(f.id)
          return (
            <button
              key={f.id}
              type="button"
              className={usada ? 'ficha usada' : 'ficha'}
              disabled={usada || revelado}
              onClick={() => setRespuesta([...elegidas, f.id])}
            >
              {f.texto}
            </button>
          )
        })}
      </div>
    </div>
  )
}
