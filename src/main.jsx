import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/baloo-2/latin-700.css'
import '@fontsource/nunito/latin-400.css'
import '@fontsource/nunito/latin-600.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import './estilos.css'
import App from './App.jsx'
import { cargarConfig } from './lib/config.js'
import { descargarParaSinConexion, renovarSiToca } from './lib/acceso.js'
import { registrarSW } from './lib/pwa.js'
import { prepararSonido } from './lib/sonido.js'
import Avisos from './componentes/Avisos.jsx'

cargarConfig().then(() => {
  registrarSW()
  prepararSonido()
  renovarSiToca().then(descargarParaSinConexion)
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <Avisos />
      <App />
    </StrictMode>,
  )
})
