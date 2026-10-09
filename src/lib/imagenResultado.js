// Imagen del resultado para compartir, dibujada en canvas.
import { etiquetaNivel } from './examenNivel.js'

export const FORMATOS = {
  historia: { ancho: 1080, alto: 1920 },
  cuadrada: { ancho: 1080, alto: 1080 },
}

const C = {
  fondo1: '#E1D2F7',
  fondo2: '#FCDCC0',
  tinta: '#3D3A4E',
  suave: '#6E6A86',
  morado: '#8E5FCB',
  moradoTinta: '#5C3A8C',
  blanco: '#FFFFFF',
}

async function fuentesListas() {
  if (!document.fonts?.load) return
  await Promise.all([
    document.fonts.load('700 100px "Baloo 2"'),
    document.fonts.load('800 40px "Nunito"'),
    document.fonts.load('600 40px "Nunito"'),
  ]).catch(() => {})
}

function rectRedondo(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function lineas(ctx, texto, anchoMax) {
  const palabras = texto.split(' ')
  const res = []
  let actual = ''
  for (const p of palabras) {
    const prueba = actual ? actual + ' ' + p : p
    if (ctx.measureText(prueba).width > anchoMax && actual) {
      res.push(actual)
      actual = p
    } else actual = prueba
  }
  if (actual) res.push(actual)
  return res
}

function textoCentrado(ctx, texto, x, y, anchoMax, alturaLinea) {
  const ls = lineas(ctx, texto, anchoMax)
  ls.forEach((l, i) => ctx.fillText(l, x, y + i * alturaLinea))
  return ls.length * alturaLinea
}

function ajustarFuente(ctx, texto, peso, familia, tamMax, anchoMax) {
  let t = tamMax
  do {
    ctx.font = `${peso} ${t}px ${familia}`
    if (ctx.measureText(texto).width <= anchoMax) break
    t -= 4
  } while (t > 20)
}

export async function dibujarResultado({ formato, nombre, nivel, sitio }) {
  await fuentesListas()
  const { ancho: W, alto: H } = FORMATOS[formato]
  const vertical = formato === 'historia'
  const lienzo = document.createElement('canvas')
  lienzo.width = W
  lienzo.height = H
  const ctx = lienzo.getContext('2d')
  const BALOO = '"Baloo 2", system-ui, sans-serif'
  const NUNITO = '"Nunito", system-ui, sans-serif'

  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, C.fondo1)
  g.addColorStop(1, C.fondo2)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // Círculos decorativos
  ctx.globalAlpha = 0.35
  ctx.fillStyle = C.blanco
  ctx.beginPath(); ctx.arc(W * 0.9, H * 0.08, W * 0.22, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(W * 0.05, H * 0.92, W * 0.18, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1

  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const cx = W / 2
  let y = vertical ? 230 : 120

  // Marca
  ctx.fillStyle = C.moradoTinta
  ctx.font = `700 ${vertical ? 120 : 96}px ${BALOO}`
  ctx.fillText('Biuan', cx, y)
  y += vertical ? 62 : 48
  ctx.fillStyle = C.suave
  ctx.font = `600 ${vertical ? 40 : 34}px ${NUNITO}`
  ctx.fillText('Inglés de cero a B1', cx, y)

  // Tarjeta
  const tx = 80
  const tw = W - 160
  const ty = y + (vertical ? 90 : 46)
  const th = vertical ? 900 : 560
  ctx.save()
  ctx.shadowColor = 'rgba(61,58,78,0.15)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 12
  ctx.fillStyle = C.blanco
  rectRedondo(ctx, tx, ty, tw, th, 48)
  ctx.fill()
  ctx.restore()

  let iy = ty + (vertical ? 120 : 86)
  if (nombre) {
    ctx.fillStyle = C.tinta
    ajustarFuente(ctx, nombre, 800, NUNITO, vertical ? 64 : 54, tw - 100)
    ctx.fillText(nombre, cx, iy)
    iy += vertical ? 80 : 62
  }
  ctx.fillStyle = C.suave
  ctx.font = `700 ${vertical ? 44 : 38}px ${NUNITO}`
  ctx.fillText('Nivel estimado de inglés', cx, iy)

  const etiqueta = etiquetaNivel(nivel)
  ctx.fillStyle = C.morado
  ajustarFuente(ctx, etiqueta, 700, BALOO, vertical ? 300 : 230, tw - 120)
  iy += vertical ? 330 : 240
  ctx.fillText(etiqueta, cx, iy)

  ctx.fillStyle = C.suave
  ctx.font = `600 ${vertical ? 32 : 26}px ${NUNITO}`
  const avisoY = ty + th - (vertical ? 150 : 100)
  textoCentrado(ctx, 'Estimación del examen de nivel de Biuan. No es una certificación oficial.', cx, avisoY, tw - 140, vertical ? 44 : 36)

  // Llamado y link
  const pieY = ty + th + (vertical ? 170 : 110)
  ctx.fillStyle = C.tinta
  ctx.font = `800 ${vertical ? 50 : 40}px ${NUNITO}`
  ctx.fillText('¿Y tú qué nivel tienes?', cx, pieY)
  ctx.fillStyle = C.moradoTinta
  ctx.font = `800 ${vertical ? 42 : 34}px ${NUNITO}`
  ajustarFuente(ctx, sitio, 800, NUNITO, vertical ? 42 : 34, W - 120)
  ctx.fillText(sitio, cx, pieY + (vertical ? 70 : 54))
  if (vertical) {
    ctx.fillStyle = C.suave
    ctx.font = `600 36px ${NUNITO}`
    ctx.fillText('Examen gratis · 7 minutos', cx, pieY + 130)
  }

  return new Promise((resolve, reject) =>
    lienzo.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo crear la imagen'))), 'image/png'),
  )
}
