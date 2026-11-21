import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { setupMockStorage } from '@/utils/seedStorage'
import './css/variables.css'
import './css/global.css'

try {
  setupMockStorage()
} catch (error) {
  console.error('No se pudo inicializar el almacenamiento local.', error)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
