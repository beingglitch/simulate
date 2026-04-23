import { useRef } from 'react'

interface Props {
  value: number       // -10 to 45
  onChange: (v: number) => void
}

const MIN_EL = -10
const MAX_EL = 45
const RANGE  = MAX_EL - MIN_EL  // 55

// SVG dimensions
const W = 280, H = 56
const CX = W / 2, CY = H - 10
const ARC_R = 48

// Arc sweeps from 200° to 340° in SVG coords (left to right)
const ARC_START_DEG = 200
const ARC_END_DEG   = 340
const ARC_SWEEP     = ARC_END_DEG - ARC_START_DEG  // 140°

function deg2rad(d: number) { return d * Math.PI / 180 }
function arcPt(deg: number) {
  const r = deg2rad(deg)
  return { x: CX + ARC_R * Math.cos(r), y: CY + ARC_R * Math.sin(r) }
}
function elToSvgDeg(el: number) {
  const t = (el - MIN_EL) / RANGE          // 0..1
  return ARC_START_DEG + t * ARC_SWEEP
}
function svgDegToEl(deg: number) {
  const t = (deg - ARC_START_DEG) / ARC_SWEEP
  return MIN_EL + t * RANGE
}

function arcPath(startDeg: number, endDeg: number) {
  const s = arcPt(startDeg)
  const e = arcPt(endDeg)
  const sweep = endDeg - startDeg > 0 ? 1 : 0
  return `M ${s.x} ${s.y} A ${ARC_R} ${ARC_R} 0 0 ${sweep} ${e.x} ${e.y}`
}

export default function ElevationArc({ value, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  function getElFromEvent(e: React.PointerEvent): number {
    const rect = svgRef.current!.getBoundingClientRect()
    const dx = e.clientX - rect.left - CX
    const dy = e.clientY - rect.top - CY
    let deg = Math.atan2(dy, dx) * 180 / Math.PI
    if (deg < 0) deg += 360
    // Clamp to arc range
    deg = Math.max(ARC_START_DEG, Math.min(ARC_END_DEG, deg))
    const el = svgDegToEl(deg)
    return Math.round(Math.max(MIN_EL, Math.min(MAX_EL, el)))
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    onChange(getElFromEvent(e))
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    onChange(getElFromEvent(e))
  }
  function onPointerUp() { dragging.current = false }

  const thumbDeg = elToSvgDeg(value)
  const thumb    = arcPt(thumbDeg)
  const fillPath = arcPath(ARC_START_DEG, thumbDeg)
  const bgPath   = arcPath(ARC_START_DEG, ARC_END_DEG)

  return (
    <div style={{ padding: '4px 8px' }}>
      <div className="mono" style={{ color: 'rgba(120,150,185,0.4)', fontSize: 9, letterSpacing: '0.1em', marginBottom: 2 }}>
        ELEVATION
      </div>
      <svg
        ref={svgRef}
        width={W} height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', cursor: 'crosshair' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Background arc */}
        <path d={bgPath} fill="none" stroke="rgba(77,166,255,0.12)" strokeWidth={6} strokeLinecap="round" />

        {/* Filled arc */}
        <path d={fillPath} fill="none" stroke="rgba(77,166,255,0.55)" strokeWidth={6} strokeLinecap="round" />

        {/* Thumb */}
        <circle cx={thumb.x} cy={thumb.y} r={6} fill="#0c1826" stroke="#4da6ff" strokeWidth={2} />

        {/* Min/Max labels */}
        <text x={arcPt(ARC_START_DEG).x - 4} y={arcPt(ARC_START_DEG).y + 12}
          textAnchor="middle" fill="rgba(100,140,185,0.4)" fontSize={8} fontFamily="monospace"
        >{MIN_EL}°</text>
        <text x={arcPt(ARC_END_DEG).x + 4} y={arcPt(ARC_END_DEG).y + 12}
          textAnchor="middle" fill="rgba(100,140,185,0.4)" fontSize={8} fontFamily="monospace"
        >{MAX_EL}°</text>

        {/* Value label */}
        <text x={CX} y={CY - ARC_R / 2 - 2}
          textAnchor="middle" fill="rgba(77,166,255,0.9)" fontSize={11} fontFamily="monospace" fontWeight="bold"
        >{value >= 0 ? '+' : ''}{value}°</text>
      </svg>
    </div>
  )
}
