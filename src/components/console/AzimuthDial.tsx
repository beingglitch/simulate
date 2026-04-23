import { useRef } from 'react'

interface Props {
  value: number
  onChange: (v: number) => void
}

const CX = 80, CY = 80, R = 68

function deg2rad(d: number) { return (d * Math.PI) / 180 }

export default function AzimuthDial({ value, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  function getAngle(e: React.PointerEvent): number {
    const rect = svgRef.current!.getBoundingClientRect()
    const dx = e.clientX - rect.left - CX
    const dy = e.clientY - rect.top - CY
    let angle = (Math.atan2(dy, dx) * 180 / Math.PI) + 90
    if (angle < 0) angle += 360
    if (angle >= 360) angle -= 360
    return angle
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = true
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    onChange(getAngle(e))
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return
    onChange(getAngle(e))
  }

  function onPointerUp() {
    dragging.current = false
  }

  // Needle endpoint
  const needleAngle = deg2rad(value - 90)
  const nx = CX + (R - 10) * Math.cos(needleAngle)
  const ny = CY + (R - 10) * Math.sin(needleAngle)

  // Tick marks
  const ticks = []
  for (let a = 0; a < 360; a += 10) {
    const rad = deg2rad(a - 90)
    const isMajor = a % 30 === 0
    const inner = isMajor ? R - 12 : R - 7
    const x1 = CX + R * Math.cos(rad)
    const y1 = CY + R * Math.sin(rad)
    const x2 = CX + inner * Math.cos(rad)
    const y2 = CY + inner * Math.sin(rad)
    ticks.push(
      <line key={a} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isMajor ? 'rgba(100,150,200,0.5)' : 'rgba(100,150,200,0.2)'}
        strokeWidth={isMajor ? 1.5 : 0.75} />
    )
  }

  // Cardinal labels
  const cardinals = [
    { label: 'N', angle: 0 },
    { label: 'E', angle: 90 },
    { label: 'S', angle: 180 },
    { label: 'W', angle: 270 },
  ]

  return (
    <svg
      ref={svgRef}
      width={160} height={160}
      viewBox="0 0 160 160"
      style={{ cursor: 'crosshair', display: 'block', margin: '0 auto' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Outer ring */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(77,166,255,0.15)" strokeWidth={1} />
      <circle cx={CX} cy={CY} r={R + 4} fill="none" stroke="rgba(77,166,255,0.07)" strokeWidth={1} />

      {/* Ticks */}
      {ticks}

      {/* Cardinal labels */}
      {cardinals.map(({ label, angle }) => {
        const rad = deg2rad(angle - 90)
        const lx = CX + (R - 22) * Math.cos(rad)
        const ly = CY + (R - 22) * Math.sin(rad)
        return (
          <text key={label} x={lx} y={ly + 3.5}
            textAnchor="middle" dominantBaseline="middle"
            fill="rgba(160,200,240,0.55)" fontSize={9}
            fontFamily="monospace" fontWeight="bold"
          >{label}</text>
        )
      })}

      {/* Needle tail (opposite direction) */}
      <line
        x1={CX} y1={CY}
        x2={CX - (R - 30) * Math.cos(needleAngle)}
        y2={CY - (R - 30) * Math.sin(needleAngle)}
        stroke="rgba(77,166,255,0.25)" strokeWidth={1.5}
      />

      {/* Needle */}
      <line
        x1={CX} y1={CY}
        x2={nx} y2={ny}
        stroke="#4da6ff" strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Center dot */}
      <circle cx={CX} cy={CY} r={4} fill="#0c1826" stroke="#4da6ff" strokeWidth={1.5} />

      {/* Degree readout */}
      <text x={CX} y={CY + 22}
        textAnchor="middle"
        fill="rgba(77,166,255,0.9)" fontSize={11}
        fontFamily="monospace" fontWeight="bold"
      >{value.toFixed(0)}°</text>
    </svg>
  )
}
