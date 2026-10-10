# Respuesta de Claude Code — proyecto Biuan

Estado: los tres puntos previos están respondidos, Rodrigo aprobó el plan y la **etapa 1 (examen de nivel) ya está construida** en la rama `claude/trusting-wozniak-pyomdk` del repo `vrodrigos95/biuan`.

---

## 1. Licencias de Gumroad

**Cómo funciona.** El endpoint PHP en Hostinger llama a `POST https://api.gumroad.com/v2/licenses/verify` con `product_id`, `license_key` e `increment_uses_count`. No requiere token de acceso. Gumroad responde con:
- `success`
- `uses`: veces que se ha activado la clave
- `purchase`: incluye `refunded`, `chargebacked`, `disputed` y `test`

No se pudo hacer una llamada real porque el entorno de Claude Code no tiene salida a gumroad.com. Se confirmará con una clave de prueba en la etapa 6.

**Qué hace el PHP:**
- Rechaza la clave si fue reembolsada, si tiene contracargo o disputa, o si pasa del límite de dispositivos.
- Si es válida, entrega un token firmado con un secreto del servidor. Con ese token se descargan las lecciones de pago, que viven fuera de `public_html`.
- Con internet, renueva el token cada 30 días sin sumar un dispositivo. Sin conexión, la app sigue funcionando.

**Datos de Gumroad que se pedirán en la etapa 6** (ahora no hacen falta):
1. Activar en el producto la opción *"Generate a unique license key per sale"*.
2. El `product_id`, que aparece en esa misma sección.
3. La URL del producto, para el botón de compra.
4. Una clave real de prueba (comprando con un cupón del 100 %).

No se necesitan el token de API ni webhooks.

**Decisiones que Rodrigo ya tomó:**
- Hasta 3 dispositivos por clave.
- Rate limit: 5 intentos cada 15 minutos y 20 al día por IP.
- Si hay reembolso, se bloquean las lecciones de pago al renovar el token.
- El dominio se decide después; queda como dato configurable.

---

## 2. Cobertura de A1: "Bases del Inglés" contra las lecciones marcadas "Revisar"

"Bases del Inglés" tiene 6 temas: *to be*, pronombres y posesivos, artículos, plurales y contables, presente simple, y un vocabulario de 23 sustantivos. Cada tema trae unos 15 ejercicios.

| Estado | Lecciones |
|---|---|
| **Cubiertas** (6) | 2 pronombres + *to be* afirmativo · 5 a/an/the · 7 posesivos · 13 presente simple · 14 tercera persona (falta explicar la regla *-ies*, solo aparece en ejercicios) · 15 *don't/doesn't* |
| **Parciales** (3) | 3: el negativo y la pregunta de *to be* ocupan una línea; faltan las respuestas cortas y los estados de ánimo · 6: hay plurales pero no *this/that/these/those* · 16: hay preguntas con *do/does*, pero faltan respuestas cortas y vocabulario de transporte |
| **Faltan** (11) | 1 saludos y alfabeto · 4 *where from*, países, números 0–20 · 8 *have/has*, números 21–100 · 9 *there is/are* · 10 preposiciones de lugar · 11 hora y fecha · 12 *in/on/at* de tiempo · 17 adverbios de frecuencia · 18 *like* + *-ing* · 19 *can* · 20 preguntas *Wh-* |

Notas:
- El tema de contables, *some/any* y *much/many* sirve para las lecciones 21 y 22, marcadas "Nuevo".
- Casi no hay vocabulario por lección.
- Los ejercicios para completar y los de vocabulario no traen explicación del porqué; habrá que escribirla.
- En "Camino a B1", el simulacro tiene 75 preguntas, pero cada intento usa 10 al azar en 5 minutos. Solo cubre gramática: no hay lectura ni listening.
- Algunas preguntas de ese simulacro tienen dos respuestas válidas: *must not / can't*, *will be / going to* con *forecast* y *maybe I ___ (stay)*. Se corregirán al migrarlo.
- La lección 56 pide *however* y *because of*, que el curso no tiene.

---

## 3. Plan técnico

### Carpetas
```
biuan/
├─ src/                 motor React + Vite (no se toca para agregar contenido)
├─ public/config.json   URL base del contenido y de la API (cambia de entorno sin recompilar)
├─ contenido/           LO ÚNICO QUE SE EDITA
│  ├─ estructura.json   6 subniveles, 18 unidades, 72 títulos (ya generado del temario)
│  ├─ examen-nivel/a1.json · a2.json · b1.json · b2.json
│  ├─ lecciones/L01.json … L72.json
│  ├─ controles/A1.json · A2.json · B1.json
│  └─ simulacro.json
├─ servidor/            PHP para Hostinger (etapa 6)
└─ scripts/validar.mjs  revisa los JSON antes de publicar (npm run validar)
```
**Agregar una lección** es crear su archivo, por ejemplo `lecciones/L05.json`. Si existe, aparece disponible en la ruta; si no, se muestra como "próximamente". Ningún otro archivo hay que tocar.

### Lección (`lecciones/L04.json`) — formato acordado, se implementa en la etapa 2
```json
{
  "id": "L04", "subnivel": "A1.1", "unidad": 1, "titulo": "¿De dónde eres?",
  "explicacion": [
    { "tipo": "texto", "md": "Para preguntar el origen se usa **Where … from?**" },
    { "tipo": "tabla", "columnas": ["Inglés", "Español"], "filas": [["Where are you from?", "¿De dónde eres?"]] },
    { "tipo": "ejemplo", "en": "I'm from Mexico.", "es": "Soy de México." },
    { "tipo": "tip", "md": "Nunca digas *I am of Mexico*." }
  ],
  "ejercicios": [
    { "id": "e01", "tipo": "opcion", "enunciado": "She ___ from Peru.", "opciones": ["is", "are", "am"], "correcta": 0, "porque": "Con she se usa is." },
    { "id": "e02", "tipo": "hueco", "frase": "Where ___ they from?", "aceptadas": ["are"], "porque": "They va con are." },
    { "id": "e03", "tipo": "hueco", "frase": "I ___ from Chile.", "opciones": ["am", "is"], "correcta": 0, "porque": "Con I se usa am." },
    { "id": "e04", "tipo": "ordenar", "respuesta": ["Where", "is", "he", "from?"], "traduccion": "¿De dónde es él?", "porque": "En pregunta, is va antes del sujeto." },
    { "id": "e05", "tipo": "emparejar", "pares": [["Mexico", "Mexican"], ["Spain", "Spanish"]], "porque": "País y nacionalidad." },
    { "id": "e06", "tipo": "lectura", "texto": "Hi, I'm Tom. I'm from Canada, but I live in Mexico.", "pregunta": "¿De dónde es Tom?", "opciones": ["De Canadá", "De México", "De Estados Unidos"], "correcta": 0, "porque": "I'm from Canada." },
    { "id": "e07", "tipo": "escucha", "audio": "My sister is from Brazil.", "pregunta": "¿De dónde es la hermana?", "opciones": ["De Brasil", "De Bolivia", "De Portugal"], "correcta": 0, "porque": "Se escucha from Brazil." }
  ]
}
```

Reglas para escribir ejercicios:
- **Cantidad y explicación:** unos 12 ejercicios por lección. Todos llevan `porque`, en español.
- **`correcta`:** es la posición de la opción correcta, empezando en 0. La app revuelve las opciones al mostrarlas.
- **`hueco`:**
  - Sin `opciones`, el usuario escribe la respuesta. En `aceptadas` van todas las formas válidas, por ejemplo `"don't"` y `"do not"`.
  - Con `opciones`, el usuario toca la respuesta.
- **`ordenar`:** las palabras van en el orden correcto. La app las desordena. Solo debe existir un orden válido.
- **`escucha`:** la pregunta debe ser de comprensión, no "¿qué escuchaste?". Si el navegador no tiene voz, el audio se muestra como texto y el ejercicio se vuelve de lectura.
- **Una sola respuesta válida:** ningún ejercicio puede tener dos.

### Pregunta del examen de nivel — ya implementado
```json
{ "id": "A2-014", "nivel": "A2", "habilidad": "gramatica", "tipo": "opcion",
  "enunciado": "Yesterday I ___ to the cinema.", "opciones": ["went", "go", "gone", "going"],
  "correcta": 0, "porque": "Yesterday pide pasado simple; el pasado de go es went." }
```
- `habilidad` puede ser `gramatica`, `vocabulario`, `lectura` (lleva además `"texto"`) o `escucha` (lleva además `"audio"`).
- Hay un archivo por nivel: A1, A2, B1 y B2. La meta es unas 25 preguntas por nivel, alrededor de 100 en total.
- Hoy hay 48 de muestra, 12 por nivel.

**Cómo funciona el examen:**
- Bloques de 6 preguntas por nivel, de A1 a B2, con un máximo de 24.
- Con 4 aciertos en el bloque sube de nivel; con 3 fallos en el bloque termina.
- El puntaje va de 0 a 100: cada nivel vale 25 puntos según sus aciertos.

### Examen de control (`controles/A1.json`) — etapa 4
```json
{ "id": "A1", "titulo": "Examen de control A1", "minutos": 20, "aprobacion": 70,
  "requiere": ["A1.1", "A1.2"], "desbloquea": "A2.1", "espera_horas_reintento": 12,
  "secciones": [
    { "habilidad": "gramatica", "preguntas": [ /* mismos tipos de ejercicio que las lecciones */ ] }
  ] }
```

### Simulacro (`simulacro.json`) — migración del curso existente
```json
{ "titulo": "Simulacro tipo TOEFL",
  "modos": [ { "id": "practica", "preguntas": 10, "minutos": 5 },
             { "id": "completo", "preguntas": 75, "minutos": 60 } ],
  "temas": { "pascont": "Pasado continuo", "futuro": "Futuro (will / going to)" },
  "preguntas": [ { "id": "S001", "tema": "pascont", "tipo": "opcion", "enunciado": "…",
                   "opciones": ["…"], "correcta": 1, "porque": "…" } ] }
```
Los dos modos los aprobó Rodrigo.

### Progreso (guardado en el celular, sin cuentas)
```json
{ "version": 1, "dispositivo": "uuid", "nombre": "Ana",
  "colocacion": { "fecha": "…", "nivel": "A2", "arranque": "B1.1", "puntaje": 50 },
  "subnivelActual": "B1.1",
  "lecciones": { "L01": { "aciertos": 11, "total": 12, "fecha": "…" } },
  "controles": { "A1": { "aprobado": true, "puntaje": 82, "fecha": "…", "intentos": 1 } },
  "simulacro": [ { "fecha": "…", "modo": "completo", "puntaje": 61, "porTema": { "futuro": [9, 15] } } ],
  "xp": 340, "racha": { "actual": 5, "mejor": 9, "ultimoDia": "…" },
  "repaso": { "L04#e02": { "caja": 2, "proxima": "…" } } }
```
- **Repaso tipo Leitner:** 5 cajas, con 1, 2, 4, 8 y 16 días. Un fallo regresa el ejercicio a la caja 1.
- **Exportar e importar:** llevan todo excepto la licencia, que es por dispositivo.
- **Constancia:** se genera en PDF (aprobado por Rodrigo).
- **Diseño:** la paleta pastel y las tipografías Baloo 2 y Nunito de sus cursos (aprobado).

---

## Avisos de seguridad
- **El repo es público.** Los dos cursos de `referencia/` ya están expuestos, y quedan en el historial de git aunque se borren. Las lecciones de pago **no deben subirse a este repo**; irán directo a Hostinger. Hasta la etapa 8 solo habrá contenido de muestra.
- **Secretos:** no hay ninguno en el repo. Se revisó todo el historial de git.

## Lo que sigue
- **Probar la etapa 1 en el celular:**
  1. En GitHub, Settings → Pages → Source → "GitHub Actions".
  2. Pasar la rama a `main`. La app queda en `https://vrodrigos95.github.io/biuan/`.
- **Siguiente etapa:** la 2, el motor de lecciones con una lección de muestra.
