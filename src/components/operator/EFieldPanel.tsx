// E-field vs distance graph + Marx generator pulse waveform
import { useEffect, useRef } from 'react'

interface EFieldPanelProps {
  isEngaging: boolean
  targetDistanceM: number
  peakPowerMW: number
}

const W = 240, H = 70
const W2 = 240, H2 = 55

export default function EFieldPanel({ isEngaging, targetDistanceM, peakPowerMW }: EFieldPanelProps) {
  const efieldRef = useRef<HTMLCanvasElement>(null)
  const marxRef   = useRef<HTMLCanvasElement>(null)
  const timeRef   = useRef(0)
  const rafRef    = useRef(0)

  useEffect(() => {
    const ec = efieldRef.current
    const mc = marxRef.current
    if (!ec || !mc) return
    const ectx = ec.getContext('2d')!
    const mctx = mc.getContext('2d')!

    function draw() {
      timeRef.current += 0.04
      const t = timeRef.current

      // ── E-field vs distance ──────────────────────────────────────
      ectx.clearRect(0, 0, W, H)
      ectx.fillStyle = '#000'
      ectx.fillRect(0, 0, W, H)

      // Grid
      ectx.strokeStyle = '#111'
      ectx.lineWidth = 0.5
      for (let x = 0; x < W; x += W / 5) {
        ectx.beginPath(); ectx.moveTo(x, 0); ectx.lineTo(x, H); ectx.stroke()
      }
      for (let y = 0; y < H; y += H / 3) {
        ectx.beginPath(); ectx.moveTo(0, y); ectx.lineTo(W, y); ectx.stroke()
      }

      // E-field curve: E ∝ P^0.5 / r (simplified)
      // x axis: 0–3km, y axis: 0–max E-field
      const maxDist = 3000
      const gain = isEngaging ? 1 + 0.15 * Math.sin(t * 8) : 0.15
      const peakE = peakPowerMW * gain * 0.0002

      ectx.beginPath()
      ectx.strokeStyle = isEngaging ? '#F5A623' : '#F5A62330'
      ectx.lineWidth = 1.5
      for (let px = 1; px < W; px++) {
        const d = (px / W) * maxDist
        const e = Math.min(H, (peakE / (d * 0.001 + 0.05)) * H * 0.4)
        const y = H - e
        px === 1 ? ectx.moveTo(px, y) : ectx.lineTo(px, y)
      }
      ectx.stroke()

      // Target distance marker
      if (targetDistanceM > 0 && targetDistanceM <= maxDist) {
        const tx = (targetDistanceM / maxDist) * W
        ectx.strokeStyle = '#FF2020'
        ectx.lineWidth = 1
        ectx.setLineDash([3, 3])
        ectx.beginPath(); ectx.moveTo(tx, 0); ectx.lineTo(tx, H); ectx.stroke()
        ectx.setLineDash([])
        ectx.fillStyle = '#FF2020'
        ectx.font = '7px JetBrains Mono, monospace'
        ectx.textAlign = 'left'
        ectx.fillText(`${Math.round(targetDistanceM)}m`, tx + 2, 10)
      }

      // Axis labels
      ectx.fillStyle = '#333'
      ectx.font = '7px JetBrains Mono, monospace'
      ectx.textAlign = 'left'
      ectx.fillText('E kV/m', 2, 8)
      ectx.textAlign = 'right'
      ectx.fillText('3km', W - 2, H - 2)

      // ── Marx generator pulse waveform ────────────────────────────
      mctx.clearRect(0, 0, W2, H2)
      mctx.fillStyle = '#000'
      mctx.fillRect(0, 0, W2, H2)

      // Grid
      mctx.strokeStyle = '#111'
      mctx.lineWidth = 0.5
      for (let x = 0; x < W2; x += W2 / 8) {
        mctx.beginPath(); mctx.moveTo(x, 0); mctx.lineTo(x, H2); mctx.stroke()
      }
      mctx.beginPath(); mctx.moveTo(0, H2 / 2); mctx.lineTo(W2, H2 / 2); mctx.stroke()

      // Double-exponential pulse: A*(exp(-αt) - exp(-βt))
      // Only visible when engaging — otherwise flat noise floor
      const pulseMag = isEngaging ? 1 : 0.05
      const noiseAmp = 0.04
      mctx.beginPath()
      mctx.strokeStyle = isEngaging ? '#00FF41' : '#00FF4120'
      mctx.lineWidth = 1.5
      for (let px = 0; px < W2; px++) {
        const τ = (px / W2) * 4            // 0–4 normalized time units
        const pulse = pulseMag * (Math.exp(-0.5 * τ) - Math.exp(-8 * τ)) * 0.95
        const noise = (Math.random() - 0.5) * noiseAmp
        const y = H2 / 2 - (pulse + noise) * H2 * 0.6
        px === 0 ? mctx.moveTo(px, Math.max(2, Math.min(H2 - 2, y)))
                 : mctx.lineTo(px, Math.max(2, Math.min(H2 - 2, y)))
      }
      mctx.stroke()

      // Labels
      mctx.fillStyle = '#333'
      mctx.font = '7px JetBrains Mono, monospace'
      mctx.textAlign = 'left'
      mctx.fillText('MARX PULSE kV', 2, 8)

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [isEngaging, targetDistanceM, peakPowerMW])

  return (
    <div style={{ padding: '8px 12px' }}>
      <div style={{ fontSize: 12, color: '#777', letterSpacing: '0.14em', marginBottom: 6 }}>
        E-FIELD SIMULATION
      </div>
      <div style={{ marginBottom: 2 }}>
        <div style={{ fontSize: 13, color: '#777', letterSpacing: '0.08em', marginBottom: 3 }}>
          E-FIELD vs DISTANCE
        </div>
        <canvas ref={efieldRef} width={W} height={H}
          style={{ width: '100%', display: 'block', border: '1px solid #111' }} />
      </div>
      <div>
        <div style={{ fontSize: 13, color: '#777', letterSpacing: '0.08em', marginBottom: 3 }}>
          PULSE WAVEFORM
        </div>
        <canvas ref={marxRef} width={W2} height={H2}
          style={{ width: '100%', display: 'block', border: '1px solid #111' }} />
      </div>
    </div>
  )
}
