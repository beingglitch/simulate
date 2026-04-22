import { useEffect, useRef, useCallback } from 'react'
import type { SimState, Threat } from '../types'
import { metersToPixels } from '../store/simStore'

const MAP_W = 1000
const MAP_H = 800
const CX = 500
const CY = 400

// Zone definitions: [label, range_m, color_rgb, fill_alpha]
const ZONES: [string, number, [number,number,number], number][] = [
  ['HARD-KILL',  50,   [255, 40,  40],  0.20],
  ['HARD-KILL',  150,  [255, 100, 0],   0.13],
  ['DISRUPT',    300,  [255, 170, 0],   0.08],
  ['DISRUPT',    600,  [255, 220, 0],   0.05],
  ['RF JAM',     1000, [0,  170, 255],  0.04],
]

const RING_LABEL_ANGLES = [315, 315, 45, 45, 315] // degrees for label placement per ring

const THREAT_ICONS: Record<string, string> = {
  FPV_DRONE:  '◈',
  RF_IED:     '⬡',
  ENEMY_RCWS: '⊕',
}

const STATUS_COLORS: Record<string, string> = {
  APPROACHING: '#ff4444',
  ENGAGED:     '#ffaa00',
  DESTROYED:   '#444444',
  DISRUPTED:   '#00cc66',
  ESCAPED:     '#777777',
}

interface EmpPulse {
  radius: number
  active: boolean
}

interface Props {
  state: SimState
  onSelectThreat: (id: string) => void
  mapCenter: { x: number; y: number }
}

export default function BattlefieldMap({ state, onSelectThreat, mapCenter }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const animRef    = useRef<number>(0)
  const sweepAngle = useRef(0)
  const empPulse   = useRef<EmpPulse>({ radius: 0, active: false })
  const prevEmpFired = useRef(false)

  const stateRef = useRef(state)
  stateRef.current = state

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const s = stateRef.current

    sweepAngle.current = (sweepAngle.current + 0.5) % 360

    // Trigger EMP pulse when empFired flips true
    if (s.empFired && !prevEmpFired.current) {
      empPulse.current = { radius: 0, active: true }
    }
    prevEmpFired.current = s.empFired

    // Background
    ctx.fillStyle = '#050d15'
    ctx.fillRect(0, 0, MAP_W, MAP_H)

    drawGrid(ctx)
    drawZones(ctx)
    drawSweep(ctx, sweepAngle.current)
    drawAzimuthLine(ctx, s.turret.azimuth)

    // EMP pulse (advance each frame)
    if (empPulse.current.active) {
      empPulse.current.radius += 5
      const maxR = metersToPixels(700)
      if (empPulse.current.radius > maxR) {
        empPulse.current.active = false
        empPulse.current.radius = 0
      } else {
        drawEMPPulse(ctx, empPulse.current.radius, maxR)
      }
    }

    // Pipeline beam toward selected target
    if (s.pipelineActive && s.selectedThreatId) {
      const t = s.threats.find(x => x.id === s.selectedThreatId)
      if (t) drawPipelineBeam(ctx, t, s.pipelineProgress)
    }

    s.threats.forEach(t => drawThreat(ctx, t, t.id === s.selectedThreatId))
    drawVehicle(ctx, s.turret.azimuth)
    drawCompass(ctx)
    drawScaleBar(ctx)

    animRef.current = requestAnimationFrame(draw)
  }, [])   // intentionally empty deps — reads from stateRef

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [draw])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = MAP_W / rect.width
    const scaleY = MAP_H / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top)  * scaleY

    for (const t of stateRef.current.threats) {
      const dx = t.x - mx, dy = t.y - my
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        onSelectThreat(t.id)
        return
      }
    }
  }, [onSelectThreat])

  return (
    <div className="relative w-full h-full scanlines">
      <canvas
        ref={canvasRef}
        width={MAP_W}
        height={MAP_H}
        className="w-full h-full cursor-crosshair"
        onClick={handleClick}
      />
    </div>
  )
}

// ─── Draw helpers ────────────────────────────────────────────────────────────

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(0, 80, 120, 0.18)'
  ctx.lineWidth = 0.5
  for (let x = 0; x <= MAP_W; x += 50) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, MAP_H); ctx.stroke()
  }
  for (let y = 0; y <= MAP_H; y += 50) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(MAP_W, y); ctx.stroke()
  }
}

function drawZones(ctx: CanvasRenderingContext2D) {
  // Draw fills outer-to-inner so inner stays on top
  ;[...ZONES].reverse().forEach(([, rangem, [rr, gg, bb], alpha]) => {
    const r = metersToPixels(rangem)
    ctx.beginPath()
    ctx.arc(CX, CY, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${rr},${gg},${bb},${alpha})`
    ctx.fill()
  })

  // Draw rings + labels forward
  ZONES.forEach(([label, rangem, [rr, gg, bb]], idx) => {
    const r = metersToPixels(rangem)
    ctx.beginPath()
    ctx.arc(CX, CY, r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${rr},${gg},${bb},0.55)`
    ctx.lineWidth = 0.8
    ctx.setLineDash([4, 6])
    ctx.stroke()
    ctx.setLineDash([])

    // Place label along a specific angle to avoid overlap
    const labelAngle = ((RING_LABEL_ANGLES[idx] - 90) * Math.PI) / 180
    const lx = CX + Math.cos(labelAngle) * (r + 6)
    const ly = CY + Math.sin(labelAngle) * (r + 6)
    ctx.font = '9px "Share Tech Mono"'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = `rgba(${rr},${gg},${bb},0.75)`
    ctx.fillText(`${label} ${rangem >= 1000 ? '1km' : rangem + 'm'}`, lx, ly)
  })
}

function drawSweep(ctx: CanvasRenderingContext2D, angle: number) {
  const maxR = metersToPixels(1000)
  const rad  = ((angle - 90) * Math.PI) / 180

  // Sweep line
  ctx.beginPath()
  ctx.moveTo(CX, CY)
  ctx.lineTo(CX + Math.cos(rad) * maxR, CY + Math.sin(rad) * maxR)
  ctx.strokeStyle = 'rgba(0, 255, 80, 0.55)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Trail arc
  const trailStart = ((angle - 90 - 35) * Math.PI) / 180
  const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, maxR)
  grad.addColorStop(0, 'rgba(0,255,80,0)')
  grad.addColorStop(1, 'rgba(0,255,80,0.05)')
  ctx.beginPath()
  ctx.moveTo(CX, CY)
  ctx.arc(CX, CY, maxR, trailStart, rad)
  ctx.closePath()
  ctx.fillStyle = grad
  ctx.fill()
}

function drawAzimuthLine(ctx: CanvasRenderingContext2D, azimuth: number) {
  const maxR = metersToPixels(1000)
  const rad  = ((azimuth - 90) * Math.PI) / 180
  ctx.beginPath()
  ctx.moveTo(CX, CY)
  ctx.lineTo(CX + Math.cos(rad) * maxR, CY + Math.sin(rad) * maxR)
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.35)'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])
  ctx.stroke()
  ctx.setLineDash([])
}

function drawEMPPulse(ctx: CanvasRenderingContext2D, radius: number, maxR: number) {
  const alpha = Math.max(0, 1 - radius / maxR)

  // Outer ring
  ctx.beginPath()
  ctx.arc(CX, CY, radius, 0, Math.PI * 2)
  ctx.strokeStyle = `rgba(255, 120, 0, ${alpha * 0.9})`
  ctx.lineWidth = 3
  ctx.stroke()

  // Inner ring
  if (radius > 20) {
    ctx.beginPath()
    ctx.arc(CX, CY, radius * 0.65, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255, 220, 50, ${alpha * 0.6})`
    ctx.lineWidth = 1.5
    ctx.stroke()
  }

  // Fill flash near center
  if (radius < 80) {
    const fillAlpha = (1 - radius / 80) * 0.15
    ctx.beginPath()
    ctx.arc(CX, CY, radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 160, 0, ${fillAlpha})`
    ctx.fill()
  }
}

function drawPipelineBeam(ctx: CanvasRenderingContext2D, t: Threat, progress: number) {
  const alpha = 0.3 + 0.4 * Math.abs(Math.sin(Date.now() / 200))
  ctx.beginPath()
  ctx.moveTo(CX, CY)
  ctx.lineTo(t.x, t.y)
  ctx.strokeStyle = `rgba(255, 60, 0, ${alpha})`
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 3])
  ctx.stroke()
  ctx.setLineDash([])

  // Progress dot along beam
  const px = CX + (t.x - CX) * (progress / 100)
  const py = CY + (t.y - CY) * (progress / 100)
  ctx.beginPath()
  ctx.arc(px, py, 3, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255, 180, 0, ${alpha + 0.2})`
  ctx.fill()
}

function drawThreat(ctx: CanvasRenderingContext2D, t: Threat, selected: boolean) {
  const color = STATUS_COLORS[t.status] ?? '#ff4444'

  // Approach line toward center
  if (t.status === 'APPROACHING') {
    ctx.beginPath()
    ctx.moveTo(t.x, t.y)
    ctx.lineTo(t.x + (CX - t.x) * 0.12, t.y + (CY - t.y) * 0.12)
    ctx.strokeStyle = `${color}33`
    ctx.lineWidth = 1
    ctx.setLineDash([3, 5])
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Destruction crosshatch
  if (t.status === 'DESTROYED' || t.status === 'DISRUPTED') {
    const r = 10
    ctx.strokeStyle = t.status === 'DESTROYED' ? 'rgba(120,120,120,0.6)' : 'rgba(0,200,100,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(t.x - r, t.y - r); ctx.lineTo(t.x + r, t.y + r)
    ctx.moveTo(t.x + r, t.y - r); ctx.lineTo(t.x - r, t.y + r)
    ctx.stroke()
  }

  // Selection brackets
  if (selected) {
    ctx.beginPath()
    ctx.arc(t.x, t.y, 22, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0, 220, 255, 0.6)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.stroke()
    ctx.setLineDash([])

    const b = 14, s = 5
    ctx.strokeStyle = '#00dcff'
    ctx.lineWidth = 1.5
    ;[[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx, sy]) => {
      ctx.beginPath()
      ctx.moveTo(t.x + sx * b, t.y + sy * (b - s))
      ctx.lineTo(t.x + sx * b, t.y + sy * b)
      ctx.lineTo(t.x + sx * (b - s), t.y + sy * b)
      ctx.stroke()
    })
  }

  // Icon
  ctx.font = `${selected ? 15 : 12}px "Share Tech Mono"`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.globalAlpha = t.status === 'DESTROYED' ? 0.3 : 1
  ctx.fillStyle = color
  ctx.fillText(THREAT_ICONS[t.type] ?? '×', t.x, t.y)
  ctx.globalAlpha = 1

  // Labels
  ctx.font = '9px "Share Tech Mono"'
  ctx.fillStyle = selected ? '#00dcff' : 'rgba(200,220,240,0.65)'
  ctx.fillText(t.id, t.x, t.y + 17)

  if (t.status === 'APPROACHING') {
    ctx.fillStyle = color
    ctx.font = '8px "Share Tech Mono"'
    ctx.fillText(`${Math.round(t.range)}m`, t.x, t.y - 18)
  }
}

function drawVehicle(ctx: CanvasRenderingContext2D, azimuth: number) {
  // Turret barrel
  const barrelLen = 20
  const rad = ((azimuth - 90) * Math.PI) / 180
  ctx.beginPath()
  ctx.moveTo(CX, CY)
  ctx.lineTo(CX + Math.cos(rad) * barrelLen, CY + Math.sin(rad) * barrelLen)
  ctx.strokeStyle = '#00ccff'
  ctx.lineWidth = 2.5
  ctx.stroke()

  // Hull
  ctx.fillStyle = '#0a2a4a'
  ctx.strokeStyle = '#00aaff'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.roundRect(CX - 11, CY - 7, 22, 14, 3)
  ctx.fill()
  ctx.stroke()

  // Turret ring
  ctx.beginPath()
  ctx.arc(CX, CY, 5, 0, Math.PI * 2)
  ctx.fillStyle = '#00ccff'
  ctx.fill()

  // Ambient glow
  ctx.beginPath()
  ctx.arc(CX, CY, 16, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0, 180, 255, 0.25)'
  ctx.lineWidth = 7
  ctx.stroke()

  ctx.font = '9px "Share Tech Mono"'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillStyle = '#00aaff'
  ctx.fillText('EMP-RCWS', CX, CY + 20)
}

function drawCompass(ctx: CanvasRenderingContext2D) {
  const cx = MAP_W - 44, cy = 44, r = 24
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(0,120,200,0.4)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(5,15,30,0.7)'
  ctx.fill()

  ;(['N','E','S','W'] as const).forEach((d, i) => {
    const rad = ((i * 90 - 90) * Math.PI) / 180
    const tx = cx + Math.cos(rad) * (r - 7)
    const ty = cy + Math.sin(rad) * (r - 7)
    ctx.font = `${d === 'N' ? 'bold ' : ''}9px "Share Tech Mono"`
    ctx.fillStyle = d === 'N' ? '#ff5555' : 'rgba(160,200,240,0.8)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(d, tx, ty)
  })
}

function drawScaleBar(ctx: CanvasRenderingContext2D) {
  const x = 20, y = MAP_H - 22, w = metersToPixels(200)
  ctx.fillStyle = 'rgba(0,160,255,0.6)'
  ctx.fillRect(x, y, w, 2)
  ctx.fillRect(x, y - 3, 1, 6)
  ctx.fillRect(x + w, y - 3, 1, 6)
  ctx.font = '9px "Share Tech Mono"'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'
  ctx.fillStyle = 'rgba(150,190,230,0.6)'
  ctx.fillText('200 m', x, y - 4)
}
