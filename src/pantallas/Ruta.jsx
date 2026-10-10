import { useEffect, useRef, useState } from 'react'
import { ir } from '../App.jsx'
import { cargarEstructura, cargarIndice } from '../lib/contenido.js'
import { leerProgreso, exportarProgreso, importarProgreso } from '../lib/progreso.js'
import { leccionHecha, leccionPendienteAbierta, nivelAbierto, siguienteLeccion, subnivelActual, subnivelesPlanos } from '../lib/ruta.js'
import { descargar } from '../lib/compartir.js'
import { hoy } from '../lib/logros.js'
import { resumenRepaso } from '../lib/repaso.js'
import { modoLicencia, puedeAbrirLeccion, tieneAcceso } from '../lib/acceso.js'
import { etiquetaNivel } from '../lib/examenNivel.js'
import BarraNivel from '../componentes/BarraNivel.jsx'
import Marca from '../componentes/Marca.jsx'
import Instalar from '../componentes/Instalar.jsx'

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
  const pendiente = siguiente ? null : leccionPendienteAbierta(estructura, progreso, disponibles)
  const repaso = resumenRepaso(progreso, (o) => tieneAcceso(progreso) || (/^L\d{2}$/.test(o) && puedeAbrirLeccion(estructura, o, progreso)))

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
      {repaso.deHoy > 0 ? (
        <button className="tarjeta repaso-hoy" onClick={() => ir('repaso')}>
          <span className="repaso-icono" aria-hidden>🔁</span>
          <span className="nodo-texto">
            <strong>Repaso de hoy</strong>
            <small>{Math.min(repaso.deHoy, 15)} ejercicios que fallaste antes · {Math.min(repaso.deHoy, 15) <= 4 ? 'un minuto' : `unos ${Math.round(Math.min(repaso.deHoy, 15) / 3)} minutos`}</small>
          </span>
          <span className="flecha" aria-hidden>›</span>
        </button>
      ) : repaso.total > 0 ? (
        <p className="nota repaso-proximo">🔁 Próximo repaso: {repaso.proxima === hoy() ? 'hoy' : new Date(repaso.proxima + 'T12:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} · {repaso.total} {repaso.total === 1 ? 'ejercicio' : 'ejercicios'} en repaso</p>
      ) : null}
      {siguiente ? (
        <button
          className="boton boton-primario boton-grande boton-continuar"
          onClick={() => ir(puedeAbrirLeccion(estructura, siguiente.id, progreso) ? `leccion/${siguiente.id}` : 'desbloquear')}
        >
          {puedeAbrirLeccion(estructura, siguiente.id, progreso) ? `Continuar: ${siguiente.titulo}` : '🔒 Desbloquea el curso para continuar'}
        </button>
      ) : (
        <div className="aviso aviso-ruta">
          {pendiente ? (
            <>
              <p>
                <strong>Tu subnivel ({actual.id}) todavía no tiene lecciones.</strong> Estamos preparándolas. Mientras tanto,
                puedes repasar las de niveles anteriores.
              </p>
              <button className="boton boton-ancho" onClick={() => ir(`leccion/${pendiente.id}`)}>
                Repasar: {pendiente.titulo}
              </button>
            </>
          ) : (
            <p>
              <strong>¡Hiciste todas las lecciones disponibles!</strong> Pronto llegarán más. Puedes repetir cualquiera para
              reforzar.
            </p>
          )}
        </div>
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
                    const bloqueada = puede && !puedeAbrirLeccion(estructura, l.id, progreso)
                    const r = progreso.lecciones?.[l.id]
                    return (
                      <li key={l.id}>
                        <button
                          className={`nodo ${hecha ? 'hecha' : ''} ${puede ? '' : 'inactiva'} ${siguiente?.id === l.id ? 'siguiente' : ''}`}
                          disabled={!puede}
                          onClick={() => ir(bloqueada ? 'desbloquear' : `leccion/${l.id}`)}
                        >
                          <span className="nodo-num">{hecha ? '✓' : bloqueada ? '🔒' : l.numero}</span>
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
            {control && (() => {
              const hay = disponibles.has(`control:${control.id}`)
              const registro = progreso.controles?.[control.id]
              return (
                <button
                  className={`nodo nodo-control ${hay && abierto ? '' : 'inactiva'} ${registro?.aprobado ? 'hecha' : ''}`}
                  disabled={!hay || !abierto}
                  onClick={() => ir(tieneAcceso(progreso) ? `control/${control.id}` : 'desbloquear')}
                >
                  <span className="nodo-num">{registro?.aprobado ? '✓' : hay && !tieneAcceso(progreso) ? '🔒' : '🏁'}</span>
                  <span className="nodo-texto">
                    <strong>{control.titulo}</strong>
                    <small>{!hay ? 'Próximamente' : registro?.aprobado ? 'Aprobado · descarga tu constancia' : 'Apruébalo para abrir el siguiente nivel'}</small>
                  </span>
                  {registro?.aprobado && <span className="nodo-puntos">{registro.puntaje}%</span>}
                </button>
              )
            })()}
            {sub.id === 'B1.2' && disponibles.has('simulacro') && (
              <button className="nodo nodo-control" onClick={() => ir(tieneAcceso(progreso) ? 'simulacro' : 'desbloquear')}>
                <span className="nodo-num">{tieneAcceso(progreso) ? '⏱️' : '🔒'}</span>
                <span className="nodo-texto">
                  <strong>Simulacro tipo TOEFL</strong>
                  <small>{progreso.simulacro?.length ? `Mejor resultado: ${Math.max(...progreso.simulacro.map((h) => h.puntaje))}%` : 'Práctica de 10 preguntas o examen completo de 75'}</small>
                </span>
              </button>
            )}
          </section>
        )
      })}

      <Instalar />

      <section className="tarjeta respaldo">
        <h2>Tu progreso</h2>
        <p className="nota">Se guarda solo en este dispositivo. Para pasarlo a otro, exporta un respaldo y ábrelo allá.</p>
        <div className="botones-compartir">
          <button className="boton" onClick={exportar}>Exportar progreso</button>
          <button className="boton" onClick={() => archivoRef.current?.click()}>Importar progreso</button>
        </div>
        <input ref={archivoRef} type="file" accept="application/json,.json" hidden onChange={importar} />
        {aviso && <p className="aviso">{aviso}</p>}
        {modoLicencia() !== 'abierto' && (
          <p className="licencia-estado">
            {tieneAcceso(progreso) ? '✓ Curso completo activado en este dispositivo' : (
              <button className="enlace" onClick={() => ir('desbloquear')}>Desbloquear el curso completo / tengo una clave</button>
            )}
          </p>
        )}
        <button className="enlace centrado" onClick={() => ir('examen')}>Repetir el examen de nivel</button>
        <p className="version">Versión {__VERSION__}</p>
      </section>
    </main>
  )
}
