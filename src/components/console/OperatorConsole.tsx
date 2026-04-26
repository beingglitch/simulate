import { useState, useEffect, useRef } from 'react'
import type { SimState, WeaponMode } from '../../types'
import AzimuthDial from './AzimuthDial'
import ElevationArc from './ElevationArc'
import RFSpectrum from './RFSpectrum'
import BITPanel from './BITPanel'
import EFieldPanel from './EFieldPanel'
import ZoneLegend from '../ZoneLegend'
import { lazy, Suspense } from 'react'
const TurretView3D = lazy(() => import('./TurretView3D'))

interface Props {
  state: SimState
  setTurretAzimuth: (v: number) => void
  setTurretElevation: (v: number) => void
  setWeaponMode: (m: WeaponMode) => void
}

const MODE_COLOR: Record<WeaponMode, string> = {
  RF_JAM:       '#4da6ff',
  DIRECTED_EMP: '#f59e0b',
  KINETIC:      '#f05252',
}

const MODE_DESC: Record<WeaponMode, string> = {
  RF_JAM:       'Disrupts C2 uplink',
  DIRECTED_EMP: 'Hard-kills electronics',
  KINETIC:      'Kinetic engagement',
}

const TYPE_COLOR: Record<string, string> = {
  FPV_DRONE:  '#f05252',
  RF_IED:     '#f59e0b',
  ENEMY_RCWS: '#e050a0',
}

function getThreatAssessment(threat: SimState['threats'][0]): string {
  const { priority, range, type } = threat
  if (priority === 3 && range < 200) return 'CRITICAL — HARD-KILL ZONE'
  if (priority === 3)                return `HIGH THREAT — ${type.replace(/_/g, ' ')} IN ENGAGEMENT ENVELOPE`
  if (type === 'FPV_DRONE' && range < 600) return 'HIGH THREAT — FPV DRONE IN HARD-KILL ZONE'
  if (type === 'RF_IED')                   return 'STATIC THREAT — RF-IED WITHIN JAM RADIUS'
  if (type === 'ENEMY_RCWS')               return 'RECIPROCAL THREAT — ENEMY RCWS ACQUIRING'
  return 'TRACK CONFIRMED — MONITORING'
}

export default function OperatorConsole({ state, setTurretAzimuth, setTurretElevation, setWeaponMode }: Props) {
  const [zonesOpen, setZonesOpen]         = useState(false)
  const [eFieldOpen, setEFieldOpen]       = useState(false)
  const [lastEngagedRange, setLastEngagedRange] = useState<number | null>(null)
  const prevFireCount = useRef(state.empFireCount)

  const selectedThreat     = state.threats.find(t => t.id === state.selectedThreatId)
  const showClassification = selectedThreat && selectedThreat.status === 'APPROACHING'

  // Capture target range while pipeline is running
  useEffect(() => {
    if (state.pipelineActive && selectedThreat) {
      setLastEngagedRange(selectedThreat.range)
    }
  }, [state.pipelineActive, selectedThreat?.range])

  // Auto-expand E-field panel on each new EMP fire
  useEffect(() => {
    if (state.empFireCount > prevFireCount.current) {
      setEFieldOpen(true)
      prevFireCount.current = state.empFireCount
    }
  }, [state.empFireCount])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#0c1826', borderLeft: '1px solid rgba(255,255,255,0.06)',
      overflowY: 'auto', overflowX: 'hidden',
    }}>
      {/* 1. Header */}
      <div style={{
        padding: '10px 12px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <span className="mono" style={{ color: 'rgba(160,190,225,0.55)', fontSize: 9, letterSpacing: '0.14em' }}>
          OPERATOR CONSOLE
        </span>
      </div>

      {/* 1.5. 3D Turret View */}
      <Suspense fallback={
        <div style={{ width: '100%', height: 215, background: '#060c18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mono" style={{ color: 'rgba(77,166,255,0.3)', fontSize: 9 }}>LOADING 3D…</span>
        </div>
      }>
        <TurretView3D
          azimuth={state.turret.azimuth}
          elevation={state.turret.elevation}
          mode={state.turret.mode}
          empFireCount={state.empFireCount}
          pipelineActive={state.pipelineActive}
          selectedBearing={selectedThreat?.bearing}
        />
      </Suspense>

      {/* 2. Azimuth Dial */}
      <div style={{ padding: '12px 8px 4px', flexShrink: 0 }}>
        <div className="mono" style={{ color: 'rgba(120,150,185,0.4)', fontSize: 9, letterSpacing: '0.1em', textAlign: 'center', marginBottom: 6 }}>
          AZIMUTH
        </div>
        <AzimuthDial value={state.turret.azimuth} onChange={setTurretAzimuth} />
      </div>

      {/* 3. Elevation Arc */}
      <div style={{ flexShrink: 0 }}>
        <ElevationArc value={state.turret.elevation} onChange={setTurretElevation} />
      </div>

      {/* 4. Weapon Mode */}
      <div style={{ padding: '8px 12px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="mono" style={{ color: 'rgba(120,150,185,0.4)', fontSize: 9, letterSpacing: '0.1em', marginBottom: 6 }}>
          WEAPON MODE
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {(['RF_JAM', 'DIRECTED_EMP', 'KINETIC'] as const).map(m => {
            const on    = state.turret.mode === m
            const color = MODE_COLOR[m]
            return (
              <button
                key={m}
                onClick={() => setWeaponMode(m)}
                className="mono"
                style={{
                  width: '100%', padding: '5px 10px', fontSize: 9,
                  letterSpacing: '0.06em', cursor: 'pointer', textAlign: 'left',
                  border: `1px solid ${on ? color + 'bb' : 'rgba(255,255,255,0.08)'}`,
                  background: on ? color + '18' : 'transparent',
                  color: on ? color : 'rgba(140,170,205,0.4)',
                  transition: 'all 0.12s',
                }}
              >
                <div>{m.replace(/_/g, ' ')}</div>
                {on && (
                  <div style={{ color: 'rgba(140,170,205,0.45)', fontSize: 8, marginTop: 2 }}>
                    {MODE_DESC[m]}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 5. Collapsible Engagement Zones */}
      <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => setZonesOpen(o => !o)}
          className="mono"
          style={{
            width: '100%', padding: '7px 12px', cursor: 'pointer',
            background: 'transparent', border: 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            color: 'rgba(120,150,185,0.4)', fontSize: 9, letterSpacing: '0.1em',
          }}
        >
          <span>ENGAGEMENT ZONES</span>
          <span style={{ fontSize: 10 }}>{zonesOpen ? '▲' : '▼'}</span>
        </button>
        {zonesOpen && (
          <div style={{ padding: '0 12px 10px' }}>
            <ZoneLegend state={state} compact />
          </div>
        )}
      </div>

      {/* 6. Target Classification */}
      {showClassification && (
        <div style={{
          flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '10px 12px',
        }}>
          <div className="mono" style={{ color: 'rgba(120,150,185,0.4)', fontSize: 9, letterSpacing: '0.1em', marginBottom: 8 }}>
            TARGET CLASSIFICATION
          </div>

          {/* Badge row */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 8 }}>
            <span className="mono" style={{
              padding: '2px 6px', fontSize: 9,
              border: `1px solid ${TYPE_COLOR[selectedThreat.type] ?? '#4da6ff'}50`,
              color: TYPE_COLOR[selectedThreat.type] ?? '#4da6ff',
              background: `${TYPE_COLOR[selectedThreat.type] ?? '#4da6ff'}10`,
            }}>
              {selectedThreat.type.replace(/_/g, ' ')}
            </span>
            <span className="mono" style={{
              padding: '2px 6px', fontSize: 9,
              border: '1px solid rgba(240,82,82,0.4)', color: '#f05252',
              background: 'rgba(240,82,82,0.08)',
            }}>
              {selectedThreat.status}
            </span>
            <span className="mono" style={{
              padding: '2px 6px', fontSize: 9,
              border: '1px solid rgba(77,166,255,0.3)', color: '#4da6ff',
              background: 'rgba(77,166,255,0.08)',
            }}>
              {selectedThreat.id}
            </span>
          </div>

          {/* RF Spectrum */}
          <div style={{ marginBottom: 6 }}>
            <RFSpectrum rfFingerprint={selectedThreat.rfFingerprint} active />
          </div>
          <div className="mono" style={{ color: 'rgba(140,170,205,0.5)', fontSize: 9, marginBottom: 8 }}>
            {selectedThreat.rfFingerprint}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 8px', marginBottom: 8 }}>
            {[
              { label: 'RANGE',    value: `${Math.round(selectedThreat.range)}m` },
              { label: 'BEARING',  value: `${selectedThreat.bearing.toFixed(0)}°` },
              { label: 'SPEED',    value: `${selectedThreat.speed}m/s` },
              { label: 'PRIORITY', value: `P${selectedThreat.priority}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="mono" style={{ color: 'rgba(100,130,165,0.4)', fontSize: 8 }}>{label}</div>
                <div className="mono" style={{ color: 'rgba(180,210,245,0.75)', fontSize: 10, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Threat assessment */}
          <div style={{
            padding: '5px 8px',
            border: '1px solid rgba(240,82,82,0.2)',
            background: 'rgba(240,82,82,0.05)',
          }}>
            <span className="mono" style={{ color: '#f08080', fontSize: 8, letterSpacing: '0.06em' }}>
              {getThreatAssessment(selectedThreat)}
            </span>
          </div>
        </div>
      )}

      {/* 7. E-field Analysis — auto-opens after EMP fires */}
      <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={() => setEFieldOpen(o => !o)}
          className="mono"
          style={{
            width: '100%', padding: '7px 12px', cursor: 'pointer',
            background: 'transparent', border: 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            color: state.empFired ? 'rgba(77,166,255,0.6)' : 'rgba(120,150,185,0.4)',
            fontSize: 9, letterSpacing: '0.1em',
          }}
        >
          <span>E-FIELD ANALYSIS{state.empFired ? ' ◉' : ''}</span>
          <span style={{ fontSize: 10 }}>{eFieldOpen ? '▲' : '▼'}</span>
        </button>
        {eFieldOpen && (
          <EFieldPanel
            empFireCount={state.empFireCount}
            targetRange={lastEngagedRange ?? undefined}
          />
        )}
      </div>

      {/* 8. Spacer */}
      <div style={{ flex: 1, minHeight: 8 }} />

      {/* 9. BIT Panel */}
      <BITPanel />
    </div>
  )
}
