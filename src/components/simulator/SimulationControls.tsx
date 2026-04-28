import { useRCWSStore } from '../../store/useRCWSStore'

const SPEEDS = [0.25, 0.5, 1, 2, 4, 8]

export default function SimulationControls() {
  const {
    simulationSpeed, isPaused, tracks, autoSpawnEnabled,
    setSimSpeed, setPaused, resetScenario, setAutoSpawn,
  } = useRCWSStore()

  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: 12, color: '#00D4FF', letterSpacing: '0.14em', marginBottom: 10, borderBottom: '1px solid #111', paddingBottom: 6 }}>
        SIMULATION CONTROLS
      </div>

      {/* Speed selector */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: '#666', letterSpacing: '0.1em', marginBottom: 4 }}>SIM SPEED</div>
        <div style={{ display: 'flex', gap: 3 }}>
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => setSimSpeed(s)}
              style={{
                flex: 1, padding: '5px 2px', fontSize: 13, letterSpacing: '0.06em',
                border: `1px solid ${simulationSpeed === s ? '#F5A623' : '#1A1A1A'}`,
                color: simulationSpeed === s ? '#F5A623' : '#444',
                background: simulationSpeed === s ? 'rgba(245,166,35,0.08)' : 'transparent',
                cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Pause / Resume */}
      <button
        onClick={() => setPaused(!isPaused)}
        style={{
          width: '100%', padding: '8px', fontSize: 13, letterSpacing: '0.14em', fontWeight: 700,
          border: `1px solid ${isPaused ? '#00FF41' : '#F5A623'}`,
          color: isPaused ? '#00FF41' : '#F5A623',
          background: isPaused ? 'rgba(0,255,65,0.06)' : 'rgba(245,166,35,0.06)',
          cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
          marginBottom: 6,
        }}
      >
        {isPaused ? 'RESUME SIMULATION' : 'PAUSE SIMULATION'}
      </button>

      {/* Track counter */}
      <div style={{
        padding: '5px 8px', background: '#050505', border: '1px solid #111',
        display: 'flex', justifyContent: 'space-between', marginBottom: 6,
      }}>
        <span style={{ fontSize: 13, color: '#666', letterSpacing: '0.08em' }}>ACTIVE TRACKS</span>
        <span style={{ fontSize: 13, color: '#C8C8C0' }}>{tracks.filter(t => t.status === 'TRACKING' || t.status === 'LOCKED').length}</span>
      </div>

      {/* Auto-spawn toggle */}
      <button
        onClick={() => setAutoSpawn(!autoSpawnEnabled)}
        style={{
          width: '100%', padding: '8px', fontSize: 13, letterSpacing: '0.14em', fontWeight: 700,
          border: `1px solid ${autoSpawnEnabled ? '#FF2020' : '#1A1A1A'}`,
          color: autoSpawnEnabled ? '#FF2020' : '#444',
          background: autoSpawnEnabled ? 'rgba(255,32,32,0.06)' : 'transparent',
          cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
          marginBottom: 6,
          animation: autoSpawnEnabled ? 'hostile-pulse 2s ease-in-out infinite' : 'none',
        }}
      >
        {autoSpawnEnabled ? 'AUTO-SPAWN ON' : 'AUTO-SPAWN OFF'}
      </button>
      {autoSpawnEnabled && (
        <div style={{ fontSize: 13, color: '#FF202080', letterSpacing: '0.08em', marginBottom: 6, textAlign: 'center' }}>
          NEW THREAT EVERY ~10s
        </div>
      )}

      {/* Reset — confirmation via double-click pattern handled by hold */}
      <button
        onClick={resetScenario}
        style={{
          width: '100%', padding: '8px', fontSize: 13, letterSpacing: '0.14em', fontWeight: 700,
          border: '1px solid #333', color: '#777',
          background: 'transparent',
          cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        RESET SCENARIO
      </button>
    </div>
  )
}
