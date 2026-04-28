// SVG arc gauge -10° to +85°

const CX = 130, CY = 130
const R  = 100
const MIN_DEG = -10
const MAX_DEG =  85
const ARC_SPAN = MAX_DEG - MIN_DEG    // 95°
// Map from elevation → SVG angle (-180° left to 0° right on bottom half)
const SVG_START = 180   // leftmost point of arc in SVG degrees
const SVG_END   = 180 - ARC_SPAN

function elevToSvgAngle(el: number): number {
  const frac = (el - MIN_DEG) / ARC_SPAN
  return SVG_START - frac * ARC_SPAN
}

function svgPoint(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function describeArc(startDeg: number, endDeg: number, r: number): string {
  const s = svgPoint(startDeg, r)
  const e = svgPoint(endDeg,   r)
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y}`
}

export default function ElevationGauge({ elevation }: { elevation: number }) {
  const ticks = []
  for (let el = MIN_DEG; el <= MAX_DEG; el += 5) {
    const major = el % 15 === 0
    const ang   = elevToSvgAngle(el)
    const p1    = svgPoint(ang, R - (major ? 16 : 6))
    const p2    = svgPoint(ang, R - 1)
    ticks.push(
      <line
        key={el} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={major ? '#F5A623' : '#333'} strokeWidth={major ? 1.5 : 0.5}
      />
    )
    if (major) {
      const lp = svgPoint(ang, R - 26)
      ticks.push(
        <text key={`l${el}`} x={lp.x} y={lp.y + 4}
          textAnchor="middle" fontSize={9} fill="#666"
          fontFamily="JetBrains Mono, monospace">
          {el > 0 ? `+${el}` : el}°
        </text>
      )
    }
  }

  const needleAng = elevToSvgAngle(Math.max(MIN_DEG, Math.min(MAX_DEG, elevation)))
  const np        = svgPoint(needleAng, R - 18)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0 0' }}>
      <div style={{ fontSize: 12, color: '#777', letterSpacing: '0.14em', marginBottom: 4 }}>ELEVATION</div>
      <svg width={260} height={160} viewBox="0 0 260 160">
        {/* Background arc */}
        <path d={describeArc(SVG_START, SVG_END, R)} fill="none" stroke="#1A1A1A" strokeWidth={14} />
        {/* Active arc */}
        <path
          d={describeArc(SVG_START, needleAng, R)}
          fill="none" stroke="#F5A623" strokeWidth={2} opacity={0.35}
        />
        {/* Zero line */}
        {(() => {
          const zp = svgPoint(elevToSvgAngle(0), R - 1)
          const zp2 = svgPoint(elevToSvgAngle(0), R - 20)
          return <line x1={zp.x} y1={zp.y} x2={zp2.x} y2={zp2.y} stroke="#333" strokeWidth={1} />
        })()}
        {/* Ticks + labels */}
        {ticks}
        {/* Needle line from centre */}
        <line x1={CX} y1={CY} x2={np.x} y2={np.y} stroke="#F5A623" strokeWidth={2} strokeLinecap="square" />
        <circle cx={CX} cy={CY} r={5} fill="#F5A623" />
        <circle cx={CX} cy={CY} r={2} fill="#000" />
        {/* Needle tip dot */}
        <circle cx={np.x} cy={np.y} r={3} fill="#F5A623" />
      </svg>
      <div style={{
        fontSize: 22, color: '#F5A623', fontWeight: 700,
        letterSpacing: '0.06em', marginTop: -8,
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {elevation > 0 ? '+' : ''}{elevation.toFixed(0)}°
      </div>
    </div>
  )
}
