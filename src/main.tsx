import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import OperatorView     from './pages/OperatorView'
import SimulatorControl from './pages/SimulatorControl'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Navigate to="/operator" replace />} />
        <Route path="/operator"  element={<OperatorView />} />
        <Route path="/simulator" element={<SimulatorControl />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)

