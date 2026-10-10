import { ir } from '../App.jsx'

export default function Bloqueado({ que = 'Esta lección' }) {
  return (
    <main className="pantalla">
      <section className="tarjeta">
        <h1>🔒 {que} es parte del curso completo</h1>
        <p>La primera unidad es gratis. Desbloquea el curso para seguir avanzando hasta B1.</p>
      </section>
      <button className="boton boton-primario boton-grande" onClick={() => ir('desbloquear')}>Desbloquear el curso</button>
      <button className="enlace centrado" onClick={() => ir('ruta')}>Volver a mi ruta</button>
    </main>
  )
}
