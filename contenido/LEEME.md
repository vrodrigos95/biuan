# Contenido de Biuan

Todo lo que se estudia en la app vive en esta carpeta. Para agregar o corregir
contenido solo se editan estos JSON; no hace falta tocar código.

Antes de publicar, corre `npm run validar`: revisa ids repetidos, respuestas
fuera de rango, opciones duplicadas y campos que falten.

## Examen de nivel (`examen-nivel/a1.json`, `a2.json`, `b1.json`, `b2.json`)

Cada archivo tiene `"preguntas": [...]`. Una pregunta:

```json
{
  "id": "A2-014",
  "nivel": "A2",
  "habilidad": "gramatica",
  "tipo": "opcion",
  "enunciado": "Yesterday I ___ to the cinema.",
  "opciones": ["went", "go", "gone", "going"],
  "correcta": 0,
  "porque": "Yesterday pide pasado simple; el pasado de go es went."
}
```

- `habilidad`: `gramatica`, `vocabulario`, `lectura` o `escucha`.
- `lectura` lleva además `"texto"` (el pasaje en inglés).
- `escucha` lleva además `"audio"` (lo que dice la voz). La pregunta debe ser de
  comprensión, porque si el navegador no tiene voz se muestra el texto.
- `correcta` es la posición de la opción correcta, empezando en 0. La app
  revuelve las opciones, así que no importa en qué lugar la pongas.
- Cada nivel necesita al menos 6 preguntas; la meta es unas 25 por nivel.

## Lecciones (`lecciones/L01.json` … `L72.json`)

El nombre del archivo es el id de la lección. Si el archivo existe, la lección
aparece disponible; si no, se muestra como "próximamente". Ver `lecciones/L04.json`
como ejemplo completo.

```json
{
  "id": "L04", "subnivel": "A1.1", "unidad": 1, "titulo": "¿De dónde eres?",
  "explicacion": [ ...bloques... ],
  "ejercicios": [ ...unos 12 ejercicios... ]
}
```

`subnivel` y `unidad` deben coincidir con `estructura.json`.

### Bloques de la explicación
- `{ "tipo": "texto", "md": "Texto con **negritas** y *cursivas*." }`
- `{ "tipo": "tip", "md": "Consejo que aparece resaltado." }`
- `{ "tipo": "ejemplo", "en": "I'm from Mexico.", "es": "Soy de México." }` (con botón para escuchar)
- `{ "tipo": "tabla", "columnas": ["Inglés", "Español"], "filas": [["…", "…"]] }` (`columnas` es opcional)

### Ejercicios
Todos llevan `id` (único en la lección), `tipo` y `porque` (la explicación en español
que se ve al responder). En los de opciones, `correcta` es la posición empezando en 0;
la app revuelve las opciones.

| tipo | campos |
|---|---|
| `opcion` | `enunciado`, `opciones`, `correcta` |
| `hueco` para escribir | `frase` con un `___`, `aceptadas` (todas las formas válidas, p. ej. `["don't", "do not"]`), `pista` opcional |
| `hueco` para tocar | `frase` con un `___`, `opciones`, `correcta` |
| `ordenar` | `respuesta` (palabras en el orden correcto), `traduccion`, `distractores` opcional |
| `emparejar` | `pares`: de 2 a 6 parejas `["Mexico", "Mexican"]` |
| `lectura` | `texto` (en inglés), `pregunta`, `opciones`, `correcta` |
| `escucha` | `audio` (lo que dice la voz), `pregunta`, `opciones`, `correcta` |

Reglas:
- Una sola respuesta válida por ejercicio. En `ordenar`, que solo exista un orden
  posible (la mayúscula inicial y el punto final ayudan).
- En `escucha` la pregunta debe ser de comprensión: si el navegador no tiene voz,
  se muestra el audio como texto.
- Al escribir, no importan mayúsculas, espacios de más ni el punto final.
- Lo que el usuario falla regresa una vez al final de la lección.
