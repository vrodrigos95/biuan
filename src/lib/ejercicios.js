// Preparación y evaluación de los ejercicios de una lección.
import { barajar } from './azar.js'

export const TIPOS = ['opcion', 'hueco', 'ordenar', 'emparejar', 'lectura', 'escucha']

export function normalizar(s) {
  return String(s ?? '')
    .normalize('NFC')
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?]+$/, '')
    .toLowerCase()
}

function barajarOpciones(ej) {
  const orden = barajar(ej.opciones.map((_, i) => i))
  return { ...ej, opciones: orden.map((i) => ej.opciones[i]), correcta: orden.indexOf(ej.correcta) }
}

// Devuelve una copia lista para mostrarse (opciones y fichas revueltas).
export function preparar(ej) {
  switch (ej.tipo) {
    case 'opcion':
    case 'lectura':
    case 'escucha':
      return barajarOpciones(ej)
    case 'hueco':
      return ej.opciones ? barajarOpciones(ej) : { ...ej }
    case 'ordenar': {
      const palabras = [...ej.respuesta, ...(ej.distractores || [])]
      let fichas = palabras.map((texto, id) => ({ id, texto }))
      for (let i = 0; i < 5; i++) {
        fichas = barajar(fichas)
        if (fichas.map((f) => f.texto).join(' ') !== ej.respuesta.join(' ')) break
      }
      return { ...ej, fichas }
    }
    case 'emparejar':
      return {
        ...ej,
        izquierda: barajar(ej.pares.map(([a], i) => ({ id: i, texto: a }))),
        derecha: barajar(ej.pares.map(([, b], i) => ({ id: i, texto: b }))),
      }
    default:
      return ej
  }
}

const usaOpciones = (ej) => ['opcion', 'lectura', 'escucha'].includes(ej.tipo) || (ej.tipo === 'hueco' && ej.opciones)

export function estaLista(ej, r) {
  if (r == null) return false
  if (usaOpciones(ej)) return Number.isInteger(r)
  if (ej.tipo === 'hueco') return normalizar(r).length > 0
  if (ej.tipo === 'ordenar') return r.length > 0
  if (ej.tipo === 'emparejar') return r.completo
  return false
}

export function evaluar(ej, r) {
  if (usaOpciones(ej)) return r === ej.correcta
  if (ej.tipo === 'hueco') return ej.aceptadas.some((a) => normalizar(a) === normalizar(r))
  if (ej.tipo === 'ordenar') {
    const elegidas = r.map((id) => ej.fichas.find((f) => f.id === id).texto)
    return normalizar(elegidas.join(' ')) === normalizar(ej.respuesta.join(' '))
  }
  if (ej.tipo === 'emparejar') return r.errores === 0
  return false
}

export function respuestaCorrecta(ej) {
  if (usaOpciones(ej)) return ej.opciones[ej.correcta]
  if (ej.tipo === 'hueco') return ej.aceptadas[0]
  if (ej.tipo === 'ordenar') return ej.respuesta.join(' ')
  if (ej.tipo === 'emparejar') return ej.pares.map(([a, b]) => `${a} = ${b}`).join(' · ')
  return ''
}
