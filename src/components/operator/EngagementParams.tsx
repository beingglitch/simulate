import { useRCWSStore } from '../../store/useRCWSStore'
import { getEngagementParams } from '../../utils/trackUtils'

export default function EngagementParams() {
  const { tracks, selectedTrackId, isEngaging, initiateEngagement, abortEngagement } = useRCWSStore()
  const track = tracks.find(t => t.id === selectedTrackId)

  if (!track || (track.status !== 'TRACKING' && track.status !== 'LOCKED')) {
    return (
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 12, color: '#777', letterSpacing: '0.14em', marginBottom: 8 }}>
          ENGAGEMENT PARAMS
        </div>
        <div style={{ fontSize: 12, color: '#777', letterSpacing: '0.1em', padding: '8px 0' }}>
          NO TARGET LOCKED
        </div>
      </div>
    )
  }

  const p = getEngagementParams(track)
  const canEngage = track.status === 'LOCKED'

  return (
    <div style={{ padding: '10px 12px' }}>
      <div style={{ fontSize: 12, color: '#777', letterSpacing: '0.14em', marginBottom: 8 }}>
        ENGAGEMENT PARAMS
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px', marginBottom: 10 }}>
        <ParamItem label="PEAK POWER"     value={`${p.peakPowerMW} MW`}   color="#F5A623" />
        <ParamItem label="PULSE WIDTH"    value={`${p.pulseWidthNs} ns`}   color="#F5A623" />
        <ParamItem label="PRF"            value={`${p.prfHz} Hz`}          color="#F5A623" />
        <ParamItem label="BEAM WIDTH"     value={`${p.beamWidthDeg}°`}     color="#F5A623" />
        <ParamItem label="T TO EFFECT"    value={`${p.timeToEffectS}s`}    color="#00D4FF" />
        <ParamItem label="KILL PROB"      value={`${p.killProbPct}%`}
          color={p.killProbPct >= 90 ? '#00FF41' : p.killProbPct >= 75 ? '#F5A623' : '#FF2020'} />
      </div>

      {/* Engage / Abort button */}
      {isEngaging ? (
        <button
          onClick={abortEngagement}
          style={{
            width: '100%', padding: '8px', fontSize: 13, letterSpacing: '0.14em', fontWeight: 700,
            border: '1px solid #FF2020', color: '#FF2020', background: 'rgba(255,32,32,0.08)',
            cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
            animation: 'hostile-pulse 0.8s ease-in-out infinite',
          }}
        >
          ABORT ENGAGEMENT
        </button>
      ) : (
        <button
          onClick={canEngage ? initiateEngagement : undefined}
          disabled={!canEngage}
          style={{
            width: '100%', padding: '8px', fontSize: 13, letterSpacing: '0.14em', fontWeight: 700,
            border: `1px solid ${canEngage ? '#00FF41' : '#333'}`,
            color: canEngage ? '#00FF41' : '#333',
            background: canEngage ? 'rgba(0,255,65,0.06)' : 'transparent',
            cursor: canEngage ? 'pointer' : 'not-allowed',
            fontFamily: 'JetBrains Mono, monospace',
            transition: 'all 0.1s',
          }}
        >
          {canEngage ? 'INITIATE ENGAGEMENT' : 'LOCK TARGET FIRST'}
        </button>
      )}
    </div>
  )
}

function ParamItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: '#666', letterSpacing: '0.1em', marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: 13, color, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    </div>
  )
}
