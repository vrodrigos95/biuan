import { useState } from 'react'
import { ir } from '../App.jsx'
import { getConfig } from '../lib/config.js'
import { activar, CLAVE_DEMO, modoLicencia, tieneAcceso } from '../lib/acceso.js'
import Marca from '../componentes/Marca.jsx'

export default function Desbloquear() {
  const config = getConfig()
  const [clave, setClave] = useState('')
  const [estado, setEstado] = useState(tieneAcceso() ? 'listo' : 'inicio')
  const [mensaje, setMensaje] = useState('')

  async function enviar(e) {
    e.preventDefault()
    setEstado('enviando')
    setMensaje('')
    try {
      await activar(clave)
      setEstado('listo')
    } catch (err) {
      setMensaje(err.message)
      setEstado('inicio')
    }
  }

  if (estado === 'listo') {
    return (
      <main className="pantalla">
        <header className="cabecera"><Marca /></header>
        <section className="tarjeta felicidades">
          <h1>¡Curso completo activado!</h1>
          <p>Ya tienes todas las lecciones, los exámenes de control y el simulacro en este dispositivo.</p>
        </section>
        <button className="boton boton-primario boton-grande" onClick={() => ir('ruta')}>Ir a mi ruta</button>
      </main>
    )
  }

  return (
    <main className="pantalla desbloquear">
      <header className="cabecera">
        <button className="enlace" onClick={() => history.length > 1 ? history.back() : ir('ruta')}>‹ Volver</button>
        <Marca />
      </header>
      <section className="tarjeta">
        <h1>Desbloquea el curso completo</h1>
        <p>La primera unidad es gratis. Con el curso completo tienes:</p>
        <ul className="incluye">
          <li>Las lecciones de A1, A2 y B1 (de cero a B1)</li>
          <li>Los exámenes de control con su constancia</li>
          <li>El simulacro tipo TOEFL con análisis de errores</li>
          <li>Repaso espaciado y uso sin conexión</li>
        </ul>
        <p className="nota">Pago único. Sin suscripciones.</p>
        {config.gumroadUrl ? (
          <a className="boton boton-primario boton-grande" href={config.gumroadUrl} target="_blank" rel="noopener noreferrer">
            Comprar el curso completo
          </a>
        ) : (
          <button className="boton boton-primario boton-grande" disabled>Compra disponible muy pronto</button>
        )}
      </section>

      <form className="tarjeta" onSubmit={enviar}>
        <h2>¿Ya lo compraste?</h2>
        <p className="nota">Escribe la clave de licencia que te llegó por correo de Gumroad. Solo se pide una vez en cada dispositivo.</p>
        <label className="campo">
          <span>Clave de licencia</span>
          <input
            type="text"
            value={clave}
            maxLength={64}
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
            onChange={(e) => setClave(e.target.value)}
          />
        </label>
        <button className="boton boton-secundario boton-ancho" type="submit" disabled={estado === 'enviando' || !clave.trim()}>
          {estado === 'enviando' ? 'Comprobando…' : 'Activar'}
        </button>
        {mensaje && <p className="aviso" role="alert">{mensaje}</p>}
        {modoLicencia() === 'demo' && <p className="nota">Versión de pruebas: usa la clave <strong>{CLAVE_DEMO}</strong>.</p>}
      </form>
    </main>
  )
}
