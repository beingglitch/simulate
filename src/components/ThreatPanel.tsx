import type { SimState, Threat, ThreatType } from '../types'

const TYPE_LABEL: Record<ThreatType, string> = {
  FPV_DRONE:  'FPV Drone',
  RF_IED:     'RF-IED',
  ENEMY_RCWS: 'Enemy RCWS',
}
const TYPE_COLOR: Record<ThreatType, string> = {
  FPV_DRONE:  '#f05252',
  RF_IED:     '#f59e0b',
  ENEMY_RCWS: '#e050a0',
}
const STATUS_LABEL: Record<string, string> = {
  APPROACHING: 'APPROACHING',
  ENGAGED:     'ENGAGED',
  DESTROYED:   'DESTROYED',
  DISRUPTED:   'DISRUPTED',
  ESCAPED:     'ESCAPED',
}
const STATUS_COLOR: Record<string, string> = {
  APPROACHING: '#f05252',
  ENGAGED:     '#f59e0b',
  DESTROYED:   '#4a5568',
  DISRUPTED:   '#3dd68c',
  ESCAPED:     '#4a5568',
}

interface Props {
  state: SimState
  onSelect: (id: string) => void
  onSpawn: (type: ThreatType) => void
}

export default function ThreatPanel({ state, onSelect, onSpawn }: Props) {
  const active  = state.threats.filter(t => t.status === 'APPROACHING').length
  const neutral = state.threats.filter(t => t.status === 'DISRUPTED' || t.status === 'DESTROYED').length

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#0c1826', borderRight: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span className="mono" style={{ color: 'rgba(160,190,225,0.55)', fontSize: 9, letterSpacing: '0.12em' }}>
            TRACKS
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <span className="mono" style={{ color: '#f05252', fontSize: 10 }}>
              {active} HOSTILE
            </span>
            <span className="mono" style={{ color: '#4a5568', fontSize: 10 }}>
              {neutral} NEUTRALISED
            </span>
          </div>
        </div>
      </div>

      {/* Threat list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {state.threats.length === 0 && (
          <div className="mono" style={{ color: 'rgba(120,150,185,0.3)', fontSize: 11, textAlign: 'center', padding: 20 }}>
            NO TRACKS
          </div>
        )}
        {state.threats.map(t => (
          <TrackRow
            key={t.id}
            threat={t}
            selected={t.id === state.selectedThreatId}
            onSelect={() => onSelect(t.id)}
          />
        ))}
      </div>

      {/* Inject threat */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0,
      }}>
        <div className="mono" style={{ color: 'rgba(120,150,185,0.4)', fontSize: 9, letterSpacing: '0.1em', marginBottom: 6 }}>
          INJECT TRACK
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          {(['FPV_DRONE', 'RF_IED', 'ENEMY_RCWS'] as ThreatType[]).map(type => (
            <button
              key={type}
              onClick={() => onSpawn(type)}
              className="mono"
              style={{
                padding: '4px 2px', fontSize: 9, letterSpacing: '0.04em',
                border: '1px solid rgba(77,140,220,0.2)',
                background: 'transparent',
                color: 'rgba(140,175,215,0.55)',
                cursor: 'pointer',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.borderColor = 'rgba(77,140,220,0.45)'
                ;(e.target as HTMLElement).style.color = 'rgba(160,200,235,0.8)'
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.borderColor = 'rgba(77,140,220,0.2)'
                ;(e.target as HTMLElement).style.color = 'rgba(140,175,215,0.55)'
              }}
            >
              + {TYPE_LABEL[type].split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TrackRow({ threat: t, selected, onSelect }: {
  threat: Threat; selected: boolean; onSelect: () => void
}) {
  const color  = TYPE_COLOR[t.type]
  const active = t.status === 'APPROACHING'

  return (
    <div
      onClick={onSelect}
      style={{
        padding: '7px 14px',
        cursor: 'pointer',
        borderLeft: `2px solid ${selected ? '#4da6ff' : 'transparent'}`,
        background: selected ? 'rgba(77,166,255,0.07)' : 'transparent',
        transition: 'background 0.1s, border-color 0.1s',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
      onMouseEnter={e => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
      }}
      onMouseLeave={e => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          {active && (
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f05252', flexShrink: 0 }}
              className="blink" />
          )}
          {!active && (
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_COLOR[t.status], flexShrink: 0 }} />
          )}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="mono" style={{ color: selected ? '#90c8f8' : '#c8ddf0', fontSize: 12, fontWeight: 600 }}>
                {t.id}
              </span>
              <span
                className="mono"
                style={{
                  fontSize: 9, letterSpacing: '0.05em', padding: '1px 4px',
                  border: `1px solid ${color}40`, color: color, opacity: 0.85,
                }}
              >
                {TYPE_LABEL[t.type].toUpperCase()}
              </span>
            </div>
            <div className="mono" style={{ color: 'rgba(140,170,205,0.4)', fontSize: 9, marginTop: 2 }}>
              {t.rfFingerprint}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ color: STATUS_COLOR[t.status], fontSize: 9, letterSpacing: '0.05em' }}>
            {STATUS_LABEL[t.status]}
          </div>
          <div className="mono" style={{ color: 'rgba(160,190,225,0.5)', fontSize: 11, marginTop: 2 }}>
            {Math.round(t.range)}m
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 5, paddingTop: 5, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <StatMini label="BRG" value={`${t.bearing.toFixed(0)}°`} />
        <StatMini label="SPD" value={`${t.speed}m/s`} />
        <StatMini label="PRI" value={`P${t.priority}`} />
      </div>
    </div>
  )
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono" style={{ color: 'rgba(120,150,185,0.4)', fontSize: 8, letterSpacing: '0.08em' }}>{label}</div>
      <div className="mono" style={{ color: 'rgba(180,205,235,0.7)', fontSize: 10 }}>{value}</div>
    </div>
  )
}
