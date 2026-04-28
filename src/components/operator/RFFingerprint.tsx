import { useEffect, useRef } from 'react'
import { useRCWSStore } from '../../store/useRCWSStore'

const VULN_COLOR: Record<string, string> = {
  CRITICAL: '#FF2020',
  HIGH:     '#F5A623',
  MEDIUM:   '#00D4FF',
  LOW:      '#555',
}

// Canvas dimensions
const W = 260, H = 100
const FREQ_MIN = 0.3, FREQ_MAX = 6.2   // GHz
const DB_MIN = -140, DB_MAX = -20       // dBm

function freqToX(f: number) {
  return ((f - FREQ_MIN) / (FREQ_MAX - FREQ_MIN)) * W
}
function dbToY(db: number) {
  return H - ((db - DB_MIN) / (DB_MAX - DB_MIN)) * H
}

export default function RFFingerprint() {
  const { tracks, selectedTrackId } = useRCWSStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)
  const noiseRef  = useRef<Float32Array>(new Float32Array(W))
  const timeRef   = useRef(0)

  const track = tracks.find(t => t.id === selectedTrackId)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    function draw() {
      timeRef.current += 0.05
      const t = timeRef.current

      // Evolve noise floor slightly
      for (let i = 0; i < W; i++) {
        noiseRef.current[i] = -115 + (Math.random() - 0.5) * 4 + Math.sin(i * 0.3 + t) * 2
      }

      ctx.clearRect(0, 0, W, H)

      // Background
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)

      // Grid lines (frequency)
      ctx.strokeStyle = '#111'
      ctx.lineWidth = 0.5
      for (let f = 1; f <= 6; f++) {
        const x = freqToX(f)
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      // Grid lines (dBm)
      for (let db = -120; db <= -40; db += 20) {
        const y = dbToY(db)
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      // Noise floor path
      ctx.beginPath()
      ctx.strokeStyle = '#1E4A1E'
      ctx.lineWidth = 1
      for (let x = 0; x < W; x++) {
        const y = dbToY(noiseRef.current[x])
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()

      if (!track) {
        // No track selected — just noise floor
        ctx.fillStyle = '#333'
        ctx.font = '9px JetBrains Mono, monospace'
        ctx.textAlign = 'center'
        ctx.fillText('NO TRACK SELECTED', W / 2, H / 2 + 4)
        animRef.current = requestAnimationFrame(draw)
        return
      }

      // Draw peaks with Gaussian envelopes
      for (const peak of track.rfProfile.peaks) {
        const peakX = freqToX(peak.freqGHz)
        const peakY = dbToY(peak.dbm + Math.sin(t * 3 + peak.freqGHz) * 1.5)
        const sigma = 8 + Math.random() * 1.5  // px width

        const grad = ctx.createLinearGradient(peakX, peakY, peakX, H)
        const col = peak.label === 'GPS L1' ? '#00FF41' : '#F5A623'
        grad.addColorStop(0, col + 'CC')
        grad.addColorStop(1, col + '00')

        ctx.beginPath()
        ctx.fillStyle = grad
        // Gaussian shape
        for (let x = Math.max(0, peakX - sigma * 4); x < Math.min(W, peakX + sigma * 4); x++) {
          const dy = (x - peakX) / sigma
          const y = dbToY(peak.dbm + Math.sin(t * 3 + peak.freqGHz) * 1.5) + (H - peakY) * (1 - Math.exp(-0.5 * dy * dy))
          if (x === Math.ceil(Math.max(0, peakX - sigma * 4))) ctx.moveTo(x, H)
          ctx.lineTo(x, Math.min(H, y))
        }
        ctx.lineTo(Math.min(W, peakX + sigma * 4), H)
        ctx.closePath()
        ctx.fill()

        // Peak line
        ctx.strokeStyle = col
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(peakX, H)
        ctx.lineTo(peakX, peakY)
        ctx.stroke()

        // Label
        ctx.fillStyle = col
        ctx.font = '7px JetBrains Mono, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(peak.label, peakX, Math.max(8, peakY - 3))

        // Freq label below
        ctx.fillStyle = col + '80'
        ctx.fillText(`${peak.freqGHz}G`, peakX, H - 2)
      }

      // Frequency axis labels
      ctx.fillStyle = '#333'
      ctx.font = '7px JetBrains Mono, monospace'
      ctx.textAlign = 'center'
      for (let f = 1; f <= 6; f++) {
        ctx.fillText(`${f}`, freqToX(f), H - 2)
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [track])

  if (!track) {
    return (
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 12, color: '#777', letterSpacing: '0.14em', marginBottom: 6 }}>RF FINGERPRINT</div>
        <canvas ref={canvasRef} width={W} height={H}
          style={{ width: '100%', border: '1px solid #111', display: 'block' }} />
      </div>
    )
  }

  const vuln = track.rfProfile.vulnerability
  const vulnColor = VULN_COLOR[vuln]

  return (
    <div style={{ padding: '10px 12px' }}>
      <div style={{ fontSize: 12, color: '#777', letterSpacing: '0.14em', marginBottom: 6 }}>RF FINGERPRINT</div>

      <canvas ref={canvasRef} width={W} height={H}
        style={{ width: '100%', border: '1px solid #111', display: 'block', marginBottom: 8 }} />

      {/* Metadata grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px' }}>
        <MetaItem label="DETECTED FREQ" value={`${track.rfProfile.freqGHz} GHz`} />
        <MetaItem label="PROTOCOL"      value={track.rfProfile.protocol} small />
        <MetaItem label="REC. PULSE"    value={`${track.rfProfile.recPulseWidthNs}ns`} />
        <MetaItem label="REC. PRF"      value={`${track.rfProfile.recPrfHz}Hz`} />
      </div>

      <div style={{
        marginTop: 6, padding: '3px 6px',
        border: `1px solid ${vulnColor}40`,
        background: `${vulnColor}10`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, color: '#777', letterSpacing: '0.12em' }}>VULNERABILITY</span>
        <span style={{ fontSize: 13, color: vulnColor, fontWeight: 700, letterSpacing: '0.12em' }}>{vuln}</span>
      </div>
    </div>
  )
}

function MetaItem({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: '#666', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: small ? 8 : 9, color: '#C8C8C0', fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    </div>
  )
}
