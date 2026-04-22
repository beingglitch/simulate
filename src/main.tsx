import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#0c1826',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#dce8f5',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          letterSpacing: '0.06em',
        },
      }}
    />
  </StrictMode>,
)
