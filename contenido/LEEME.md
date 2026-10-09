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
