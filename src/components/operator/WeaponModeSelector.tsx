import { useRCWSStore } from '../../store/useRCWSStore'
import type { WeaponMode } from '../../types'

const MODES: { id: WeaponMode; label: string; desc: string; color: string }[] = [
  { id: 'RF_JAM',       label: 'RF JAM',       desc: 'Disrupts C2 uplink — 10km range',        color: '#00D4FF' },
  { id: 'DIRECTED_EMP', label: 'DIRECTED EMP',  desc: 'Hard-kills electronics — 3km range',     color: '#F5A623' },
  { id: 'KINETIC',      label: 'KINETIC',       desc: 'Physical engagement — proximity fuze',   color: '#FF2020' },
]

export default function WeaponModeSelector() {
  const { mode, setMode } = useRCWSStore()

  return (
    <div style={{ padding: '10px 12px' }}>
      <div style={{ fontSize: 12, color: '#777', letterSpacing: '0.14em', marginBottom: 8 }}>
        WEAPON MODE
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {MODES.map(m => {
          const active = mode === m.id
          return (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              style={{
                padding: '8px 12px',
                border: `1px solid ${active ? m.color : '#222'}`,
                background: active ? `${m.color}14` : 'transparent',
                color: active ? m.color : '#444',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'JetBrains Mono, monospace',
                boxShadow: active ? `0 0 8px ${m.color}30, inset 0 0 8px ${m.color}08` : 'none',
                transition: 'all 0.12s',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em' }}>{m.label}</div>
              {active && (
                <div style={{ fontSize: 12, color: `${m.color}80`, marginTop: 2, letterSpacing: '0.06em' }}>
                  {m.desc}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
