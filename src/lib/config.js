let config = null

export async function cargarConfig() {
  if (config) return config
  let datos = {}
  try {
    const r = await fetch('config.json', { cache: 'no-cache' })
    if (r.ok) datos = await r.json()
  } catch {
    // Sin config.json se usan los valores por omisión.
  }
  const sitio = datos.sitioUrl || location.origin + location.pathname
  config = {
    contenidoUrl: datos.contenidoUrl || 'contenido/',
    apiUrl: datos.apiUrl || '',
    gumroadUrl: datos.gumroadUrl || '',
    demoLicencia: datos.demoLicencia === true,
    sitioUrl: sitio.endsWith('/') ? sitio : sitio + '/',
  }
  return config
}

export function getConfig() {
  return config
}
