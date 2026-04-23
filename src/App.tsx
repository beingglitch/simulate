import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useSimStore } from './store/simStore'
import TopBar from './components/TopBar'
import MapView from './components/MapView'
import ThreatPanel from './components/ThreatPanel'
import OperatorConsole from './components/console/OperatorConsole'
import PipelineOverlay from './components/pipeline/PipelineOverlay'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import type { ThreatType } from './types'

const STATUS_BADGE_VARIANT: Record<string, 'hostile' | 'disrupted' | 'destroyed' | 'engaged' | 'escaped'> = {
  APPROACHING: 'hostile',
  ENGAGED:     'engaged',
  DISRUPTED:   'disrupted',
  DESTROYED:   'destroyed',
  ESCAPED:     'escaped',
}

const TYPE_BADGE_VARIANT: Record<string, 'fpv' | 'ied' | 'rcws'> = {
  FPV_DRONE:  'fpv',
  RF_IED:     'ied',
  ENEMY_RCWS: 'rcws',
}

export default function App() {
  const {
    state, selectThreat, setTurretAzimuth, setTurretElevation,
    setWeaponMode, approveEngagement, spawnThreat, runPipeline, tickThreats,
  } = useSimStore()

  const prevPipeline = useRef(false)
  const lastTime     = useRef(Date.now())

  // Threat movement loop
  useEffect(() => {
    let raf: number
    const loop = () => {
      const now = Date.now()
      tickThreats((now - lastTime.current) / 1000)
      lastTime.current = now
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tickThreats])

  // Auto-aim at selected threat
  useEffect(() => {
    if (!state.selectedThreatId) return
    const t = state.threats.find(x => x.id === state.selectedThreatId)
    if (t?.status === 'APPROACHING') setTurretAzimuth(t.bearing)
  }, [state.selectedThreatId, state.threats, setTurretAzimuth])

  // Pipeline completion → Sonner toast + auto-deselect
  useEffect(() => {
    if (prevPipeline.current && !state.pipelineActive && state.empFired) {
      const t = state.threats.find(x => x.id === state.selectedThreatId)
      const destroyed = t?.status === 'DESTROYED'

      toast(destroyed ? 'TARGET DESTROYED' : 'TARGET DISRUPTED', {
        description: `${t?.id ?? '—'} · ${t?.type.replace(/_/g, ' ')} · ${Math.round(t?.range ?? 0)}m`,
        duration: 4000,
        style: {
          borderColor: destroyed ? 'rgba(240,82,82,0.5)' : 'rgba(61,214,140,0.4)',
          color: destroyed ? '#f08080' : '#3dd68c',
        },
      })

      // Auto-deselect so panel resets
      setTimeout(() => selectThreat(null), 400)
    }
    prevPipeline.current = state.pipelineActive
  }, [state.pipelineActive, state.empFired, state.threats, state.selectedThreatId, selectThreat])

  const selectedThreat = state.threats.find(t => t.id === state.selectedThreatId)
  const isEngageable   = selectedThreat?.status === 'APPROACHING'
  const currentStep    = state.pipelineStep?.replace(/_/g, ' ')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#080f1a', userSelect: 'none' }}>
      <TopBar state={state} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{ width: 240, flexShrink: 0, overflow: 'hidden' }}>
          <ThreatPanel state={state} onSelect={selectThreat} onSpawn={(t: ThreatType) => spawnThreat(t)} />
        </div>

        {/* Map */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <MapView state={state} onSelectThreat={id => selectThreat(id)} />

          {/* ── Pipeline overlay ─────────────────────────────── */}
          <PipelineOverlay state={state} />

          {/* ── Engage control panel — always visible, bottom-right ── */}
          <div style={{
            position: 'absolute', bottom: 52, right: 12, zIndex: 1000,
            background: 'rgba(8,15,26,0.97)', border: '1px solid rgba(255,255,255,0.07)',
            width: 248, backdropFilter: 'blur(6px)',
          }}>
            {/* Header */}
            <div style={{
              padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span className="mono" style={{ color: 'rgba(130,160,200,0.45)', fontSize: 9, letterSpacing: '0.12em' }}>
                ENGAGE CONTROL
              </span>
              {selectedThreat && (
                <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                  <Badge variant={TYPE_BADGE_VARIANT[selectedThreat.type] ?? 'neutral'}>
                    {selectedThreat.type.replace(/_/g, ' ')}
                  </Badge>
                  <span className="mono" style={{ color: '#4da6ff', fontSize: 10, fontWeight: 700 }}>
                    {selectedThreat.id}
                  </span>
                </div>
              )}
            </div>

            <div style={{ padding: '10px 12px' }}>
              {/* No selection */}
              {!selectedThreat && (
                <p className="mono" style={{ color: 'rgba(120,150,185,0.35)', fontSize: 10, textAlign: 'center', padding: '8px 0' }}>
                  CLICK TRACK ON MAP OR LIST
                </p>
              )}

              {/* Selected but already neutralised */}
              {selectedThreat && !isEngageable && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mono" style={{ color: 'rgba(140,170,205,0.45)', fontSize: 10 }}>STATUS</span>
                    <Badge variant={STATUS_BADGE_VARIANT[selectedThreat.status] ?? 'neutral'}>
                      {selectedThreat.status}
                    </Badge>
                  </div>
                  <p className="mono" style={{ color: 'rgba(120,150,185,0.35)', fontSize: 9, textAlign: 'center', marginTop: 2 }}>
                    TARGET NEUTRALISED — SELECT ANOTHER
                  </p>
                </div>
              )}

              {/* Active threat — engage flow */}
              {isEngageable && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Target info row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <Badge variant="hostile">APPROACHING</Badge>
                    </div>
                    <span className="mono" style={{ color: 'rgba(180,210,245,0.65)', fontSize: 10 }}>
                      {Math.round(selectedThreat.range)}m · {selectedThreat.bearing.toFixed(0)}°
                    </span>
                  </div>

                  {/* Step 1 — Approve */}
                  {!state.engagementApproved && !state.pipelineActive && (
                    <Button variant="approve" size="full" onClick={approveEngagement}>
                      ◎ APPROVE ENGAGEMENT
                    </Button>
                  )}

                  {/* Step 2 — Execute */}
                  {state.engagementApproved && !state.pipelineActive && (
                    <>
                      <div className="mono" style={{
                        textAlign: 'center', fontSize: 9, color: 'rgba(61,214,140,0.6)', letterSpacing: '0.08em',
                      }}>
                        ✓ ENGAGEMENT APPROVED
                      </div>
                      <Button variant="execute" size="full" onClick={runPipeline} className="blink">
                        ▶ EXECUTE ATTACK
                      </Button>
                    </>
                  )}

                  {/* Pipeline active */}
                  {state.pipelineActive && (
                    <div className="mono" style={{
                      textAlign: 'center', padding: '7px',
                      border: '1px solid rgba(245,158,11,0.3)',
                      color: '#f5bc4b', fontSize: 10, letterSpacing: '0.1em',
                    }}>
                      ◉ ENGAGING — {currentStep}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Control bar ──────────────────────────────────── */}
          <div className="control-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CtrlLabel>AZIMUTH</CtrlLabel>
              <input type="range" min={0} max={360} step={1}
                value={state.turret.azimuth}
                onChange={e => setTurretAzimuth(Number(e.target.value))}
                style={{ width: 90 }} />
              <CtrlValue>{state.turret.azimuth.toFixed(0)}°</CtrlValue>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CtrlLabel>ELEVATION</CtrlLabel>
              <input type="range" min={-10} max={45} step={1}
                value={state.turret.elevation}
                onChange={e => setTurretElevation(Number(e.target.value))}
                style={{ width: 70 }} />
              <CtrlValue>{state.turret.elevation.toFixed(0)}°</CtrlValue>
            </div>

            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.06)' }} />

            {/* Mode */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CtrlLabel>MODE</CtrlLabel>
              <div style={{ display: 'flex', gap: 3 }}>
                {(['RF_JAM', 'DIRECTED_EMP', 'KINETIC'] as const).map(m => {
                  const on = state.turret.mode === m
                  const c  = m === 'RF_JAM' ? '#4da6ff' : m === 'DIRECTED_EMP' ? '#f59e0b' : '#f05252'
                  return (
                    <button key={m} onClick={() => setWeaponMode(m)} className="mono" style={{
                      padding: '3px 10px', fontSize: 10, letterSpacing: '0.06em', cursor: 'pointer',
                      border: `1px solid ${on ? c + 'bb' : 'rgba(255,255,255,0.1)'}`,
                      background: on ? c + '18' : 'transparent',
                      color: on ? c : 'rgba(140,170,205,0.4)',
                      transition: 'all 0.12s',
                    }}>
                      {m.replace(/_/g, ' ')}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ width: 300, flexShrink: 0, overflow: 'hidden' }}>
          <OperatorConsole
            state={state}
            setTurretAzimuth={setTurretAzimuth}
            setTurretElevation={setTurretElevation}
            setWeaponMode={setWeaponMode}
          />
        </div>
      </div>
    </div>
  )
}

function CtrlLabel({ children }: { children: React.ReactNode }) {
  return <span className="mono" style={{ color: 'rgba(130,160,195,0.4)', fontSize: 9, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{children}</span>
}
function CtrlValue({ children }: { children: React.ReactNode }) {
  return <span className="mono" style={{ color: 'rgba(180,210,245,0.75)', fontSize: 11, minWidth: 36, textAlign: 'right' }}>{children}</span>
}
