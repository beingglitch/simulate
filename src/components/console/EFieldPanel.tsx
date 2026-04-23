import { useEffect, useRef, useState } from 'react'

interface Props {
  empFireCount: number   // increments each fire → triggers animation
  targetRange?: number   // metres — shows marker on graph if present
}

// ── E-field physics ────────────────────────────────────────────────────────
const E0 = 2500        // peak V/m at r0
const r0 = 50          // metres
const MAX_R = 1000

function eField(r: number): number {
  return E0 * Math.pow(r0 / Math.max(r, r0), 1.5)
}

const ZONE_BANDS = [
  { rMin: 50,  rMax: 150,  color: 'rgba(220,40,40,0.1)' },
  { rMin: 150, rMax: 600,  color: 'rgba(200,140,0,0.07)' },
  { rMin: 600, rMax: 1000, color: 'rgba(40,100,180,0.05)' },
]

// ── BIT labels / nominal statuses ──────────────────────────────────────────
const BIT_ROWS = [
  { label: 'RADAR ARRAY',   nominal: 'ACTIVE',     color: '#3dd68c' },
  { label: 'EMP GENERATOR', nominal: 'RECHARGED',  color: '#3dd68c' },
  { label: 'RF JAMMER',     nominal: 'NOMINAL',    color: '#3dd68c' },
  { label: 'FIRE CONTROL',  nominal: 'ARMED',      color: '#f05252' },
  { label: 'COMMS',         nominal: 'ENCRYPTED',  color: '#4da6ff' },
]

// ── Canvas dimensions ──────────────────────────────────────────────────────
const CW = 270          // canvas width (fits in 300px panel with 15px padding each side)
const GRAPH_H = 92
const MARX_H  = 58
const PL = 34, PR = 6, PT = 8, PB = 18   // padding inside graph area

export default function EFieldPanel({ empFireCount, targetRange }: Props) {
  const graphRef  = useRef<HTMLCanvasElement>(null)
  const marxRef   = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)

  const [bitStatuses, setBitStatuses] = useState<string[]>(BIT_ROWS.map(r => r.nominal))
  const [bitPhase, setBitPhase]       = useState<'IDLE' | 'RUNNING' | 'PASS'>('IDLE')
  const bitTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  // ── E-field graph — animate curve on each fire ────────────────────────
  useEffect(() => {
    const canvas = graphRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    cancelAnimationFrame(animRef.current)

    if (empFireCount === 0) {
      drawEField(ctx, CW, GRAPH_H, 0, undefined)
      return
    }

    let progress = 0
    const tick = () => {
      progress = Math.min(1, progress + 0.022)
      drawEField(ctx, CW, GRAPH_H, progress, targetRange)
      if (progress < 1) animRef.current = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(animRef.current)
  }, [empFireCount, targetRange])

  // ── Marx waveform — draw once on mount ───────────────────────────────
  useEffect(() => {
    const canvas = marxRef.current
    if (!canvas) return
    drawMarx(canvas.getContext('2d')!, CW, MARX_H)
  }, [])

  // ── Auto-BIT after each fire ─────────────────────────────────────────
  useEffect(() => {
    if (empFireCount === 0) return
    bitTimers.current.forEach(clearTimeout)
    bitTimers.current = []
    setBitPhase('RUNNING')
    setBitStatuses(BIT_ROWS.map(() => 'CHECKING'))
    BIT_ROWS.forEach((row, i) => {
      const t = setTimeout(() => {
        setBitStatuses(prev => {
          const next = [...prev]; next[i] = row.nominal; return next
        })
        if (i === BIT_ROWS.length - 1) setBitPhase('PASS')
      }, (i + 1) * 290)
      bitTimers.current.push(t)
    })
    return () => bitTimers.current.forEach(clearTimeout)
  }, [empFireCount])

  const BIT_STATUS_COLOR: Record<string, string> = {
    CHECKING: '#f5bc4b',
    ACTIVE: '#3dd68c', RECHARGED: '#3dd68c', NOMINAL: '#3dd68c',
    ARMED: '#f05252', ENCRYPTED: '#4da6ff',
  }

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 15px 12px' }}>

      {/* E-field graph */}
      <div className="mono" style={{
        color: 'rgba(120,150,185,0.4)', fontSize: 9, letterSpacing: '0.1em', marginBottom: 5,
      }}>E-FIELD vs DISTANCE</div>
      <canvas ref={graphRef} width={CW} height={GRAPH_H}
        style={{ display: 'block', width: CW, height: GRAPH_H }} />

      {/* Marx waveform */}
      <div className="mono" style={{
        color: 'rgba(120,150,185,0.4)', fontSize: 9, letterSpacing: '0.1em', margin: '9px 0 5px',
      }}>MARX GENERATOR — PULSE WAVEFORM</div>
      <canvas ref={marxRef} width={CW} height={MARX_H}
        style={{ display: 'block', width: CW, height: MARX_H }} />

      {/* Post-EMP BIT */}
      {empFireCount > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 5,
          }}>
            <span className="mono" style={{
              color: 'rgba(120,150,185,0.4)', fontSize: 9, letterSpacing: '0.1em',
            }}>POST-EMP BIT</span>
            {bitPhase === 'PASS' && (
              <span className="mono" style={{ color: '#3dd68c', fontSize: 9 }}>ALL PASS</span>
            )}
            {bitPhase === 'RUNNING' && (
              <span className="mono blink" style={{ color: '#f5bc4b', fontSize: 9 }}>CHECKING…</span>
            )}
          </div>
          {BIT_ROWS.map((row, i) => {
            const st    = bitStatuses[i]
            const color = BIT_STATUS_COLOR[st] ?? '#4da6ff'
            return (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 3,
              }}>
                <span className="mono" style={{ color: 'rgba(140,170,205,0.55)', fontSize: 9 }}>
                  {row.label}
                </span>
                <span className={st === 'CHECKING' ? 'mono blink' : 'mono'}
                  style={{ color, fontSize: 9 }}>
                  {st}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Drawing: E-field curve ─────────────────────────────────────────────────

function drawEField(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  progress: number,
  targetRange?: number,
) {
  ctx.clearRect(0, 0, W, H)

  const gW = W - PL - PR
  const gH = H - PT - PB

  // Background
  ctx.fillStyle = '#080f1a'
  ctx.fillRect(0, 0, W, H)

  // Zone bands
  ZONE_BANDS.forEach(z => {
    const x1 = PL + (z.rMin / MAX_R) * gW
    const x2 = PL + (z.rMax / MAX_R) * gW
    ctx.fillStyle = z.color
    ctx.fillRect(x1, PT, x2 - x1, gH)
  })

  // Horizontal grid + Y labels
  const ySteps = [500, 1000, 1500, 2000]
  ySteps.forEach(v => {
    const y = PT + gH - (v / E0) * gH
    ctx.beginPath()
    ctx.moveTo(PL, y)
    ctx.lineTo(W - PR, y)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5
    ctx.stroke()
    ctx.fillStyle = 'rgba(110,140,175,0.35)'
    ctx.font = '7px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`${v}`, PL - 3, y + 3)
  })

  // X axis labels
  ctx.fillStyle = 'rgba(110,140,175,0.35)'
  ctx.font = '7px monospace'
  ctx.textAlign = 'center'
  ;[200, 400, 600, 800].forEach(r => {
    const x = PL + (r / MAX_R) * gW
    ctx.fillText(`${r}m`, x, H - 3)
  })

  // Axes
  ctx.beginPath()
  ctx.moveTo(PL, PT)
  ctx.lineTo(PL, PT + gH)
  ctx.lineTo(W - PR, PT + gH)
  ctx.strokeStyle = 'rgba(120,150,185,0.2)'
  ctx.lineWidth = 0.75
  ctx.stroke()

  if (progress <= 0) return

  // Target range marker (before curve so curve draws over it)
  if (targetRange && targetRange > 0 && targetRange <= MAX_R) {
    const tx = PL + (targetRange / MAX_R) * gW
    ctx.beginPath()
    ctx.moveTo(tx, PT)
    ctx.lineTo(tx, PT + gH)
    ctx.strokeStyle = 'rgba(240,82,82,0.45)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])
    const ev = eField(targetRange)
    ctx.fillStyle = 'rgba(240,82,82,0.65)'
    ctx.font = '7px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`${Math.round(ev)}V/m`, Math.min(tx + 2, W - PR - 28), PT + 10)
  }

  // Curve — animate from left to right
  const maxPx = PL + progress * gW

  // Glow pass
  ctx.beginPath()
  let first = true
  for (let px = PL; px <= maxPx; px += 1) {
    const r = ((px - PL) / gW) * MAX_R
    const e = eField(Math.max(1, r))
    const y = PT + gH - Math.min(1, e / E0) * gH
    if (first) { ctx.moveTo(px, y); first = false }
    else ctx.lineTo(px, y)
  }
  ctx.strokeStyle = 'rgba(77,166,255,0.12)'
  ctx.lineWidth = 5
  ctx.stroke()

  // Sharp line pass
  ctx.beginPath()
  first = true
  for (let px = PL; px <= maxPx; px += 1) {
    const r = ((px - PL) / gW) * MAX_R
    const e = eField(Math.max(1, r))
    const y = PT + gH - Math.min(1, e / E0) * gH
    if (first) { ctx.moveTo(px, y); first = false }
    else ctx.lineTo(px, y)
  }
  ctx.strokeStyle = '#4da6ff'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Fill under curve
  const lastR = ((maxPx - PL) / gW) * MAX_R
  const lastE = eField(Math.max(1, lastR))
  const lastY = PT + gH - Math.min(1, lastE / E0) * gH
  ctx.lineTo(maxPx, PT + gH)
  ctx.lineTo(PL, PT + gH)
  ctx.closePath()
  ctx.fillStyle = 'rgba(77,166,255,0.05)'
  ctx.fill()

  // Leading dot
  ctx.beginPath()
  ctx.arc(maxPx, lastY, 2.5, 0, Math.PI * 2)
  ctx.fillStyle = '#4da6ff'
  ctx.fill()
}

// ── Drawing: Marx generator waveform ─────────────────────────────────────

function drawMarx(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#080f1a'
  ctx.fillRect(0, 0, W, H)

  const gW = W - PL - PR
  const gH = H - PT - PB

  // Double-exponential impulse: 1.2/50μs standard waveform
  const α   = 0.014   // /μs  (tail decay)
  const β   = 2.8     // /μs  (rise)
  const tMax = 24     // μs displayed

  // Compute peak for normalisation
  let peakV = 0
  for (let i = 0; i <= 2000; i++) {
    const v = Math.exp(-α * (i / 100)) - Math.exp(-β * (i / 100))
    if (v > peakV) peakV = v
  }

  const peakT  = Math.log(β / α) / (β - α)   // ≈ 1.38μs
  const peakPx = PL + (peakT / tMax) * gW

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 0.5
  ctx.fillStyle = 'rgba(110,140,175,0.35)'
  ctx.font = '7px monospace'
  ctx.textAlign = 'center'
  ;[5, 10, 15, 20].forEach(t => {
    const x = PL + (t / tMax) * gW
    ctx.beginPath(); ctx.moveTo(x, PT); ctx.lineTo(x, PT + gH); ctx.stroke()
    ctx.fillText(`${t}μs`, x, H - 3)
  })
  ;[0.25, 0.5, 0.75].forEach(frac => {
    const y = PT + (1 - frac) * gH
    ctx.beginPath(); ctx.moveTo(PL, y); ctx.lineTo(W - PR, y); ctx.stroke()
    ctx.fillStyle = 'rgba(110,140,175,0.3)'
    ctx.textAlign = 'right'
    ctx.fillText(`${Math.round(frac * 100)}%`, PL - 3, y + 3)
    ctx.fillStyle = 'rgba(110,140,175,0.35)'
  })

  // Glow pass
  ctx.beginPath()
  let first = true
  for (let px = 0; px <= gW; px++) {
    const t = (px / gW) * tMax
    const v = (Math.exp(-α * t) - Math.exp(-β * t)) / peakV
    const y = PT + (1 - Math.max(0, v)) * gH
    if (first) { ctx.moveTo(PL + px, y); first = false } else ctx.lineTo(PL + px, y)
  }
  ctx.strokeStyle = 'rgba(245,188,75,0.18)'
  ctx.lineWidth = 4
  ctx.stroke()

  // Sharp line
  ctx.beginPath()
  first = true
  for (let px = 0; px <= gW; px++) {
    const t = (px / gW) * tMax
    const v = (Math.exp(-α * t) - Math.exp(-β * t)) / peakV
    const y = PT + (1 - Math.max(0, v)) * gH
    if (first) { ctx.moveTo(PL + px, y); first = false } else ctx.lineTo(PL + px, y)
  }
  ctx.strokeStyle = '#f5bc4b'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Peak annotation
  ctx.beginPath()
  ctx.moveTo(peakPx, PT + 1)
  ctx.lineTo(peakPx, PT + gH * 0.12)
  ctx.strokeStyle = 'rgba(245,188,75,0.35)'
  ctx.lineWidth = 0.75
  ctx.setLineDash([2, 2])
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(245,188,75,0.55)'
  ctx.font = '7px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('≈1.4μs', peakPx, PT)

  // Y-axis label (rotated)
  ctx.save()
  ctx.fillStyle = 'rgba(140,170,205,0.35)'
  ctx.font = '7px monospace'
  ctx.textAlign = 'center'
  ctx.translate(7, PT + gH / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText('kV', 0, 0)
  ctx.restore()

  // Axes
  ctx.beginPath()
  ctx.moveTo(PL, PT); ctx.lineTo(PL, PT + gH); ctx.lineTo(W - PR, PT + gH)
  ctx.strokeStyle = 'rgba(120,150,185,0.2)'
  ctx.lineWidth = 0.75
  ctx.stroke()
}
