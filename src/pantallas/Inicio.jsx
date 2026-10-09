import { useEffect } from 'react'
import { ir, leerReto } from '../App.jsx'
import { cargarBancoNivel, cargarEstructura } from '../lib/contenido.js'
import { leerProgreso } from '../lib/progreso.js'
import { etiquetaNivel } from '../lib/examenNivel.js'
import { prepararVoz } from '../lib/voz.js'
import Marca from '../componentes/Marca.jsx'

export default function Inicio() {
  const reto = leerReto()
  const { colocacion } = leerProgreso()

  useEffect(() => {
    // Precarga para que la primera pregunta aparezca al instante.
    cargarBancoNivel().catch(() => {})
    cargarEstructura().catch(() => {})
    prepararVoz()
  }, [])

  return (
    <main className="pantalla inicio">
      <Marca grande />
      <p className="lema">Inglés de cero a B1</p>

      {reto !== null && (
        <div className="aviso aviso-reto">
          <strong>Te retaron.</strong> Tu amigo sacó <strong>{reto} puntos</strong> en el examen de nivel. ¿Puedes superarlo?
        </div>
      )}

      <section className="tarjeta llamado">
        <h1>¿Qué nivel de inglés tienes?</h1>
        <p>Descúbrelo gratis con un examen que se adapta a ti: empieza fácil y sube de dificultad.</p>
        <ul className="datos">
          <li>Sin registro</li>
          <li>Unos 7 minutos</li>
          <li>Gramática, vocabulario, lectura y listening</li>
        </ul>
        <button className="boton boton-primario boton-grande" onClick={() => ir('examen')}>
          Empezar examen de nivel
        </button>
        <p className="nota">Usa audífonos o sube el volumen: hay preguntas para escuchar.</p>
      </section>

      {colocacion && (
        <button className="tarjeta ultimo" onClick={() => ir('resultado')}>
          <span>Tu último resultado</span>
          <strong>{etiquetaNivel(colocacion.nivel)}</strong>
          <span className="flecha" aria-hidden>›</span>
        </button>
      )}

      <button className="tarjeta ultimo" onClick={() => ir('leccion/L04')}>
        <span>Lección de muestra: ¿De dónde eres?</span>
        <span className="flecha" aria-hidden>›</span>
      </button>

      <p className="pie">El resultado es una estimación de nivel. Biuan no emite certificaciones oficiales.</p>
    </main>
  )
}
