import { useEffect, useState } from 'react'
import { Texto } from '../componentes/Texto.jsx'

// Se resuelve sola al completar todas las parejas.
export default function Emparejar({ ej, respuesta, setRespuesta, revelado, onCompleto }) {
  const estado = respuesta || { hechos: [], errores: 0, completo: false }
  const [izq, setIzq] = useState(null)
  const [der, setDer] = useState(null)
  const [fallo, setFallo] = useState(null)

  useEffect(() => {
    if (izq === null || der === null) return
    if (izq === der) {
      const hechos = [...estado.hechos, izq]
      const nuevo = { ...estado, hechos, completo: hechos.length === ej.pares.length }
      setRespuesta(nuevo)
      if (nuevo.completo) onCompleto?.(nuevo)
    } else {
      setRespuesta({ ...estado, errores: estado.errores + 1 })
      setFallo({ izq, der })
      setTimeout(() => setFallo(null), 500)
    }
    setIzq(null)
    setDer(null)
  }, [izq, der])

  const boton = (item, lado, sel, setSel) => {
    const hecho = estado.hechos.includes(item.id)
    let clase = 'ficha ficha-par'
    if (hecho) clase += ' correcta'
    else if (sel === item.id) clase += ' elegida'
    if (fallo && fallo[lado] === item.id) clase += ' incorrecta'
    return (
      <button key={item.id} type="button" className={clase} disabled={hecho || revelado} onClick={() => setSel(item.id)}>
        {item.texto}
      </button>
    )
  }

  return (
    <div className="ejercicio">
      <h2 className="enunciado"><Texto>{ej.enunciado || 'Une cada palabra con su pareja.'}</Texto></h2>
      <div className="parejas">
        <div className="columna">{ej.izquierda.map((it) => boton(it, 'izq', izq, setIzq))}</div>
        <div className="columna">{ej.derecha.map((it) => boton(it, 'der', der, setDer))}</div>
      </div>
    </div>
  )
}
