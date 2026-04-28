import { useState } from 'react'
import { useRCWSStore } from '../../store/useRCWSStore'
import type { MultiContactConfig } from '../../types'

export default function MultiContactInjector() {
  const { injectMultiContact } = useRCWSStore()
  const [cfg, setCfg] = useState<MultiContactConfig>({
    count:         6,
    centreBearing: 0,
    bearingSpread: 45,
    distanceMin:   800,
    distanceMax:   2000,
  })

  function update<K extends keyof MultiContactConfig>(key: K, val: MultiContactConfig[K]) {
    setCfg(c => ({ ...c, [key]: val }))
  }

  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: 12, color: '#00D4FF', letterSpacing: '0.14em', marginBottom: 10, borderBottom: '1px solid #111', paddingBottom: 6 }}>
        MULTI-CONTACT INJECT
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: 12 }}>
        <Field label="COUNT (3-12)" value={cfg.count} min={3} max={12}
          onChange={v => update('count', v)} />
        <Field label="CENTRE BRG (°)" value={cfg.centreBearing} min={0} max={359}
          onChange={v => update('centreBearing', v)} />
        <Field label="BRG SPREAD (°)" value={cfg.bearingSpread} min={5} max={120}
          onChange={v => update('bearingSpread', v)} />
        <Field label="DIST MIN (m)" value={cfg.distanceMin} min={200} max={5000}
          onChange={v => update('distanceMin', v)} />
        <Field label="DIST MAX (m)" value={cfg.distanceMax} min={200} max={5000}
          onChange={v => update('distanceMax', v)} />
      </div>

      <div style={{
        padding: '6px 8px', background: '#050505', border: '1px solid #111',
        marginBottom: 10, fontSize: 13, color: '#777', letterSpacing: '0.08em',
      }}>
        {cfg.count} × MIXED · BRG {cfg.centreBearing}° ±{cfg.bearingSpread}° · {cfg.distanceMin}–{cfg.distanceMax}m
      </div>
      <div style={{
        fontSize: 13, color: '#555', letterSpacing: '0.08em', marginBottom: 10,
      }}>
        Types: FPV / RF-IED / ENEMY RCWS / UNKNOWN (cycled)
      </div>

      <button
        onClick={() => injectMultiContact(cfg)}
        style={{
          width: '100%', padding: '8px', fontSize: 13, letterSpacing: '0.14em', fontWeight: 700,
          border: '1px solid #FF2020', color: '#FF2020', background: 'rgba(255,32,32,0.06)',
          cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        INJECT {cfg.count} CONTACTS
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
