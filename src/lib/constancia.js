// Constancia de nivel estimado: se dibuja en canvas y se guarda como PDF de una página.

const ANCHO = 2200 // carta horizontal, 11 x 8.5 in a 200 ppp
const ALTO = 1700
const C = { tinta: '#3D3A4E', suave: '#6E6A86', morado: '#8E5FCB', moradoTinta: '#5C3A8C', lav: '#E1D2F7', durazno: '#FCDCC0' }

function centrado(ctx, texto, y, fuente, color) {
  ctx.font = fuente
  ctx.fillStyle = color
  ctx.fillText(texto, ANCHO / 2, y)
}

function lineas(ctx, texto, anchoMax) {
  const res = []
  let actual = ''
  for (const p of texto.split(' ')) {
    const prueba = actual ? actual + ' ' + p : p
    if (ctx.measureText(prueba).width > anchoMax && actual) {
      res.push(actual)
      actual = p
    } else actual = prueba
  }
  if (actual) res.push(actual)
  return res
}

function fechaLarga(iso) {
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function dibujarConstancia({ nombre, nivel, titulo, puntaje, fecha, folio }) {
  if (document.fonts?.load) {
    await Promise.all([document.fonts.load('700 100px "Baloo 2"'), document.fonts.load('800 40px "Nunito"'), document.fonts.load('600 40px "Nunito"')]).catch(() => {})
  }
  const lienzo = document.createElement('canvas')
  lienzo.width = ANCHO
  lienzo.height = ALTO
  const ctx = lienzo.getContext('2d')
  const BALOO = '"Baloo 2", system-ui, sans-serif'
  const NUNITO = '"Nunito", system-ui, sans-serif'

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, ANCHO, ALTO)
  const g = ctx.createLinearGradient(0, 0, ANCHO, 0)
  g.addColorStop(0, C.lav)
  g.addColorStop(1, C.durazno)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, ANCHO, 40)
  ctx.fillRect(0, ALTO - 40, ANCHO, 40)
  ctx.strokeStyle = C.lav
  ctx.lineWidth = 6
  ctx.strokeRect(90, 110, ANCHO - 180, ALTO - 220)

  ctx.textAlign = 'center'
  centrado(ctx, 'Biuan', 290, `700 120px ${BALOO}`, C.moradoTinta)
  centrado(ctx, 'Inglés de cero a B1', 350, `600 40px ${NUNITO}`, C.suave)
  centrado(ctx, 'CONSTANCIA DE NIVEL ESTIMADO', 500, `800 64px ${NUNITO}`, C.tinta)
  centrado(ctx, 'Se hace constar que', 620, `600 44px ${NUNITO}`, C.suave)

  let tam = 110
  do {
    ctx.font = `700 ${tam}px ${BALOO}`
    tam -= 6
  } while (ctx.measureText(nombre).width > ANCHO - 500 && tam > 40)
  ctx.fillStyle = C.morado
  ctx.fillText(nombre, ANCHO / 2, 770)
  ctx.fillStyle = C.lav
  ctx.fillRect(ANCHO / 2 - 600, 800, 1200, 4)

  centrado(ctx, `aprobó el ${titulo} de Biuan con ${puntaje}% de aciertos,`, 900, `600 46px ${NUNITO}`, C.tinta)
  centrado(ctx, `por lo que su nivel estimado de inglés es ${nivel}.`, 970, `800 46px ${NUNITO}`, C.tinta)
  centrado(ctx, fechaLarga(fecha), 1070, `600 40px ${NUNITO}`, C.suave)

  // Aviso, destacado
  ctx.fillStyle = '#FBEFB2'
  ctx.fillRect(220, 1170, ANCHO - 440, 230)
  ctx.font = `800 40px ${NUNITO}`
  ctx.fillStyle = '#7A5F0C'
  ctx.fillText('Este documento es una estimación de nivel, no una certificación oficial.', ANCHO / 2, 1240)
  ctx.font = `600 34px ${NUNITO}`
  const aviso = 'Refleja el resultado de un examen de práctica de Biuan. No sustituye exámenes oficiales (TOEFL, Cambridge, IELTS u otros) ni tiene validez académica o laboral por sí mismo.'
  lineas(ctx, aviso, ANCHO - 560).forEach((l, i) => ctx.fillText(l, ANCHO / 2, 1300 + i * 46))

  ctx.textAlign = 'left'
  ctx.font = `600 30px ${NUNITO}`
  ctx.fillStyle = C.suave
  ctx.fillText(`Folio: ${folio}`, 160, ALTO - 150)

  return new Promise((resolve, reject) =>
    lienzo.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo crear la constancia'))), 'image/jpeg', 0.92),
  )
}

// PDF mínimo de una página con la imagen JPEG a página completa (carta horizontal).
export async function pdfDesdeJpeg(jpeg) {
  const bytes = new Uint8Array(await jpeg.arrayBuffer())
  const W = 792
  const H = 612
  const enc = new TextEncoder()
  const partes = []
  const offsets = []
  let largo = 0
  const agregar = (p) => {
    const b = typeof p === 'string' ? enc.encode(p) : p
    partes.push(b)
    largo += b.length
  }
  const objeto = (n, cuerpo) => {
    offsets[n] = largo
    agregar(`${n} 0 obj\n${cuerpo}\nendobj\n`)
  }
  const contenido = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`

  agregar('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  objeto(1, '<< /Type /Catalog /Pages 2 0 R >>')
  objeto(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>')
  objeto(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`)
  offsets[4] = largo
  agregar(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${ANCHO} /Height ${ALTO} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`)
  agregar(bytes)
  agregar('\nendstream\nendobj\n')
  objeto(5, `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`)
  objeto(6, '<< /Title (Constancia de nivel estimado - Biuan) /Producer (Biuan) >>')

  const xref = largo
  let tabla = `xref\n0 7\n0000000000 65535 f \n`
  for (let n = 1; n <= 6; n++) tabla += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`
  agregar(tabla)
  agregar(`trailer\n<< /Size 7 /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`)
  return new Blob(partes, { type: 'application/pdf' })
}

export function crearFolio() {
  const a = new Uint8Array(4)
  crypto.getRandomValues(a)
  return 'BIU-' + Array.from(a, (x) => x.toString(16).padStart(2, '0')).join('').toUpperCase()
}
