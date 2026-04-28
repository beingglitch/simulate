// SVG compass rose with rotating needle

const R = 110   // outer radius
const CX = 120, CY = 120
const SIZE = 240

export default function AzimuthDial({ azimuth }: { azimuth: number }) {
  const ticks = []
  for (let deg = 0; deg < 360; deg += 10) {
    const major   = deg % 30 === 0
    const rad     = ((deg - 90) * Math.PI) / 180
    const r1      = R - (major ? 18 : 8)
    const r2      = R - 2
    ticks.push(
      <line
        key={deg}
        x1={CX + r1 * Math.cos(rad)} y1={CY + r1 * Math.sin(rad)}
        x2={CX + r2 * Math.cos(rad)} y2={CY + r2 * Math.sin(rad)}
        stroke={major ? '#F5A623' : '#333'} strokeWidth={major ? 1.5 : 0.5}
      />,
    )
    if (major) {
      const lr = R - 30
      ticks.push(
        <text
          key={`l${deg}`}
          x={CX + lr * Math.cos(rad)} y={CY + lr * Math.sin(rad) + 4}
          textAnchor="middle" fontSize={9} fill="#888"
          fontFamily="JetBrains Mono, monospace"
        >
          {deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : deg === 270 ? 'W' : `${deg}`}
        </text>,
      )
    }
  }

  const needleRad = ((azimuth - 90) * Math.PI) / 180
  const nx = CX + (R - 25) * Math.cos(needleRad)
  const ny = CY + (R - 25) * Math.sin(needleRad)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0' }}>
      <div style={{ fontSize: 12, color: '#777', letterSpacing: '0.14em', marginBottom: 4 }}>AZIMUTH</div>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Outer ring */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#222" strokeWidth={1} />
        <circle cx={CX} cy={CY} r={R - 20} fill="none" stroke="#1A1A1A" strokeWidth={0.5} />
        {/* Grid background */}
        <circle cx={CX} cy={CY} r={R - 22} fill="rgba(10,10,10,0.8)" stroke="none" />
        {/* Crosshairs */}
        <line x1={CX - R + 4} y1={CY} x2={CX + R - 4} y2={CY} stroke="#1A1A1A" strokeWidth={0.5} />
        <line x1={CX} y1={CY - R + 4} x2={CX} y2={CY + R - 4} stroke="#1A1A1A" strokeWidth={0.5} />
        {/* Degree ticks + labels */}
        {ticks}
        {/* Needle */}
        <line
          x1={CX} y1={CY}
          x2={nx} y2={ny}
          stroke="#F5A623" strokeWidth={2}
          strokeLinecap="square"
        />
        {/* Tail */}
        <line
          x1={CX}
          y1={CY}
          x2={CX - 20 * Math.cos(needleRad)}
          y2={CY - 20 * Math.sin(needleRad)}
          stroke="#F5A623" strokeWidth={1} strokeOpacity={0.4}
        />
        {/* Centre dot */}
        <circle cx={CX} cy={CY} r={4} fill="#F5A623" />
        <circle cx={CX} cy={CY} r={2} fill="#000" />
        {/* Heading arc */}
        <circle cx={CX} cy={CY} r={R - 48}
          fill="none"
          stroke="#F5A62318"
          strokeWidth={6}
          strokeDasharray={`${((azimuth / 360) * 2 * Math.PI * (R - 48)).toFixed(1)} 9999`}
          strokeDashoffset={((R - 48) * Math.PI / 2).toFixed(1)}
          transform={`rotate(-90 ${CX} ${CY})`}
        />
      </svg>
      {/* Digital readout */}
      <div style={{
        fontSize: 22, color: '#F5A623', fontWeight: 700,
        letterSpacing: '0.06em', marginTop: -6,
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {String(Math.round(azimuth)).padStart(3, '0')}°
      </div>
    </div>
  )
}
