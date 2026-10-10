import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { generarSW } from './scripts/generar-sw.mjs'

const CONTENIDO = path.resolve(process.env.CONTENIDO_DIR || 'contenido')

// Contenido disponible: las lecciones y exámenes de control que tienen archivo.
function listar(carpeta, patron) {
  const dir = path.join(CONTENIDO, carpeta)
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => patron.test(f)).map((f) => f.replace(/\.json$/, '')).sort() : []
}
function indice() {
  const lecciones = listar('lecciones', /^L\d{2}\.json$/)
  const controles = listar('controles', /^(A1|A2|B1)\.json$/)
  const simulacro = fs.existsSync(path.join(CONTENIDO, 'simulacro.json'))
  return JSON.stringify({ lecciones, controles, simulacro }, null, 2) + '\n'
}

// Sirve /contenido en desarrollo y lo copia a dist/ al compilar, con su índice.
function contenido() {
  return {
    name: 'biuan-contenido',
    configureServer(server) {
      server.middlewares.use('/contenido', (req, res, next) => {
        const rel = decodeURIComponent(req.url.split('?')[0])
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        if (rel === '/indice.json') return res.end(indice())
        const ruta = path.join(CONTENIDO, rel)
        if (!ruta.startsWith(CONTENIDO) || !fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) return next()
        fs.createReadStream(ruta).pipe(res)
      })
    },
    closeBundle() {
      const destino = path.resolve('dist/contenido')
      fs.cpSync(CONTENIDO, destino, { recursive: true, filter: (f) => !f.endsWith('.md') })
      fs.writeFileSync(path.join(destino, 'indice.json'), indice())
      generarSW(path.resolve('dist'))
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), contenido()],
})
