import { useEffect, useRef } from 'react'
import { useRCWSStore } from '../../store/useRCWSStore'
import type { Track } from '../../types'

const RANGE_RINGS = [250, 500, 750, 1000]
const MAX_RANGE   = 1000
const GREEN       = '#00FF41'
const AMBER       = '#F5A623'
const CYAN        = '#00D4FF'
const RED         = '#FF2020'

function drawRadar(
  canvas: HTMLCanvasElement,
  tracks: Track[],
  sweepAngle: number,
  selectedId: string | null,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const W = canvas.width, H = canvas.height
  const cx = W / 2, cy = H / 2
  const R = Math.min(W, H) / 2 - 10

  ctx.clearRect(0, 0, W, H)

  // Background
  ctx.fillStyle = '#001200'
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fill()

  // Range rings
  RANGE_RINGS.forEach((dist, i) => {
    const r = (dist / MAX_RANGE) * R
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = i === 3 ? '#FF202040' : '#00441220'
    ctx.lineWidth = i === 3 ? 1.5 : 1
    ctx.stroke()

    // Range label
    ctx.fillStyle = i === 3 ? '#FF202060' : '#006612'
    ctx.font = '10px JetBrains Mono, monospace'
    ctx.fillText(`${dist}m`, cx + r + 3, cy - 3)
  })

  // Azimuth spokes every 30°
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = (deg - 90) * Math.PI / 180
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(rad) * R, cy + Math.sin(rad) * R)
    ctx.strokeStyle = '#001a00'
    ctx.lineWidth = 0.8
    ctx.stroke()

    // Degree label on outer ring
    const labelR = R - 14
    ctx.fillStyle = '#006612'
    ctx.font = '9px JetBrains Mono, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(String(deg), cx + Math.cos(rad) * labelR, cy + Math.sin(rad) * labelR + 3)
  }

  // Cardinal labels
  ctx.font = 'bold 11px JetBrains Mono, monospace'
  ctx.fillStyle = '#00AA30'
  ctx.textAlign = 'center'
  const cR = R + 6
  ctx.fillText('N', cx, cy - cR + 8)
  ctx.fillText('S', cx, cy + cR)
  ctx.fillText('E', cx + cR, cy + 4)
  ctx.fillText('W', cx - cR, cy + 4)

  // Sweep — amber trail
  const trailCount = 40
  for (let i = 0; i < trailCount; i++) {
    const frac = i / trailCount
    const angle = sweepAngle - (1 - frac) * 1.2 - Math.PI / 2
    const opacity = frac * 0.35
    const grad = ctx.createConicalGradient
      ? undefined
      : null

    // Simple approach: draw thin wedge slices
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, R, angle - 0.03, angle)
    ctx.closePath()
    ctx.fillStyle = `rgba(245,166,35,${opacity})`
    ctx.fill()
    void grad
  }

  // Sweep line
  const sweepX = cx + Math.cos(sweepAngle - Math.PI / 2) * R
  const sweepY = cy + Math.sin(sweepAngle - Math.PI / 2) * R
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(sweepX, sweepY)
  ctx.strokeStyle = `${AMBER}CC`
  ctx.lineWidth = 1.5
  ctx.stroke()

  // Outer ring border
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.strokeStyle = '#004412'
  ctx.lineWidth = 2
  ctx.stroke()

  // Draw tracks
  tracks.forEach(t => {
    if (t.status === 'NEUTRALISED') return

    const clampDist = Math.min(t.distance, MAX_RANGE * 1.05)
    const r = (clampDist / MAX_RANGE) * R
    const rad = (t.bearing - 90) * Math.PI / 180
    const tx = cx + Math.cos(rad) * r
    const ty = cy + Math.sin(rad) * r

    const isSelected = t.id === selectedId
    const inRange = t.distance <= MAX_RANGE
    const escaped = t.status === 'ESCAPED'

    const dotColor = escaped ? '#444' :
                     isSelected ? CYAN :
                     inRange ? RED : GREEN

    // Speed vector
    if (!escaped) {
      const vRad = (t.bearing - 90) * Math.PI / 180
      const vLen = Math.min(t.speed * 1.5, 20)
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(tx + Math.cos(vRad) * vLen, ty + Math.sin(vRad) * vLen)
      ctx.strokeStyle = dotColor + '80'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Dot
    const dotR = t.priority === 1 ? 5 : t.priority === 2 ? 4 : 3
    ctx.beginPath()
    ctx.arc(tx, ty, dotR, 0, Math.PI * 2)
    ctx.fillStyle = dotColor
    ctx.fill()

    // Priority-1 outer ring
    if (t.priority === 1 && !escaped) {
      ctx.beginPath()
      ctx.arc(tx, ty, dotR + 3, 0, Math.PI * 2)
      ctx.strokeStyle = dotColor + '60'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Pulsing ring for selected/locked
    if (isSelected) {
      ctx.beginPath()
      ctx.arc(tx, ty, dotR + 6, 0, Math.PI * 2)
      ctx.strokeStyle = `${CYAN}90`
      ctx.lineWidth = 1.5
      ctx.stroke()
    }

    // Data tag (declutter: only show if not too close to edge)
    if (!escaped && tx > 20 && ty > 14 && tx < W - 20 && ty < H - 10) {
      ctx.font = '9px JetBrains Mono, monospace'
      ctx.textAlign = 'left'
      ctx.fillStyle = isSelected ? CYAN : dotColor + 'CC'
      const tagX = tx + dotR + 4, tagY = ty - 2
      ctx.fillText(`${t.id}`, tagX, tagY)
      ctx.fillStyle = dotColor + '80'
      ctx.fillText(`${Math.round(t.distance)}m`, tagX, tagY + 10)
    }
  })
}

export default function RadarScope({ fill = false }: { fill?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)

  const { tracks, selectedTrackId, radarSweepAngle } = useRCWSStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      if (!canvas) return
      const rect = canvas.parentElement?.getBoundingClientRect()
      if (rect) {
        canvas.width  = rect.width
        canvas.height = rect.height
      }
    }
    resize()

    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawRadar(canvas, tracks, radarSweepAngle, selectedTrackId)
  }, [tracks, radarSweepAngle, selectedTrackId])

  return (
    <div style={{
      width: '100%', height: fill ? '100%' : 400,
      background: '#001200', position: 'relative',
      cursor: 'crosshair',
    }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Label */}
      <div style={{
        position: 'absolute', top: 6, left: 10, fontSize: 10,
        color: '#006612', letterSpacing: '0.14em', pointerEvents: 'none',
      }}>
        PPI RADAR · 1km RANGE · SWEEP 3s
      </div>
    </div>
  )
}
