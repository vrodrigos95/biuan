// Revisa el contenido antes de publicar. Uso: npm run validar
import fs from 'node:fs'
import path from 'node:path'

const RAIZ = path.resolve(process.env.CONTENIDO_DIR || 'contenido')
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

// --- Lecciones ---
const leccionesEstructura = new Map()
if (est) for (const s of est.subniveles || []) for (const u of s.unidades || []) for (const l of u.lecciones || []) leccionesEstructura.set(l.id, { subnivel: s.id, unidad: u.numero })

const BLOQUES = ['texto', 'tip', 'ejemplo', 'tabla']
const TIPOS = ['opcion', 'hueco', 'ordenar', 'emparejar', 'lectura', 'escucha']
function validarEjercicios(archivo, ejercicios) {
  const ids = new Set()
  for (const ej of ejercicios) {
    const id = ej.id || '(sin id)'
    if (!texto(ej.id)) err(archivo, 'un ejercicio no tiene id')
    else if (ids.has(ej.id)) err(archivo, `id de ejercicio repetido ${ej.id}`)
    ids.add(ej.id)
    if (!TIPOS.includes(ej.tipo)) { err(archivo, `${id}: "tipo" debe ser ${TIPOS.join(', ')}`); continue }
    if (!texto(ej.porque)) err(archivo, `${id}: falta "porque"`)
    switch (ej.tipo) {
      case 'opcion':
        if (!texto(ej.enunciado)) err(archivo, `${id}: falta "enunciado"`)
        validarOpcion(archivo, ej)
        break
      case 'lectura':
        if (!texto(ej.texto)) err(archivo, `${id}: falta "texto"`)
        if (!texto(ej.pregunta)) err(archivo, `${id}: falta "pregunta"`)
        validarOpcion(archivo, ej)
        break
      case 'escucha':
        if (!texto(ej.audio)) err(archivo, `${id}: falta "audio"`)
        if (!texto(ej.pregunta)) err(archivo, `${id}: falta "pregunta"`)
        if ((ej.opciones || []).some((o) => norm(o) === norm(ej.audio))) err(archivo, `${id}: una opción es igual al audio; sin voz se vería la respuesta`)
        validarOpcion(archivo, ej)
        break
      case 'hueco':
        if (!texto(ej.frase) || ej.frase.split('___').length !== 2) err(archivo, `${id}: "frase" debe tener exactamente un ___`)
        if (ej.opciones) validarOpcion(archivo, ej)
        else if (!Array.isArray(ej.aceptadas) || !ej.aceptadas.length || ej.aceptadas.some((a) => !texto(a))) err(archivo, `${id}: necesita "aceptadas" (lo que se escribe) o "opciones" + "correcta" (para tocar)`)
        break
      case 'ordenar':
        if (!Array.isArray(ej.respuesta) || ej.respuesta.length < 2 || ej.respuesta.some((p) => !texto(p))) err(archivo, `${id}: "respuesta" debe ser una lista de al menos 2 palabras`)
        if (ej.distractores && (!Array.isArray(ej.distractores) || ej.distractores.some((p) => !texto(p)))) err(archivo, `${id}: "distractores" debe ser una lista de palabras`)
        break
      case 'emparejar': {
        const pares = ej.pares || []
        if (!Array.isArray(pares) || pares.length < 2 || pares.length > 6 || pares.some((p) => !Array.isArray(p) || p.length !== 2 || !texto(p[0]) || !texto(p[1]))) {
          err(archivo, `${id}: "pares" debe tener de 2 a 6 parejas ["a", "b"]`)
          break
        }
        if (new Set(pares.map((p) => norm(p[0]))).size !== pares.length) err(archivo, `${id}: hay elementos repetidos en la columna izquierda`)
        if (new Set(pares.map((p) => norm(p[1]))).size !== pares.length) err(archivo, `${id}: hay elementos repetidos en la columna derecha`)
        break
      }
    }
  }
}

let totalLecciones = 0
const dirLecciones = path.join(RAIZ, 'lecciones')
const archivosLeccion = fs.existsSync(dirLecciones) ? fs.readdirSync(dirLecciones).filter((f) => f.endsWith('.json')).sort() : []

for (const nombre of archivosLeccion) {
  const archivo = `lecciones/${nombre}`
  const l = leer(archivo)
  if (!l) continue
  totalLecciones++
  const idArchivo = nombre.replace(/\.json$/, '')
  if (l.id !== idArchivo) err(archivo, `"id" debe ser ${idArchivo}, igual que el nombre del archivo`)
  const lugar = leccionesEstructura.get(l.id)
  if (!lugar) err(archivo, `${l.id} no está en estructura.json`)
  else {
    if (l.subnivel !== lugar.subnivel) err(archivo, `"subnivel" debe ser ${lugar.subnivel}`)
    if (l.unidad !== lugar.unidad) err(archivo, `"unidad" debe ser ${lugar.unidad}`)
  }
  if (!texto(l.titulo)) err(archivo, 'falta "titulo"')

  if (!Array.isArray(l.explicacion) || !l.explicacion.length) err(archivo, 'falta "explicacion"')
  for (const [i, b] of (l.explicacion || []).entries()) {
    const donde = `explicación, bloque ${i + 1}`
    if (!BLOQUES.includes(b.tipo)) err(archivo, `${donde}: "tipo" debe ser ${BLOQUES.join(', ')}`)
    if ((b.tipo === 'texto' || b.tipo === 'tip') && !texto(b.md)) err(archivo, `${donde}: falta "md"`)
    if (b.tipo === 'ejemplo' && !texto(b.en)) err(archivo, `${donde}: falta "en"`)
    if (b.tipo === 'tabla' && (!Array.isArray(b.filas) || !b.filas.length || b.filas.some((f) => !Array.isArray(f)))) err(archivo, `${donde}: "filas" debe ser una lista de filas`)
  }

  const ejercicios = l.ejercicios || []
  if (ejercicios.length < 8 || ejercicios.length > 16) aviso(archivo, `tiene ${ejercicios.length} ejercicios (lo recomendado es unos 12)`)
  validarEjercicios(archivo, ejercicios)
}

// --- Exámenes de control ---
let totalControles = 0
for (const nivel of ['A1', 'A2', 'B1']) {
  const archivo = `controles/${nivel}.json`
  if (!fs.existsSync(path.join(RAIZ, archivo))) continue
  const c = leer(archivo)
  if (!c) continue
  totalControles++
  if (c.id !== nivel) err(archivo, `"id" debe ser ${nivel}`)
  if (!texto(c.titulo)) err(archivo, 'falta "titulo"')
  if (!Number.isInteger(c.aprobacion) || c.aprobacion < 1 || c.aprobacion > 100) err(archivo, '"aprobacion" debe ser un porcentaje entero de 1 a 100')
  if (c.minutos !== undefined && (!Number.isInteger(c.minutos) || c.minutos < 1)) err(archivo, '"minutos" debe ser un entero positivo')
  if (c.espera_horas_reintento !== undefined && (typeof c.espera_horas_reintento !== 'number' || c.espera_horas_reintento < 0)) err(archivo, '"espera_horas_reintento" debe ser un número de horas')
  if (!Array.isArray(c.secciones) || !c.secciones.length) { err(archivo, 'falta "secciones"'); continue }
  const todas = []
  for (const sec of c.secciones) {
    if (!texto(sec.titulo)) err(archivo, 'una sección no tiene "titulo"')
    if (!Array.isArray(sec.preguntas) || !sec.preguntas.length) err(archivo, `la sección ${sec.titulo || ''} no tiene preguntas`)
    else todas.push(...sec.preguntas)
  }
  validarEjercicios(archivo, todas)
}

for (const a of avisos) console.log(a)
for (const e of errores) console.log(e)
if (errores.length) {
  console.log(`\n${errores.length} error(es). Corrígelos antes de publicar.`)
  process.exit(1)
}
console.log(`Contenido válido (${idsPreguntas.size} preguntas del examen de nivel, ${totalLecciones} lecciones, ${totalControles} exámenes de control).`)
