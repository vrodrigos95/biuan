// Ráfaga de puntitos alrededor del mensaje de acierto.
const COLORES = ['#8E5FCB', '#3F9E73', '#CC7C3B', '#C15C90', '#3E8FAE', '#B08B14']

export default function Celebracion() {
  const puntos = Array.from({ length: 12 }, (_, i) => {
    const angulo = (i / 12) * Math.PI * 2 + Math.random() * 0.4
    const distancia = 38 + Math.random() * 26
    return {
      x: Math.cos(angulo) * distancia,
      y: Math.sin(angulo) * distancia * 0.7,
      color: COLORES[i % COLORES.length],
      tam: 5 + Math.random() * 4,
    }
  })
  return (
    <span className="celebracion" aria-hidden>
      {puntos.map((p, i) => (
        <span key={i} className="chispa" style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, background: p.color, width: p.tam, height: p.tam }} />
      ))}
    </span>
  )
}
