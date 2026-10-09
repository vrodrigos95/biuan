import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const CONTENIDO = path.resolve('contenido')

// Sirve /contenido en desarrollo y lo copia a dist/ al compilar.
function contenido() {
  return {
    name: 'biuan-contenido',
    configureServer(server) {
      server.middlewares.use('/contenido', (req, res, next) => {
        const ruta = path.join(CONTENIDO, decodeURIComponent(req.url.split('?')[0]))
        if (!ruta.startsWith(CONTENIDO) || !fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) return next()
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        fs.createReadStream(ruta).pipe(res)
      })
    },
    closeBundle() {
      fs.cpSync(CONTENIDO, path.resolve('dist/contenido'), { recursive: true })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), contenido()],
})
