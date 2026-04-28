import { useState } from 'react'
import { useRCWSStore } from '../../store/useRCWSStore'
import type { SwarmConfig } from '../../types'

export default function SwarmInjector() {
  const { injectSwarm } = useRCWSStore()
  const [cfg, setCfg] = useState<SwarmConfig>({
    size:          8,
    centreBearing: 0,
    bearingSpread: 30,
    distance:      1000,
    speed:         12,
    altitude:      60,
  })

  function update<K extends keyof SwarmConfig>(key: K, val: SwarmConfig[K]) {
    setCfg(c => ({ ...c, [key]: val }))
  }

  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: 12, color: '#00D4FF', letterSpacing: '0.14em', marginBottom: 10, borderBottom: '1px solid #111', paddingBottom: 6 }}>
        INJECT SWARM
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: 12 }}>
        <Field label="SIZE" value={cfg.size} min={2} max={24}
          onChange={v => update('size', v)} />
        <Field label="CENTRE BRG (°)" value={cfg.centreBearing} min={0} max={359}
          onChange={v => update('centreBearing', v)} />
        <Field label="BRG SPREAD (°)" value={cfg.bearingSpread} min={5} max={90}
          onChange={v => update('bearingSpread', v)} />
        <Field label="DISTANCE (m)" value={cfg.distance} min={100} max={10000}
          onChange={v => update('distance', v)} />
        <Field label="SPEED (m/s)" value={cfg.speed} min={1} max={40}
          onChange={v => update('speed', v)} />
        <Field label="ALTITUDE (m)" value={cfg.altitude} min={10} max={300}
          onChange={v => update('altitude', v)} />
      </div>

      {/* Preview row */}
      <div style={{
        padding: '6px 8px', background: '#050505', border: '1px solid #111',
        marginBottom: 10, fontSize: 13, color: '#777', letterSpacing: '0.08em',
      }}>
        {cfg.size} × SWARM · BRG {cfg.centreBearing}° ±{cfg.bearingSpread}° · {cfg.distance}m · {cfg.speed}m/s
      </div>

      <button
        onClick={() => injectSwarm(cfg)}
        style={{
          width: '100%', padding: '8px', fontSize: 13, letterSpacing: '0.14em', fontWeight: 700,
          border: '1px solid #FF2020', color: '#FF2020', background: 'rgba(255,32,32,0.06)',
          cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        INJECT SWARM
      </button>
    </div>
  )
}

function Field({
  label, value, min, max, onChange,
}: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <div>
      <div style={{ fontSize: 13, color: '#666', letterSpacing: '0.1em', marginBottom: 3 }}>{label}</div>
      <input
        type="number"
        value={value}
        min={min} max={max}
        onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
        style={{
          width: '100%', padding: '4px 6px', fontSize: 13,
          background: '#050505', border: '1px solid #222',
          color: '#C8C8C0', fontFamily: 'JetBrains Mono, monospace',
          outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
