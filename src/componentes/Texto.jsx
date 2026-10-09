// Convierte **negritas** y *cursivas* en elementos React, sin insertar HTML.
export function Texto({ children }) {
  const fuente = String(children ?? '')
  const partes = []
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let ultimo = 0
  let m
  let k = 0
  while ((m = re.exec(fuente))) {
    if (m.index > ultimo) partes.push(fuente.slice(ultimo, m.index))
    partes.push(m[1] !== undefined ? <strong key={k++}>{m[1]}</strong> : <em key={k++}>{m[2]}</em>)
    ultimo = re.lastIndex
  }
  if (ultimo < fuente.length) partes.push(fuente.slice(ultimo))
  return <>{partes}</>
}
