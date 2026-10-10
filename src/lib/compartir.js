export function descargar(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

// Comparte la imagen con la función nativa; si no existe, la descarga.
export async function compartirImagen(blob, nombreArchivo, texto) {
  const archivo = new File([blob], nombreArchivo, { type: 'image/png' })
  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], text: texto })
      return 'compartido'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelado'
    }
  }
  descargar(blob, nombreArchivo)
  return 'descargado'
}

export async function compartirTexto(texto, url) {
  if (navigator.share) {
    try {
      await navigator.share({ text: texto, url })
      return 'compartido'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelado'
    }
  }
  window.open('https://wa.me/?text=' + encodeURIComponent(`${texto} ${url}`), '_blank', 'noopener')
  return 'whatsapp'
}

export function sitioCorto(url) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}
