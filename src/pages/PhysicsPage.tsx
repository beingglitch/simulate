import { useState, useRef, useEffect, useCallback } from 'react'

const TABS = [
  'WHAT IS DIRECTED EMP',
  'PULSE GENERATION',
  'PROPAGATION',
  'TARGET INTERACTION',
  'SYSTEM ARCHITECTURE',
]

export default function PhysicsPage() {
  const [tab, setTab] = useState(0)

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      {/* Header */}
      <div style={{
        height: 36, flexShrink: 0, borderBottom: '1px solid #1A1A1A',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
      }}>
        <span style={{ fontSize: 13, color: '#F5A623', fontWeight: 700, letterSpacing: '0.16em' }}>
          EMP PHYSICS · EDUCATIONAL MODULE
        </span>
        <div style={{ flex: 1 }} />
        <a href="/operator" style={{
          fontSize: 11, color: '#555', letterSpacing: '0.12em',
          textDecoration: 'none', border: '1px solid #1A1A1A', padding: '3px 8px',
        }}>← OPERATOR VIEW</a>
      </div>

      {/* Tab bar */}
      <div style={{
        height: 36, flexShrink: 0, display: 'flex',
        borderBottom: '1px solid #1A1A1A', background: '#000',
      }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding: '0 14px', fontSize: 10, letterSpacing: '0.12em', fontWeight: 700,
            border: 'none', borderRight: '1px solid #111',
            borderBottom: i === tab ? '2px solid #00D4FF' : '2px solid transparent',
            background: i === tab ? 'rgba(0,212,255,0.04)' : 'transparent',
            color: i === tab ? '#00D4FF' : '#444',
            cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap',
          }}>
            {String(i + 1).padStart(2, '0')} {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tab === 0 && <Tab1DirectedEMP />}
        {tab === 1 && <Tab2PulseGeneration />}
        {tab === 2 && <Tab3Propagation />}
        {tab === 3 && <Tab4TargetInteraction />}
        {tab === 4 && <Tab5Architecture />}
      </div>
    </div>
  )
}

// ── TAB 1 — WHAT IS DIRECTED EMP ─────────────────────────────────
function Tab1DirectedEMP() {
  const [beamWidth, setBeamWidth] = useState(15)
  const omniRef  = useRef<HTMLCanvasElement>(null)
  const dirRef   = useRef<HTMLCanvasElement>(null)

  const density = +(1 / (Math.PI * 1 * (beamWidth * Math.PI / 180) ** 2) * 0.5).toFixed(2)

  useEffect(() => {
    const canvas = omniRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const cx = W / 2, cy = H / 2
    for (let r = 10; r < Math.min(W, H) / 2 - 5; r += 14) {
      const alpha = 0.6 - r / (Math.min(W, H) / 2)
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(245,166,35,${Math.max(0, alpha)})`
      ctx.lineWidth = 2
      ctx.stroke()
    }
    ctx.fillStyle = '#F5A623'
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#F5A62380'
    ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center'
    ctx.fillText('OMNIDIRECTIONAL', cx, H - 6)
    ctx.fillText('Energy dissipates in all directions', cx, H - 18)
  }, [])

  useEffect(() => {
    const canvas = dirRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const cx = W / 2, cy = H
    const halfAngle = (beamWidth / 2) * Math.PI / 180
    const maxR = H - 10

    const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, maxR)
    grad.addColorStop(0, 'rgba(245,166,35,0.9)')
    grad.addColorStop(0.4, 'rgba(245,166,35,0.5)')
    grad.addColorStop(1,   'rgba(245,166,35,0)')

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, maxR, -Math.PI / 2 - halfAngle, -Math.PI / 2 + halfAngle)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    ctx.fillStyle = '#F5A623'
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill()

    ctx.fillStyle = '#F5A62380'
    ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center'
    ctx.fillText('DIRECTED', W / 2, 14)
    ctx.fillText(`Beam width: ${beamWidth}° — energy focused`, W / 2, 26)
  }, [beamWidth])

  return (
    <div style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
      <Section title="DIRECTED VS OMNIDIRECTIONAL EMP">
        <p style={pStyle}>
          Conventional EMP radiates energy equally in all directions — intensity falls off as 1/r² uniformly.
          A directed EMP concentrates all available power into a narrow beam, maintaining field strength at range.
        </p>

        <div style={{ display: 'flex', gap: 24, marginBottom: 24, justifyContent: 'center' }}>
          <canvas ref={omniRef} width={220} height={200} style={{ background: '#040404', border: '1px solid #111' }} />
          <canvas ref={dirRef}  width={220} height={200} style={{ background: '#040404', border: '1px solid #111' }} />
        </div>

        <Label>BEAM WIDTH</Label>
        <input type="range" min={5} max={60} value={beamWidth} onChange={e => setBeamWidth(+e.target.value)}
          style={{ width: '100%', marginBottom: 8, accentColor: '#F5A623' }} />
        <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
          <Metric label="BEAM WIDTH" value={`${beamWidth}°`} />
          <Metric label="ENERGY DENSITY AT 1km" value={`${density.toFixed(2)} MW/m²`} color="#F5A623" />
          <Metric label="FORMULA" value="I = P / (π·r²·θ²)" />
        </div>
        <CodeBlock>{`I = P_peak / (π × r² × θ²)
Where:
  P_peak = 450 MW (EMP-RCWS peak power)
  r      = range in metres
  θ      = beam half-angle in radians

At ${beamWidth}° beam, 1km: I ≈ ${density.toFixed(3)} MW/m²
Narrower beam = higher intensity at target`}</CodeBlock>
      </Section>
    </div>
  )
}

// ── TAB 2 — PULSE GENERATION ─────────────────────────────────────
function Tab2PulseGeneration() {
  const [pulseWidth, setPulseWidth] = useState(20)
  const oscRef = useRef<HTMLCanvasElement>(null)

  const riseTime  = 2
  const dVdt      = (450 / riseTime).toFixed(0)

  useEffect(() => {
    const canvas = oscRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    // Grid
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1
    for (let x = 0; x <= W; x += W / 10) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H - 20); ctx.stroke()
    }
    for (let y = 0; y <= H - 20; y += (H - 20) / 5) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    }

    // Axes labels
    ctx.fillStyle = '#444'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center'
    ctx.fillText('TIME (ns)', W / 2, H - 4)
    ctx.save(); ctx.rotate(-Math.PI / 2)
    ctx.fillText('POWER (MW)', -(H - 20) / 2, 10)
    ctx.restore()

    // Scale
    const nsMax = 100, mwMax = 500
    const tX = (t: number) => 10 + (t / nsMax) * (W - 20)
    const pY = (p: number) => (H - 20) - (p / mwMax) * (H - 24) + 2

    // Pulse waveform
    ctx.beginPath()
    ctx.moveTo(tX(0), pY(0))
    ctx.lineTo(tX(riseTime), pY(450))
    ctx.lineTo(tX(riseTime + pulseWidth), pY(450))
    ctx.lineTo(tX(riseTime + pulseWidth + 4), pY(0))
    ctx.lineTo(tX(100), pY(0))
    ctx.strokeStyle = '#F5A623'; ctx.lineWidth = 2; ctx.stroke()

    // Fill under pulse
    ctx.beginPath()
    ctx.moveTo(tX(0), pY(0))
    ctx.lineTo(tX(riseTime), pY(450))
    ctx.lineTo(tX(riseTime + pulseWidth), pY(450))
    ctx.lineTo(tX(riseTime + pulseWidth + 4), pY(0))
    ctx.closePath()
    ctx.fillStyle = 'rgba(245,166,35,0.12)'; ctx.fill()

    // Peak annotation
    ctx.fillStyle = '#F5A623'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'left'
    ctx.fillText('450 MW', tX(riseTime + 2), pY(450) - 5)
    ctx.fillStyle = '#888'
    ctx.fillText(`Rise: ${riseTime}ns`, tX(riseTime / 2 - 2), pY(250))
  }, [pulseWidth])

  return (
    <div style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
      <Section title="PULSE GENERATION CHAIN">
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, overflowX: 'auto' }}>
          {[
            ['CAP BANK', '450kV'],
            ['SWITCH', 'Marx Gen'],
            ['PULSE FORMER', 'PFL shaping'],
            ['RF OSC', '3GHz'],
            ['AMPLIFIER', '450MW'],
            ['ANTENNA', 'Phased Array'],
          ].map(([label, sub], i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                padding: '10px 14px', border: '1px solid #222', background: '#050505',
                minWidth: 100, textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, color: '#F5A623', letterSpacing: '0.1em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em' }}>{sub}</div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ color: '#333', fontSize: 16, padding: '0 4px' }}>→</div>
              )}
            </div>
          ))}
        </div>

        <Label>PULSE WIDTH: {pulseWidth}ns</Label>
        <input type="range" min={5} max={100} value={pulseWidth}
          onChange={e => setPulseWidth(+e.target.value)}
          style={{ width: '100%', marginBottom: 16, accentColor: '#F5A623' }} />

        <canvas ref={oscRef} width={600} height={200}
          style={{ width: '100%', background: '#040404', border: '1px solid #1A1A1A', display: 'block', marginBottom: 16 }} />

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Metric label="PEAK POWER"   value="450 MW" color="#F5A623" />
          <Metric label="PULSE WIDTH"  value={`${pulseWidth} ns`} />
          <Metric label="RISE TIME"    value={`${riseTime} ns`} />
          <Metric label="dV/dt"        value={`${dVdt} MV/ns`} color="#FF2020" />
        </div>
        <p style={{ ...pStyle, marginTop: 12, color: '#555' }}>
          Faster rise time (smaller dV/dt denominator) = more energy deposited in E1 frequency band.
          Short pulse with fast rise maximises damage to unshielded electronics.
        </p>
      </Section>
    </div>
  )
}

// ── TAB 3 — PROPAGATION ──────────────────────────────────────────
function Tab3Propagation() {
  const [rangeM, setRangeM] = useState(500)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const fieldStrength = Math.sqrt((450e6 * 25) / (4 * Math.PI * rangeM ** 2)).toFixed(0)
  const killThreshold = 200
  const canKill = +fieldStrength >= killThreshold

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    // Background
    ctx.fillStyle = '#030303'; ctx.fillRect(0, 0, W, H)

    const emitterX = 40, targetX = W - 40, midY = H / 2

    // Beam cone
    const maxHalfWidth = H * 0.35
    const grad = ctx.createLinearGradient(emitterX, midY, targetX, midY)
    grad.addColorStop(0, 'rgba(245,166,35,0.85)')
    grad.addColorStop(1, `rgba(245,166,35,${Math.max(0.05, 0.85 * (200 / Math.max(+fieldStrength, 1)) ** 0.5)})`)

    ctx.beginPath()
    ctx.moveTo(emitterX, midY)
    ctx.lineTo(targetX, midY - maxHalfWidth * (rangeM / 1000))
    ctx.lineTo(targetX, midY + maxHalfWidth * (rangeM / 1000))
    ctx.closePath()
    ctx.fillStyle = grad; ctx.fill()

    // Emitter
    ctx.fillStyle = '#F5A623'
    ctx.beginPath(); ctx.arc(emitterX, midY, 8, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#888'; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center'
    ctx.fillText('EMITTER', emitterX, midY + 22)

    // Target
    ctx.fillStyle = canKill ? '#FF2020' : '#555'
    ctx.fillRect(targetX - 8, midY - 20, 16, 40)
    ctx.fillStyle = '#888'; ctx.textAlign = 'center'
    ctx.fillText('TARGET', targetX, midY + 34)
    ctx.fillText(`${rangeM}m`, targetX, midY - 28)

    // Kill threshold marker
    const killX = emitterX + (targetX - emitterX) * Math.min(1, Math.sqrt((450e6 * 25) / (4 * Math.PI * killThreshold ** 2)) / rangeM * 0)
    void killX
    ctx.strokeStyle = '#FF202060'; ctx.lineWidth = 1; ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H)
    ctx.stroke(); ctx.setLineDash([])
    ctx.fillStyle = '#FF202060'; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center'
    ctx.fillText(`E = ${fieldStrength} V/m`, targetX, midY - 10)

  }, [rangeM, fieldStrength, canKill])

  return (
    <div style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
      <Section title="FIELD PROPAGATION">
        <Label>TARGET RANGE: {rangeM}m</Label>
        <input type="range" min={100} max={1000} value={rangeM}
          onChange={e => setRangeM(+e.target.value)}
          style={{ width: '100%', marginBottom: 16, accentColor: '#F5A623' }} />

        <canvas ref={canvasRef} width={600} height={180}
          style={{ width: '100%', background: '#030303', border: '1px solid #1A1A1A', display: 'block', marginBottom: 16 }} />

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 12 }}>
          <Metric label="RANGE"          value={`${rangeM} m`} />
          <Metric label="FIELD STRENGTH" value={`${fieldStrength} V/m`}
            color={canKill ? '#FF2020' : '#555'} />
          <Metric label="KILL THRESHOLD" value="200 V/m" color="#FF202070" />
          <Metric label="STATUS"         value={canKill ? 'LETHAL' : 'SUB-LETHAL'}
            color={canKill ? '#FF2020' : '#444'} />
        </div>

        <CodeBlock>{`E = √(P · G / (4π · r²))
Where:
  P = 450 MW peak power
  G = 25 (antenna gain, ~14 dBi)
  r = ${rangeM} m

E = ${fieldStrength} V/m at ${rangeM}m
Kill threshold (unshielded): 200 V/m → max lethal range ≈ 944m`}</CodeBlock>
      </Section>
    </div>
  )
}

// ── TAB 4 — TARGET INTERACTION ───────────────────────────────────
type TargetType = 'COMMERCIAL_FPV' | 'SEMI_HARDENED' | 'MILITARY_GRADE'

function Tab4TargetInteraction() {
  const [target, setTarget] = useState<TargetType>('COMMERCIAL_FPV')
  const [animStep, setAnimStep] = useState(0)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const targets: { id: TargetType; label: string; killProb: number; desc: string; shielding: string }[] = [
    { id: 'COMMERCIAL_FPV',  label: 'COMMERCIAL FPV',  killProb: 94, desc: 'Minimal shielding, exposed PCB', shielding: 'NONE' },
    { id: 'SEMI_HARDENED',   label: 'SEMI-HARDENED',   killProb: 67, desc: 'Partial metal enclosure',       shielding: 'PARTIAL' },
    { id: 'MILITARY_GRADE',  label: 'MILITARY GRADE',  killProb: 8,  desc: 'Full Faraday cage',            shielding: 'FULL' },
  ]

  const sel = targets.find(t => t.id === target)!

  function runAnimation() {
    setAnimStep(0)
    if (animRef.current) clearInterval(animRef.current)
    let step = 0
    animRef.current = setInterval(() => {
      step++
      setAnimStep(step)
      if (step >= 6) { clearInterval(animRef.current!); animRef.current = null }
    }, 500)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#030303'; ctx.fillRect(0, 0, W, H)

    const isMil = target === 'MILITARY_GRADE'
    const cx = W / 2, cy = H / 2

    if (isMil) {
      // Faraday cage
      ctx.strokeStyle = '#444'; ctx.lineWidth = 8
      ctx.strokeRect(cx - 60, cy - 50, 120, 100)
      ctx.strokeStyle = '#F5A62360'; ctx.lineWidth = 3
      ctx.strokeRect(cx - 58, cy - 48, 116, 96)
    }

    // PCB
    const pcbColor = animStep === 0 ? '#004400' :
                     animStep >= 5 ? '#1A0000' :
                     animStep >= 3 ? '#FF660030' : '#006600'
    ctx.fillStyle = pcbColor
    ctx.fillRect(cx - 40, cy - 30, 80, 60)
    ctx.strokeStyle = '#00AA0060'; ctx.lineWidth = 1
    ctx.strokeRect(cx - 40, cy - 30, 80, 60)

    // Components
    ;[[cx - 20, cy - 10], [cx, cy], [cx + 15, cy - 15], [cx - 10, cy + 12]].forEach(([x, y]) => {
      const compColor = animStep >= 5 ? '#440000' : animStep >= 4 ? '#FF2020' : '#00FF41'
      ctx.fillStyle = compColor
      ctx.fillRect(x - 5, y - 5, 10, 10)
    })

    // EMP wave
    if (animStep >= 1 && animStep <= 3 && !isMil) {
      for (let i = 1; i <= animStep; i++) {
        ctx.beginPath()
        ctx.arc(cx - 120, cy, i * 30, -0.8, 0.8)
        ctx.strokeStyle = `rgba(245,166,35,${0.8 - i * 0.15})`
        ctx.lineWidth = 2; ctx.stroke()
      }
    }

    // Faraday deflection
    if (animStep >= 1 && isMil) {
      ctx.strokeStyle = '#F5A62390'; ctx.lineWidth = 2
      ;[[-0.5, 0.5], [-0.3, 0.3]].forEach(([a, b]) => {
        ctx.beginPath()
        ctx.arc(cx - 80, cy, 50, a, b); ctx.stroke()
      })
      ctx.fillStyle = '#F5A623'; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center'
      ctx.fillText('FIELD DEFLECTED', cx, cy + 70)
    }

    if (animStep >= 5 && !isMil) {
      ctx.fillStyle = '#FF2020'; ctx.font = 'bold 11px JetBrains Mono'; ctx.textAlign = 'center'
      ctx.fillText('JUNCTION DESTROYED', cx, cy + 55)
    }
  }, [animStep, target])

  const ANIM_LABELS = [
    'Normal operation — components active',
    'EMP beam impact — wave front arriving',
    'Induced currents — orange current paths',
    'Voltage spike on transistor junction',
    'Breakdown threshold exceeded',
    target === 'MILITARY_GRADE' ? 'Faraday shielding — PCB untouched' : 'Component burned out — permanent damage',
  ]

  return (
    <div style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
      <Section title="TARGET VULNERABILITY ANALYSIS">
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {targets.map(t => (
            <button key={t.id} onClick={() => { setTarget(t.id); setAnimStep(0) }} style={{
              flex: 1, padding: '8px 10px', fontSize: 11, letterSpacing: '0.08em', fontWeight: 700,
              border: `1px solid ${target === t.id ? '#00D4FF' : '#222'}`,
              color: target === t.id ? '#00D4FF' : '#555',
              background: target === t.id ? 'rgba(0,212,255,0.06)' : 'transparent',
              cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
            }}>
              <div>{t.label}</div>
              <div style={{ fontSize: 10, color: target === t.id ? '#00D4FF90' : '#333', marginTop: 2 }}>{t.shielding}</div>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <canvas ref={canvasRef} width={400} height={200}
              style={{ width: '100%', background: '#030303', border: '1px solid #1A1A1A', display: 'block', marginBottom: 10 }} />
            <button onClick={runAnimation} style={{
              width: '100%', padding: '7px', fontSize: 11, letterSpacing: '0.14em', fontWeight: 700,
              border: '1px solid #F5A62360', color: '#F5A623', background: 'rgba(245,166,35,0.06)',
              cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
            }}>
              RUN EMP SIMULATION
            </button>
          </div>
          <div style={{ width: 240, flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.1em', marginBottom: 8 }}>SEQUENCE</div>
            {ANIM_LABELS.map((label, i) => (
              <div key={i} style={{
                padding: '5px 8px', marginBottom: 4, fontSize: 11, letterSpacing: '0.06em',
                border: `1px solid ${animStep === i ? '#F5A62360' : '#111'}`,
                color: animStep > i ? '#00FF41' : animStep === i ? '#F5A623' : '#333',
                background: animStep === i ? 'rgba(245,166,35,0.05)' : 'transparent',
              }}>
                {animStep > i ? '✓ ' : animStep === i ? '▶ ' : '  '}{label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Metric label="TARGET"      value={sel.label} />
          <Metric label="SHIELDING"   value={sel.shielding} />
          <Metric label="KILL PROB"   value={`${sel.killProb}%`}
            color={sel.killProb > 80 ? '#FF2020' : sel.killProb > 40 ? '#F5A623' : '#555'} />
          <Metric label="AT 1km"      value="450MW system" />
        </div>
        {target === 'MILITARY_GRADE' && (
          <p style={{ ...pStyle, color: '#555', marginTop: 8 }}>
            Full Faraday cage blocks field penetration. To achieve kill: estimated 4.2 GW output required,
            or physical proximity &lt;50m for junction damage via aperture leakage.
          </p>
        )}
      </Section>
    </div>
  )
}

// ── TAB 5 — SYSTEM ARCHITECTURE ─────────────────────────────────
function Tab5Architecture() {
  const [selected, setSelected] = useState<number | null>(null)

  const blocks = [
    {
      label: 'POWER SUPPLY',
      sub: '460kV DC',
      desc: 'High-voltage primary power supply. Charges capacitor bank to 450kV in 2.5 seconds.',
      specs: 'Voltage: 460kV\nCapacity: 50kJ\nCharge time: 2.5s\nEfficiency: 94%',
    },
    {
      label: 'CAP BANK',
      sub: '450kV / 50kJ',
      desc: 'Marx generator capacitor bank. Stores energy for single pulse discharge.',
      specs: 'Configuration: Marx stack\nCapacitance: 240nF\nPeak voltage: 450kV\nCycles: 10,000+',
    },
    {
      label: 'PULSE FORMER',
      sub: 'PFL / 20ns',
      desc: 'Pulse-forming line shapes discharge into precise rectangular pulse with fast rise time.',
      specs: 'Pulse width: 20ns\nRise time: <2ns\nPeak power: 450MW\ndV/dt: 225 MV/ns',
    },
    {
      label: 'RF OSCILLATOR',
      sub: '3 GHz',
      desc: 'Generates carrier frequency. Phase locked to beam steering controller.',
      specs: 'Frequency: 2–4 GHz\nTunable: ±500MHz\nPhase noise: <-120 dBc\nStability: ±1 ppm',
    },
    {
      label: 'AMPLIFIER',
      sub: '450 MW',
      desc: 'Solid-state GaN power amplifier array. 32 elements driven in phase.',
      specs: 'Peak output: 450MW\nGain: 52 dB\nBandwidth: S-band\nElements: 32 × GaN HEMT',
    },
    {
      label: 'PHASED ARRAY',
      sub: 'S-band · ±45°',
      desc: 'Primary emitter. Electronic beam steering enables rapid target engagement without mechanical movement.',
      specs: 'Aperture: 1.2 × 0.8m\nElements: 256\nSteering: ±45°\nBeam width: 3.2° @ 3GHz\nPeak EIRP: 450MW',
    },
  ]

  const sel = selected !== null ? blocks[selected] : null

  return (
    <div style={{ padding: 28, maxWidth: 900, margin: '0 auto' }}>
      <Section title="SYSTEM BLOCK DIAGRAM">
        <div style={{ fontSize: 12, color: '#555', marginBottom: 20, letterSpacing: '0.08em' }}>
          Click any block to view detailed specifications.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24, flexWrap: 'wrap', rowGap: 8 }}>
          {blocks.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => setSelected(selected === i ? null : i)} style={{
                padding: '12px 14px', minWidth: 110, textAlign: 'center',
                border: `1px solid ${selected === i ? '#F5A623' : '#1A1A1A'}`,
                background: selected === i ? 'rgba(245,166,35,0.08)' : '#030303',
                cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
                transition: 'all 0.1s',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: selected === i ? '#F5A623' : '#888', letterSpacing: '0.1em', marginBottom: 3 }}>
                  {b.label}
                </div>
                <div style={{ fontSize: 10, color: selected === i ? '#F5A62380' : '#333' }}>{b.sub}</div>
              </button>
              {i < blocks.length - 1 && (
                <div style={{ color: '#444', fontSize: 18, padding: '0 6px' }}>→</div>
              )}
            </div>
          ))}
          <div style={{ color: '#444', fontSize: 18, padding: '0 6px' }}>→</div>
          <div style={{ padding: '12px 14px', border: '1px solid #FF202040', background: 'rgba(255,32,32,0.04)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FF202090', letterSpacing: '0.1em', marginBottom: 3 }}>TARGET</div>
            <div style={{ fontSize: 10, color: '#FF202050' }}>Electronics</div>
          </div>
        </div>

        {sel && (
          <div style={{
            padding: '16px 20px', border: '1px solid #F5A62330', background: 'rgba(245,166,35,0.04)',
            animation: 'none',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#F5A623', letterSpacing: '0.12em', marginBottom: 8 }}>
              {sel.label}
            </div>
            <p style={{ ...pStyle, marginBottom: 12 }}>{sel.desc}</p>
            <CodeBlock>{sel.specs}</CodeBlock>
          </div>
        )}
      </Section>
    </div>
  )
}

// ── Shared UI primitives ─────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 11, color: '#00D4FF', letterSpacing: '0.18em',
        borderBottom: '1px solid #111', paddingBottom: 8, marginBottom: 20,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, color: '#666', letterSpacing: '0.12em', marginBottom: 6 }}>{children}</div>
}

function Metric({ label, value, color = '#888' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: '8px 14px', border: '1px solid #111', background: '#030303' }}>
      <div style={{ fontSize: 10, color: '#444', letterSpacing: '0.1em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color, fontWeight: 700, letterSpacing: '0.06em' }}>{value}</div>
    </div>
  )
}

function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre style={{
      background: '#030303', border: '1px solid #111',
      padding: '12px 14px', fontSize: 11, color: '#777',
      letterSpacing: '0.04em', lineHeight: 1.7,
      overflowX: 'auto', margin: 0,
    }}>
      {children}
    </pre>
  )
}

const pStyle: React.CSSProperties = {
  fontSize: 12, color: '#888', letterSpacing: '0.04em', lineHeight: 1.7, margin: '0 0 12px',
}
