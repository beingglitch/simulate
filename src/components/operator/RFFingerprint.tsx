import { useEffect, useRef } from 'react'
import { useRCWSStore } from '../../store/useRCWSStore'

const VULN_COLOR: Record<string, string> = {
  CRITICAL: '#FF2020',
  HIGH:     '#F5A623',
  MEDIUM:   '#00D4FF',
  LOW:      '#666',
}
const VULN_WIDTH: Record<string, number> = {
  CRITICAL: 100, HIGH: 75, MEDIUM: 50, LOW: 22,
}
const PROTOCOL_ID: Record<string, string> = {
  'DJI OcuSync 2.0':            'DJI OcuSync 2.0 · Encrypted',
  'LoRa 915MHz · Unencrypted':  'LoRa 915MHz · Unencrypted · VULNERABLE',
  'Military Datalink · Hardened': 'Military Datalink · Hardened',
  'UNCLASSIFIED':               'Protocol Unknown · Classify Required',
}

const W = 260, H = 100
const FREQ_MIN = 0.2, FREQ_MAX = 6.5

function freqToX(f: number) { return ((f - FREQ_MIN) / (FREQ_MAX - FREQ_MIN)) * W }
function dbToY(db: number, dbMin = -140, dbMax = -18) {
  return H - ((db - dbMin) / (dbMax - dbMin)) * H
}

// Peak colours per label
function peakColor(label: string): string {
  if (label.includes('GPS'))      return '#00FF41'
  if (label.includes('TRIG') || label.includes('PAYLOAD')) return '#FF2020'
  if (label.includes('RADAR'))    return '#CC00FF'
  if (label.includes('VIDEO'))    return '#00D4FF'
  return '#F5A623'
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
      timeRef.current += 0.04
      const t = timeRef.current

      // Noise floor — evolves slowly
      for (let i = 0; i < W; i++) {
        noiseRef.current[i] = -118 + (Math.random() - 0.5) * 6 + Math.sin(i * 0.25 + t) * 2.5
      }

      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H)

      // Grid
      ctx.strokeStyle = '#0D0D0D'; ctx.lineWidth = 0.5
      for (let f = 1; f <= 6; f++) {
        const x = freqToX(f)
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let db = -120; db <= -40; db += 20) {
        const y = dbToY(db)
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      // Noise floor
      ctx.beginPath(); ctx.strokeStyle = '#1E4A1E'; ctx.lineWidth = 1
      for (let x = 0; x < W; x++) {
        const y = dbToY(noiseRef.current[x])
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()

      // Freq axis ticks
      ctx.fillStyle = '#252525'; ctx.font = '7px JetBrains Mono, monospace'; ctx.textAlign = 'center'
      for (let f = 1; f <= 6; f++) ctx.fillText(`${f}G`, freqToX(f), H - 2)

      if (!track) {
        ctx.fillStyle = '#2A2A2A'; ctx.font = '9px JetBrains Mono, monospace'; ctx.textAlign = 'center'
        ctx.fillText('NO TRACK SELECTED', W / 2, H / 2 + 4)
        animRef.current = requestAnimationFrame(draw)
        return
      }

      // Draw signal peaks
      for (const peak of track.rfProfile.peaks) {
        const noise = (Math.random() - 0.5) * 1.8 + Math.sin(t * 4 + peak.freqGHz * 2) * 1.2
        const dbVal = peak.dbm + noise
        const px = freqToX(peak.freqGHz)
        const py = dbToY(dbVal)
        const col = peakColor(peak.label)
        const sigma = 7 + Math.random() * 1

        const grad = ctx.createLinearGradient(px, py, px, H)
        grad.addColorStop(0, col + 'CC')
        grad.addColorStop(1, col + '00')

        ctx.beginPath()
        ctx.fillStyle = grad
        const startX = Math.max(0, px - sigma * 4)
        const endX   = Math.min(W, px + sigma * 4)
        ctx.moveTo(startX, H)
        for (let x = startX; x <= endX; x++) {
          const dy = (x - px) / sigma
          const y  = py + (H - py) * (1 - Math.exp(-0.5 * dy * dy))
          ctx.lineTo(x, Math.min(H, y))
        }
        ctx.lineTo(endX, H)
        ctx.closePath(); ctx.fill()

        // Spine
        ctx.strokeStyle = col; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(px, H); ctx.lineTo(px, py); ctx.stroke()

        // Label
        ctx.fillStyle = col; ctx.font = 'bold 7px JetBrains Mono, monospace'; ctx.textAlign = 'center'
        ctx.fillText(peak.label, px, Math.max(9, py - 4))
        ctx.fillStyle = col + '80'; ctx.font = '7px JetBrains Mono, monospace'
        ctx.fillText(`${peak.freqGHz}G`, px, H - 2)
      }

      animRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [track])

  const vuln       = track?.rfProfile.vulnerability ?? 'LOW'
  const vulnColor  = VULN_COLOR[vuln]
  const vulnWidth  = VULN_WIDTH[vuln]
  const protocolId = track ? (PROTOCOL_ID[track.rfProfile.protocol] ?? track.rfProfile.protocol) : '—'

  return (
    <div style={{ padding: '10px 12px' }}>
      <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.14em', marginBottom: 6 }}>RF FINGERPRINT</div>

      <canvas ref={canvasRef} width={W} height={H}
        style={{ width: '100%', border: '1px solid #111', display: 'block', marginBottom: 7 }} />

      {track && (
        <>
          {/* Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px', marginBottom: 6 }}>
            <MetaItem label="CTRL FREQ" value={`${track.rfProfile.freqGHz} GHz`} />
            <MetaItem label="REC. PULSE" value={`${track.rfProfile.recPulseWidthNs}ns`} />
            <MetaItem label="PRF"       value={`${track.rfProfile.recPrfHz}Hz`} />
            <MetaItem label="PEAKS"     value={`${track.rfProfile.peaks.length}`} />
          </div>

          {/* Protocol ID */}
          <div style={{
            fontSize: 10, color: vuln === 'CRITICAL' ? '#FF2020A0' : '#555',
            letterSpacing: '0.06em', marginBottom: 6, lineHeight: 1.4,
            borderLeft: `2px solid ${vulnColor}40`, paddingLeft: 6,
          }}>
            {protocolId}
          </div>

          {/* Vulnerability bar */}
          <div style={{ marginBottom: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: '#444', letterSpacing: '0.1em' }}>VULNERABILITY</span>
              <span style={{
                fontSize: 10, color: vulnColor, fontWeight: 700, letterSpacing: '0.1em',
                animation: vuln === 'CRITICAL' ? 'hostile-pulse 0.8s ease-in-out infinite' : 'none',
              }}>
                {vuln}
              </span>
            </div>
            <div style={{ height: 5, background: '#0A0A0A', border: '1px solid #1A1A1A', position: 'relative' }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, height: '100%',
                width: `${vulnWidth}%`,
                background: `linear-gradient(90deg, ${vulnColor}40, ${vulnColor})`,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 9, color: '#333' }}>
              <span>LOW</span><span>MED</span><span>HIGH</span><span>CRIT</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#C8C8C0' }}>{value}</div>
    </div>
  )
}
