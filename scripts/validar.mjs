// Revisa el contenido antes de publicar. Uso: npm run validar
import fs from 'node:fs'
import path from 'node:path'

const RAIZ = path.resolve('contenido')
const errores = []
const avisos = []
const err = (archivo, msg) => errores.push(`✗ ${archivo}: ${msg}`)
const aviso = (archivo, msg) => avisos.push(`! ${archivo}: ${msg}`)

function leer(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(RAIZ, rel), 'utf8'))
  } catch (e) {
    err(rel, `no es un JSON válido (${e.message})`)
    return null
  }
}

const norm = (s) => String(s).trim().toLowerCase().replace(/\s+/g, ' ')
const texto = (v) => typeof v === 'string' && v.trim().length > 0

// --- Estructura ---
const est = leer('estructura.json')
if (est) {
  const subs = est.subniveles || []
  const esperados = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2']
  if (subs.map((s) => s.id).join() !== esperados.join()) err('estructura.json', `los subniveles deben ser ${esperados.join(', ')}`)
  const ids = new Set()
  let n = 0
  for (const s of subs) for (const u of s.unidades || []) for (const l of u.lecciones || []) {
    n++
    if (ids.has(l.id)) err('estructura.json', `lección repetida ${l.id}`)
    ids.add(l.id)
    if (!texto(l.titulo)) err('estructura.json', `${l.id} sin título`)
  }
  if (n !== 72) aviso('estructura.json', `hay ${n} lecciones (el temario tiene 72)`)
}

// --- Examen de nivel ---
const NIVELES = ['A1', 'A2', 'B1', 'B2']
const HABILIDADES = ['gramatica', 'vocabulario', 'lectura', 'escucha']
const idsPreguntas = new Set()

function validarOpcion(archivo, p) {
  const id = p.id || '(sin id)'
  if (!Array.isArray(p.opciones) || p.opciones.length < 2 || p.opciones.length > 5) {
    err(archivo, `${id}: debe tener de 2 a 5 opciones`)
    return
  }
  if (p.opciones.some((o) => !texto(o))) err(archivo, `${id}: hay una opción vacía`)
  const vistas = new Set(p.opciones.map(norm))
  if (vistas.size !== p.opciones.length) err(archivo, `${id}: hay opciones repetidas`)
  if (!Number.isInteger(p.correcta) || p.correcta < 0 || p.correcta >= p.opciones.length) err(archivo, `${id}: "correcta" debe ser el número de una opción (empieza en 0)`)
  if (!texto(p.porque)) err(archivo, `${id}: falta "porque"`)
}

for (const nivel of NIVELES) {
  const archivo = `examen-nivel/${nivel.toLowerCase()}.json`
  if (!fs.existsSync(path.join(RAIZ, archivo))) { err(archivo, 'no existe'); continue }
  const datos = leer(archivo)
  if (!datos) continue
  const preguntas = datos.preguntas || []
  if (preguntas.length < 6) err(archivo, `necesita al menos 6 preguntas (tiene ${preguntas.length})`)
  const porHab = {}
  for (const p of preguntas) {
    const id = p.id || '(sin id)'
    if (!texto(p.id)) err(archivo, 'una pregunta no tiene id')
    else if (idsPreguntas.has(p.id)) err(archivo, `id repetido ${p.id}`)
    idsPreguntas.add(p.id)
    if (p.nivel !== nivel) err(archivo, `${id}: "nivel" debe ser ${nivel}`)
    if (!HABILIDADES.includes(p.habilidad)) err(archivo, `${id}: "habilidad" debe ser ${HABILIDADES.join(', ')}`)
    if (p.tipo !== 'opcion') err(archivo, `${id}: en el examen de nivel el tipo debe ser "opcion"`)
    if (!texto(p.enunciado)) err(archivo, `${id}: falta "enunciado"`)
    if (p.habilidad === 'lectura' && !texto(p.texto)) err(archivo, `${id}: una pregunta de lectura necesita "texto"`)
    if (p.habilidad === 'escucha') {
      if (!texto(p.audio)) err(archivo, `${id}: una pregunta de escucha necesita "audio"`)
      else if ((p.opciones || []).some((o) => norm(o) === norm(p.audio))) err(archivo, `${id}: una opción es igual al audio; sin voz se vería la respuesta`)
    }
    validarOpcion(archivo, p)
    porHab[p.habilidad] = (porHab[p.habilidad] || 0) + 1
  }
  for (const h of HABILIDADES) if (!porHab[h]) aviso(archivo, `no hay preguntas de ${h}`)
}

for (const a of avisos) console.log(a)
for (const e of errores) console.log(e)
if (errores.length) {
  console.log(`\n${errores.length} error(es). Corrígelos antes de publicar.`)
  process.exit(1)
}
console.log(`Contenido válido (${idsPreguntas.size} preguntas del examen de nivel).`)
