import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const CONTENIDO = path.resolve('contenido')

// Lista de lecciones disponibles: las que tienen archivo en contenido/lecciones.
function indice() {
  const dir = path.join(CONTENIDO, 'lecciones')
  const lecciones = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => /^L\d{2}\.json$/.test(f)).map((f) => f.slice(0, 3)).sort()
    : []
  return JSON.stringify({ lecciones }, null, 2) + '\n'
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
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), contenido()],
})
