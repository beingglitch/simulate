import { useRCWSStore } from '../../store/useRCWSStore'

const SYSTEMS = [
  { id: 'RADAR',      label: 'RADAR ARRAY',       nominal: true },
  { id: 'EMP_GEN',    label: 'EMP GENERATOR',      nominal: true },
  { id: 'RF_JAM',     label: 'RF JAMMING MOD',     nominal: true },
  { id: 'TARGETING',  label: 'TARGETING PROC',     nominal: true },
  { id: 'COMMS',      label: 'COMMS UPLINK',        nominal: true },
  { id: 'POWER',      label: 'POWER SUPPLY',        nominal: true },
]

export default function BITPanel() {
  const { systemStatus, neutralisedCount } = useRCWSStore()
  const allGo = systemStatus !== 'ENGAGING'

  return (
    <div style={{ padding: '10px 12px' }}>
      <div style={{ fontSize: 12, color: '#777', letterSpacing: '0.14em', marginBottom: 8 }}>
        BUILT-IN TEST
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {SYSTEMS.map(sys => {
          const ok = allGo ? sys.nominal : sys.id !== 'EMP_GEN'
          return (
            <div key={sys.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '3px 6px', background: '#050505', border: '1px solid #111',
            }}>
              <span style={{ fontSize: 13, color: '#666', letterSpacing: '0.08em' }}>{sys.label}</span>
              <span style={{
                fontSize: 13, fontWeight: 700, letterSpacing: '0.1em',
                color: ok ? '#00FF41' : '#FF2020',
              }}>
                {ok ? 'GO' : 'FAULT'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Engagement counter */}
      <div style={{
        marginTop: 8, padding: '4px 6px',
        border: '1px solid #1A1A1A',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, color: '#666', letterSpacing: '0.1em' }}>TOTAL KILLS</span>
        <span style={{ fontSize: 14, color: '#00FF41', fontWeight: 700 }}>
          {String(neutralisedCount).padStart(3, '0')}
        </span>
      </div>

      {/* System status */}
      <div style={{
        marginTop: 4, padding: '4px 6px',
        border: `1px solid ${STATUS_COLOR[systemStatus]}40`,
        background: `${STATUS_COLOR[systemStatus]}08`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, color: '#666', letterSpacing: '0.1em' }}>SYS STATUS</span>
        <span style={{
          fontSize: 12, color: STATUS_COLOR[systemStatus], fontWeight: 700, letterSpacing: '0.12em',
          animation: systemStatus === 'ENGAGING' ? 'hostile-pulse 0.6s ease-in-out infinite' : 'none',
        }}>
          {systemStatus}
        </span>
      </div>
    </div>
  )
}

const STATUS_COLOR: Record<string, string> = {
  STANDBY:  '#555555',
  ACTIVE:   '#F5A623',
  ENGAGING: '#FF2020',
}
