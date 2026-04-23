import type { SimState } from '../types'

const ZONES = [
  { label: 'EMP Hard-Kill',  range: '50 – 150m',  color: '#e03030', desc: 'Destroys electronics' },
  { label: 'EMP Disruption', range: '150 – 600m',  color: '#d09000', desc: 'Disables systems' },
  { label: 'RF Jam Zone',    range: '300m – 1km',  color: '#3080c0', desc: 'Comms jammed' },
]

const MODE_COLOR: Record<string, string> = {
  RF_JAM:       '#4da6ff',
  DIRECTED_EMP: '#f59e0b',
  KINETIC:      '#f05252',
}

interface Props {
  state: SimState
  /** When true, renders only zones + track types (no wrapper panel chrome) */
  compact?: boolean
}

export default function ZoneLegend({ state, compact }: Props) {
  const modeColor = MODE_COLOR[state.turret.mode] ?? '#4da6ff'

  const zonesContent = (
    <>
      {/* Zone legend */}
      <div style={{ marginBottom: 12 }}>
        {ZONES.map(z => (
          <div key={z.label} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 2,
              background: z.color, opacity: 0.85,
            }} />
            <div>
              <div className="mono" style={{ color: 'rgba(200,220,245,0.75)', fontSize: 10 }}>{z.label}</div>
              <div className="mono" style={{ color: 'rgba(130,160,195,0.45)', fontSize: 9 }}>
                {z.range} · {z.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Threat key */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
        <div className="mono" style={{ color: 'rgba(120,150,185,0.4)', fontSize: 9, letterSpacing: '0.1em', marginBottom: 6 }}>
          TRACK TYPES
        </div>
        {[
          { letter: 'F', label: 'FPV Drone',   color: '#f05252' },
          { letter: 'I', label: 'RF-IED',       color: '#f59e0b' },
          { letter: 'R', label: 'Enemy RCWS',   color: '#e050a0' },
        ].map(t => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <div className="mono" style={{
              width: 16, height: 16, border: `1.5px solid ${t.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: t.color, fontSize: 9, fontWeight: 700,
              background: `${t.color}12`,
            }}>{t.letter}</div>
            <span className="mono" style={{ color: 'rgba(170,200,230,0.55)', fontSize: 10 }}>{t.label}</span>
          </div>
        ))}
      </div>
    </>
  )

  if (compact) return <>{zonesContent}</>

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#0c1826', borderLeft: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Header */}
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <span className="mono" style={{ color: 'rgba(160,190,225,0.55)', fontSize: 9, letterSpacing: '0.12em' }}>
          ENGAGEMENT ZONES
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {zonesContent}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12, marginTop: 12, marginBottom: 16 }}>
          <div className="mono" style={{ color: 'rgba(120,150,185,0.4)', fontSize: 9, letterSpacing: '0.1em', marginBottom: 8 }}>
            ACTIVE MODE
          </div>
          <div style={{
            padding: '7px 10px',
            border: `1px solid ${modeColor}30`,
            background: `${modeColor}08`,
          }}>
            <div className="mono" style={{ color: modeColor, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
              {state.turret.mode.replace(/_/g, ' ')}
            </div>
            <div className="mono" style={{ color: 'rgba(140,170,205,0.45)', fontSize: 9, marginTop: 2 }}>
              {state.turret.mode === 'RF_JAM'       ? 'Disrupts C2 uplink'
               : state.turret.mode === 'DIRECTED_EMP' ? 'Hard-kills electronics'
               :                                        'Kinetic engagement'}
            </div>
          </div>
        </div>

        {/* System status */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12 }}>
          <div className="mono" style={{ color: 'rgba(120,150,185,0.4)', fontSize: 9, letterSpacing: '0.1em', marginBottom: 8 }}>
            SYSTEM STATUS
          </div>
          {[
            { label: 'RADAR',    value: 'ACTIVE',     ok: true },
            { label: 'EMP GEN',  value: 'CHARGED',    ok: true },
            { label: 'RF SYS',   value: 'NOMINAL',    ok: true },
            { label: 'COMMS',    value: 'ENCRYPTED',  ok: true },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span className="mono" style={{ color: 'rgba(120,150,185,0.4)', fontSize: 9 }}>{r.label}</span>
              <span className="mono" style={{ color: r.ok ? '#3dd68c' : '#f05252', fontSize: 9 }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
