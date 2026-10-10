import { avanceSubnivel } from '../lib/ruta.js'
import { metaDeHoy, rachaVigente } from '../lib/logros.js'

// Barra fija con el subnivel actual, su avance, XP, racha y meta del día.
export default function BarraNivel({ sub, progreso }) {
  const { hechas, total } = avanceSubnivel(sub, progreso)
  const racha = rachaVigente(progreso)
  const meta = metaDeHoy(progreso)
  return (
    <div className="barra-nivel">
      <div className="barra-nivel-fila">
        <span className="chip-nivel">{sub.id}</span>
        <div className="barra-nivel-avance">
          <div className="barra-nivel-texto">
            <strong>{sub.titulo}</strong>
            <span>{hechas}/{total}</span>
          </div>
          <div className="progreso" aria-label={`${hechas} de ${total} lecciones`}>
            <div style={{ width: `${(hechas / total) * 100}%` }} />
          </div>
        </div>
      </div>
      <div className="barra-nivel-datos">
        <span title="Racha de días seguidos" className={racha > 0 ? 'racha activa' : 'racha'}>🔥 {racha} {racha === 1 ? 'día' : 'días'}</span>
        <span title="Puntos de experiencia">⭐ {progreso.xp || 0} XP</span>
        <span title="Meta de hoy: 10 minutos" className={meta.hechas >= meta.meta ? 'meta cumplida' : 'meta'}>
          🎯 Hoy {Math.min(meta.hechas, meta.meta)}/{meta.meta}
        </span>
      </div>
    </div>
  )
}
