import { Texto } from './Texto.jsx'
import { hablar } from '../lib/voz.js'

export default function Explicacion({ bloques, hayVoz }) {
  return (
    <div className="explicacion">
      {bloques.map((b, i) => {
        switch (b.tipo) {
          case 'texto':
            return <p key={i}><Texto>{b.md}</Texto></p>
          case 'tip':
            return (
              <div key={i} className="tip">
                <strong>Tip</strong> <Texto>{b.md}</Texto>
              </div>
            )
          case 'ejemplo':
            return (
              <div key={i} className="ejemplo">
                <div>
                  <p className="ejemplo-en" lang="en">{b.en}</p>
                  {b.es && <p className="ejemplo-es">{b.es}</p>}
                </div>
                {hayVoz && (
                  <button type="button" className="boton-mini" aria-label="Escuchar" onClick={() => hablar(b.en)}>
                    🔊
                  </button>
                )}
              </div>
            )
          case 'tabla':
            return (
              <div key={i} className="tabla-envoltura">
                <table className="tabla">
                  {b.columnas && (
                    <thead>
                      <tr>{b.columnas.map((c, j) => <th key={j}>{c}</th>)}</tr>
                    </thead>
                  )}
                  <tbody>
                    {b.filas.map((fila, j) => (
                      <tr key={j}>{fila.map((celda, k) => <td key={k}><Texto>{celda}</Texto></td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
