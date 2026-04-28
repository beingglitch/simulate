import { useState } from 'react'
import { useRCWSStore } from '../../store/useRCWSStore'
import { buildTrack, nextTrackId } from '../../utils/trackUtils'
import type { ThreatType, Priority } from '../../types'

const THREAT_TYPES: ThreatType[] = ['FPV_DRONE', 'RF_IED', 'ENEMY_RCWS', 'UNKNOWN']
const TYPE_LABEL: Record<ThreatType, string> = {
  FPV_DRONE:  'FPV DRONE',
  RF_IED:     'RF-IED',
  ENEMY_RCWS: 'ENEMY RCWS',
  UNKNOWN:    'UNKNOWN',
}

export default function TrackInjector() {
  const { injectTrack } = useRCWSStore()
  const [type,     setType]     = useState<ThreatType>('FPV_DRONE')
  const [bearing,  setBearing]  = useState(45)
  const [distance, setDistance] = useState(800)
  const [speed,    setSpeed]    = useState<number | ''>('')
  const [altitude, setAltitude] = useState<number | ''>('')
  const [priority, setPriority] = useState<Priority>(1)

  function inject() {
    const track = buildTrack(
      nextTrackId(), type, bearing, distance,
      speed === '' ? undefined : speed,
      altitude === '' ? undefined : altitude,
      priority,
    )
    injectTrack(track)
  }

  return (
    <div style={{ padding: '12px 14px' }}>
      <SectionLabel>INJECT TRACK</SectionLabel>

      {/* Threat type */}
      <div style={{ marginBottom: 10 }}>
        <FieldLabel>THREAT TYPE</FieldLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {THREAT_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '5px 4px', fontSize: 13, letterSpacing: '0.08em',
                border: `1px solid ${type === t ? '#00D4FF' : '#222'}`,
                color: type === t ? '#00D4FF' : '#555',
                background: type === t ? 'rgba(0,212,255,0.06)' : 'transparent',
                cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Bearing + Distance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <FieldLabel>BEARING (°)</FieldLabel>
          <NumberInput value={bearing} min={0} max={359} onChange={setBearing} />
        </div>
        <div>
          <FieldLabel>DISTANCE (m)</FieldLabel>
          <NumberInput value={distance} min={50} max={10000} onChange={setDistance} />
        </div>
      </div>

      {/* Speed + Altitude */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <FieldLabel>SPEED m/s (opt)</FieldLabel>
          <input
            type="number"
            value={speed}
            onChange={e => setSpeed(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="auto"
            style={inputStyle}
          />
        </div>
        <div>
          <FieldLabel>ALT m (opt)</FieldLabel>
          <input
            type="number"
            value={altitude}
            onChange={e => setAltitude(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="auto"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Priority */}
      <div style={{ marginBottom: 12 }}>
        <FieldLabel>PRIORITY</FieldLabel>
        <div style={{ display: 'flex', gap: 4 }}>
          {([1, 2, 3] as Priority[]).map(p => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              style={{
                flex: 1, padding: '4px', fontSize: 12, letterSpacing: '0.1em',
                border: `1px solid ${priority === p ? '#F5A623' : '#222'}`,
                color: priority === p ? '#F5A623' : '#444',
                background: priority === p ? 'rgba(245,166,35,0.06)' : 'transparent',
                cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              P{p}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={inject}
        style={{
          width: '100%', padding: '8px', fontSize: 13, letterSpacing: '0.14em', fontWeight: 700,
          border: '1px solid #FF2020', color: '#FF2020', background: 'rgba(255,32,32,0.06)',
          cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        INJECT TRACK
      </button>
    </div>
  )
}

function NumberInput({ value, min, max, onChange }: {
  value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <input
      type="number"
      value={value}
      min={min} max={max}
      onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
      style={inputStyle}
    />
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '4px 6px', fontSize: 13,
  background: '#050505', border: '1px solid #222',
  color: '#C8C8C0', fontFamily: 'JetBrains Mono, monospace',
  outline: 'none', boxSizing: 'border-box',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12, color: '#00D4FF', letterSpacing: '0.14em', marginBottom: 10, borderBottom: '1px solid #111', paddingBottom: 6 }}>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, color: '#666', letterSpacing: '0.1em', marginBottom: 3 }}>{children}</div>
  )
}
