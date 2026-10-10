import { useEffect, useRef, useState } from 'react'
import { ir } from '../App.jsx'
import { cargarEstructura, cargarIndice } from '../lib/contenido.js'
import { leerProgreso, exportarProgreso, importarProgreso } from '../lib/progreso.js'
import { leccionHecha, nivelAbierto, siguienteLeccion, subnivelActual, subnivelesPlanos } from '../lib/ruta.js'
import { descargar } from '../lib/compartir.js'
import { hoy } from '../lib/logros.js'
import { etiquetaNivel } from '../lib/examenNivel.js'
import BarraNivel from '../componentes/BarraNivel.jsx'
import Marca from '../componentes/Marca.jsx'

export default function Ruta() {
  const [estructura, setEstructura] = useState(null)
  const [disponibles, setDisponibles] = useState(null)
  const [progreso, setProgreso] = useState(leerProgreso)
  const [aviso, setAviso] = useState('')
  const actualRef = useRef(null)
  const archivoRef = useRef(null)

  useEffect(() => {
    Promise.all([cargarEstructura(), cargarIndice()]).then(([e, d]) => {
      setEstructura(e)
      setDisponibles(d)
    })
  }, [])

  // Si el usuario va más adelante que A1.1, la ruta abre en su subnivel.
  useEffect(() => {
    if (actualRef.current && actualRef.current.dataset.id !== 'A1.1') actualRef.current.scrollIntoView({ block: 'start' })
  }, [estructura])

  if (!estructura || !disponibles) return <main className="pantalla cargando">Cargando…</main>

  const actual = subnivelActual(estructura, progreso)
  const siguiente = siguienteLeccion(estructura, progreso, disponibles)
  const subs = subnivelesPlanos(estructura)

  function exportar() {
    descargar(exportarProgreso(), `biuan-progreso-${hoy()}.json`)
    setAviso('Se descargó tu respaldo. Ábrelo en el otro dispositivo desde «Importar progreso».')
  }

  async function importar(e) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    if (!confirm('Esto reemplaza el progreso de este dispositivo por el del archivo. ¿Continuar?')) return
    try {
      setProgreso(importarProgreso(await archivo.text()))
      setAviso('Progreso importado.')
    } catch (err) {
      setAviso(err.message)
    }
  }

  return (
    <main className="pantalla ruta">
      <header className="cabecera">
        <Marca />
        {progreso.colocacion && (
          <button className="enlace" onClick={() => ir('resultado')}>
            Mi nivel: {etiquetaNivel(progreso.colocacion.nivel)}
          </button>
        )}
      </header>

      <div className="barra-fija">
        <BarraNivel sub={actual} progreso={progreso} />
      </div>
      {siguiente && (
        <button className="boton boton-primario boton-grande boton-continuar" onClick={() => ir(`leccion/${siguiente.id}`)}>
          Continuar: {siguiente.titulo}
        </button>
      )}

      {subs.map((sub) => {
        const abierto = nivelAbierto(sub.nivel, progreso)
        const conContenido = sub.lecciones.some((l) => disponibles.has(l.id))
        const control = estructura.controles.find((c) => c.despuesDe === sub.id)
        return (
          <section key={sub.id} data-id={sub.id} className={`subnivel ${abierto ? '' : 'cerrado'}`} ref={sub.id === actual.id ? actualRef : null}>
            <div className="subnivel-cabeza">
              <span className="chip-nivel">{sub.id}</span>
              <h2>{sub.titulo}</h2>
              {!conContenido && <span className="insignia">Próximamente</span>}
              {conContenido && !abierto && <span className="insignia">🔒</span>}
            </div>
            {sub.unidades.map((u) => (
              <div key={u.numero} className="unidad">
                <h3>Unidad {u.numero}. {u.titulo}{u.gratis && <span className="insignia insignia-gratis">Gratis</span>}</h3>
                <ol className="lecciones">
                  {u.lecciones.map((l) => {
                    const hecha = leccionHecha(progreso, l.id)
                    const hay = disponibles.has(l.id)
                    const puede = hay && abierto
                    const r = progreso.lecciones?.[l.id]
                    return (
                      <li key={l.id}>
                        <button
                          className={`nodo ${hecha ? 'hecha' : ''} ${puede ? '' : 'inactiva'} ${siguiente?.id === l.id ? 'siguiente' : ''}`}
                          disabled={!puede}
                          onClick={() => ir(`leccion/${l.id}`)}
                        >
                          <span className="nodo-num">{hecha ? '✓' : l.numero}</span>
                          <span className="nodo-texto">
                            <strong>{l.titulo}</strong>
                            <small>{hay ? l.gramatica : 'Próximamente'}</small>
                          </span>
                          {hecha && <span className="nodo-puntos">{r.mejor}/{r.total}</span>}
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </div>
            ))}
            {control && (
              <div className="nodo nodo-control inactiva">
                <span className="nodo-num">🏁</span>
                <span className="nodo-texto">
                  <strong>{control.titulo}</strong>
                  <small>Próximamente</small>
                </span>
              </div>
            )}
          </section>
        )
      })}

      <section className="tarjeta respaldo">
        <h2>Tu progreso</h2>
        <p className="nota">Se guarda solo en este dispositivo. Para pasarlo a otro, exporta un respaldo y ábrelo allá.</p>
        <div className="botones-compartir">
          <button className="boton" onClick={exportar}>Exportar progreso</button>
          <button className="boton" onClick={() => archivoRef.current?.click()}>Importar progreso</button>
        </div>
        <input ref={archivoRef} type="file" accept="application/json,.json" hidden onChange={importar} />
        {aviso && <p className="aviso">{aviso}</p>}
        <button className="enlace centrado" onClick={() => ir('examen')}>Repetir el examen de nivel</button>
      </section>
    </main>
  )
}
