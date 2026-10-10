import Pregunta from '../componentes/Pregunta.jsx'
import Hueco from './Hueco.jsx'
import Ordenar from './Ordenar.jsx'
import Emparejar from './Emparejar.jsx'

export default function Ejercicio({ ej, respuesta, setRespuesta, revelado, hayVoz, onCompleto }) {
  switch (ej.tipo) {
    case 'hueco':
      return <Hueco ej={ej} respuesta={respuesta} setRespuesta={setRespuesta} revelado={revelado} />
    case 'ordenar':
      return <Ordenar ej={ej} respuesta={respuesta} setRespuesta={setRespuesta} revelado={revelado} />
    case 'emparejar':
      return <Emparejar ej={ej} respuesta={respuesta} setRespuesta={setRespuesta} revelado={revelado} onCompleto={onCompleto} />
    default: {
      // opcion, lectura y escucha comparten la vista de opción múltiple.
      const pregunta = { ...ej, enunciado: ej.enunciado || ej.pregunta }
      return <Pregunta pregunta={pregunta} seleccion={respuesta} onSeleccion={setRespuesta} hayVoz={hayVoz} revelada={revelado} />
    }
  }
}
