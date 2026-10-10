// Escribe <dir>/sw.js con la lista de archivos de la app y una versión según su contenido.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const EXCLUIR = (rel) => rel === 'sw.js' || rel.startsWith('api/') || rel.endsWith('.htaccess') || rel.endsWith('.md') || rel.endsWith('.php')

function recorrer(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? recorrer(p, base) : [path.relative(base, p).split(path.sep).join('/')]
  })
}

export function generarSW(dir) {
  const archivos = recorrer(dir).filter((f) => !EXCLUIR(f)).sort()
  const hash = crypto.createHash('sha256')
  for (const f of archivos) hash.update(f).update(fs.readFileSync(path.join(dir, f)))
  const version = hash.digest('hex').slice(0, 12)
  const lista = ['./', ...archivos.map((f) => './' + f)]
  const plantilla = fs.readFileSync(new URL('./sw-plantilla.js', import.meta.url), 'utf8')
  fs.writeFileSync(path.join(dir, 'sw.js'), plantilla.replace("'__VERSION__'", JSON.stringify(version)).replace('__ARCHIVOS__', JSON.stringify(lista, null, 2)))
  return { version, total: lista.length }
}
