import { useEffect, useState, useRef, lazy, Suspense } from 'react'
import { useRCWSStore }           from '../store/useRCWSStore'
import ThreatDetectionPanel       from '../components/operator/ThreatDetectionPanel'
import ThreatIntelPanel           from '../components/operator/ThreatIntelPanel'
import EngagementLog              from '../components/operator/EngagementLog'
import PipelinePanel, { getPipelineTotalMs, getPipelineSteps } from '../components/operator/PipelinePanel'
import AlertOverlay               from '../components/operator/AlertOverlay'
import RadarScope                 from '../components/operator/RadarScope'
import { playKillConfirmed }      from '../utils/audio'
import { buildTrack, nextTrackId } from '../utils/trackUtils'
import type { ThreatType, ActiveView } from '../types'

const CesiumMap    = lazy(() => import('../components/map/CesiumMap'))
const TurretView3D = lazy(() => import('../components/operator/TurretView3D'))

const STATUS_COLOR: Record<string, string> = {
  STANDBY:  '#555',
  ACTIVE:   '#F5A623',
  ENGAGING: '#FF2020',
}

const THREAT_TYPES: ThreatType[] = ['FPV_DRONE', 'RF_IED', 'ENEMY_RCWS', 'UNKNOWN']
const BEARINGS = [22, 45, 67, 90, 112, 135, 157, 180, 202, 225, 247, 270, 292, 315, 337, 358]
const VIEW_LABELS: Record<ActiveView, string> = { RADAR: 'RADAR', MAP: 'TACTICAL MAP', '3D': '3D SCENE' }

export default function OperatorView() {
  const {
    systemStatus, neutralisedCount, mode,
    azimuth, elevation, tracks, selectedTrackId,
    isEngaging, autoSpawnEnabled, isPaused,
    completeEngagement, injectTrack, activeView, setActiveView, tickTracks,
  } = useRCWSStore()

  // Pipeline state — local, driven by isEngaging
  const [pipelineStepIdx, setPipelineStepIdx] = useState(-1)
  const [elapsedMs,       setElapsedMs]       = useState(0)
  const pipelineStartRef = useRef<number | null>(null)
  const rafRef           = useRef<number>(0)

  // Simulation tick loop
  const lastTickRef = useRef<number>(performance.now())
  const tickRafRef  = useRef<number>(0)

  // Auto-spawn timer
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const escaped     = tracks.filter(t => t.status === 'ESCAPED').length
  const hostile     = tracks.filter(t => t.status === 'TRACKING' || t.status === 'LOCKED').length
  const selectedTrack = tracks.find(t => t.id === selectedTrackId)
  const threatBearings = tracks
    .filter(t => t.status === 'TRACKING' || t.status === 'LOCKED')
    .map(t => t.bearing)

  // ── Simulation tick ───────────────────────────────────────────
  useEffect(() => {
    function frame(ts: number) {
      const dt = Math.min((ts - lastTickRef.current) / 1000, 0.1) // cap at 100ms
      lastTickRef.current = ts
      tickTracks(dt)
      tickRafRef.current = requestAnimationFrame(frame)
    }
    tickRafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(tickRafRef.current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Pipeline progression ──────────────────────────────────────
  useEffect(() => {
    if (isEngaging) {
      pipelineStartRef.current = performance.now()
      setPipelineStepIdx(0)
      setElapsedMs(0)

      const steps = getPipelineSteps(useRCWSStore.getState().mode)
      const offsets = steps.reduce<number[]>((acc, step) => {
        acc.push((acc[acc.length - 1] ?? 0) + step.durationMs)
        return acc
      }, [])

      function tick() {
        const now = performance.now()
        const elapsed = now - (pipelineStartRef.current ?? now)
        setElapsedMs(elapsed)

        let step = 0
        for (let i = 0; i < offsets.length; i++) {
          if (elapsed < offsets[i]) { step = i; break }
          step = offsets.length
        }
        setPipelineStepIdx(Math.min(step, steps.length - 1))

        if (elapsed < getPipelineTotalMs(useRCWSStore.getState().mode)) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          setPipelineStepIdx(6)
          completeEngagement()
          playKillConfirmed()
          const { engagementQueue, setEngagementQueue, selectTrack, initiateEngagement } = useRCWSStore.getState()
          if (engagementQueue.length > 0) {
            const [next, ...rest] = engagementQueue
            setEngagementQueue(rest)
            setTimeout(() => {
              selectTrack(next)
              setTimeout(() => initiateEngagement(), 150)
            }, 700)
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    } else {
      cancelAnimationFrame(rafRef.current)
      if (pipelineStepIdx !== 6) setPipelineStepIdx(-1)
      const t = setTimeout(() => setPipelineStepIdx(-1), 2000)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEngaging])

  // ── Auto-spawn ────────────────────────────────────────────────
  useEffect(() => {
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
    if (autoSpawnEnabled && !isPaused) {
      spawnTimerRef.current = setInterval(() => {
        const type    = THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)]
        const bearing = BEARINGS[Math.floor(Math.random() * BEARINGS.length)]
        const track   = buildTrack(nextTrackId(), type, bearing)
        injectTrack(track)
      }, 9000 + Math.random() * 3000)
    }
    return () => { if (spawnTimerRef.current) clearInterval(spawnTimerRef.current) }
  }, [autoSpawnEnabled, isPaused, injectTrack])

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return
      const store = useRCWSStore.getState()
      switch (e.key) {
        case ' ': case 'Enter':
          e.preventDefault()
          if (store.isEngaging) store.abortEngagement()
          else store.initiateEngagement()
          break
        case 'Escape': store.abortEngagement(); break
        case '1': store.setMode('RF_JAM');       break
        case '2': store.setMode('DIRECTED_EMP'); break
        case '3': store.setMode('KINETIC');      break
        case 'z': case 'Z': store.toggleZones(); break
        case 'r': case 'R': store.resetScenario(); break
        case 'Tab':
          e.preventDefault()
          const views: ActiveView[] = ['RADAR', 'MAP', '3D']
          const idx = views.indexOf(store.activeView)
          store.setActiveView(views[(idx + 1) % views.length])
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])


  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      {/* Top HUD */}
      <div style={{
        height: 36, flexShrink: 0,
        background: '#000', borderBottom: '1px solid #1A1A1A',
        display: 'flex', alignItems: 'center',
        padding: '0 12px', zIndex: 100,
      }}>
        <span style={{ fontSize: 13, color: '#F5A623', fontWeight: 700, letterSpacing: '0.16em', marginRight: 16 }}>
          EMP-RCWS · UNIT-01
        </span>
        <HudSep />
        <HudItem label="STATUS"  value={systemStatus}
          color={STATUS_COLOR[systemStatus]} blink={systemStatus === 'ENGAGING'} />
        <HudSep />
        <HudItem label="MODE"    value={mode.replace('_', ' ')}   color="#00D4FF" />
        <HudSep />
        <HudItem label="AZ"      value={`${String(Math.round(azimuth)).padStart(3,'0')}°`} color="#F5A623" />
        <HudSep />
        <HudItem label="EL"      value={`${elevation > 0 ? '+' : ''}${elevation}°`} color="#F5A623" />
        <HudSep />
        <HudItem label="HOSTILE" value={String(hostile)} color={hostile > 0 ? '#FF2020' : '#333'} />
        <HudSep />
        <HudItem label="KILLS"   value={String(neutralisedCount).padStart(3,'0')} color="#00FF41" />
        {escaped > 0 && <><HudSep /><HudItem label="ESCAPED" value={String(escaped)} color="#F5A623" /></>}
        {autoSpawnEnabled && <><HudSep /><HudItem label="AUTO" value="SPAWN" color="#FF2020" blink /></>}
        <div style={{ flex: 1 }} />
        {/* Nav links */}
        <a href="/physics" style={{
          fontSize: 11, color: '#555', letterSpacing: '0.1em',
          textDecoration: 'none', border: '1px solid #1A1A1A', padding: '2px 8px', marginRight: 8,
        }}>EMP PHYSICS</a>
        <span style={{ fontSize: 11, color: '#333', letterSpacing: '0.06em' }}>
          [SPC] ENGAGE · [TAB] VIEW · [1/2/3] MODE · [Z] ZONES
        </span>
      </div>

      {/* Main three-column area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT PANEL: Active threat list + action buttons ── */}
        <div style={{
          width: 284, flexShrink: 0, borderRight: '1px solid #1A1A1A',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#000',
        }}>
          <PanelHeader>THREAT DETECTION</PanelHeader>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <ThreatDetectionPanel />
          </div>
        </div>

        {/* ── CENTRE: tabbed view ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* View tabs */}
          <div style={{
            height: 30, flexShrink: 0,
            display: 'flex', borderBottom: '1px solid #1A1A1A', background: '#000',
          }}>
            {(['RADAR', 'MAP', '3D'] as ActiveView[]).map(v => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                style={{
                  padding: '0 18px', fontSize: 11, letterSpacing: '0.14em', fontWeight: 700,
                  border: 'none', borderRight: '1px solid #111',
                  borderBottom: v === activeView ? '2px solid #F5A623' : 'none',
                  background: v === activeView ? 'rgba(245,166,35,0.05)' : 'transparent',
                  color: v === activeView ? '#F5A623' : '#444',
                  cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {v === 'RADAR' ? '◎ RADAR' : v === 'MAP' ? '⊞ MAP' : '⬡ 3D'}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: '#333', alignSelf: 'center', paddingRight: 10, letterSpacing: '0.1em' }}>
              {VIEW_LABELS[activeView]}
            </span>
          </div>

          {/* Primary view */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {activeView === 'RADAR' && <RadarScope fill />}
            {activeView === 'MAP' && (
              <Suspense fallback={<ViewLoader label="LOADING MAP…" />}>
                <CesiumMap />
              </Suspense>
            )}
            {activeView === '3D' && (
              <Suspense fallback={<ViewLoader label="LOADING 3D…" />}>
                <TurretView3D
                  fill
                  azimuth={azimuth}
                  elevation={elevation}
                  mode={mode}
                  isEngaging={isEngaging}
                  threatBearings={threatBearings}
                />
              </Suspense>
            )}

            {/* EMP flash overlay */}
            {isEngaging && pipelineStepIdx >= 4 && (
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
                background: `radial-gradient(ellipse at center, ${MODE_GLOW[mode]} 0%, transparent 70%)`,
                animation: 'hostile-pulse 0.35s ease-in-out infinite',
              }} />
            )}

            <div className="scanlines" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }} />

            {/* Alerts overlay */}
            <AlertOverlay />
          </div>
        </div>

        {/* ── RIGHT PANEL: Threat intel (top) + weapon controls (bottom) ── */}
        <div style={{
          width: 262, flexShrink: 0, borderLeft: '1px solid #1A1A1A',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#000',
        }}>
          {/* Dynamic header */}
          <div style={{
            padding: '5px 12px', fontSize: 11, color: '#444',
            letterSpacing: '0.16em', borderBottom: '1px solid #111',
            background: '#010101', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {selectedTrack ? (
              <>
                <span style={{ color: '#F5A623' }}>●</span>
                <span>THREAT INTEL — {selectedTrack.id}</span>
              </>
            ) : (
              <span>THREAT OVERVIEW</span>
            )}
          </div>

          {/* Scrollable intel area */}
          <ThreatIntelPanel />

          {/* Compact AZ / EL / MODE readout strip */}
          <div style={{ borderTop: '1px solid #111', flexShrink: 0, display: 'flex' }}>
            {[
              { label: 'AZIMUTH',   value: `${String(Math.round(azimuth)).padStart(3,'0')}°`, color: '#F5A623' },
              { label: 'ELEVATION', value: `${elevation >= 0 ? '+' : ''}${elevation}°`,        color: '#F5A623' },
              { label: 'MODE',      value: mode.replace('_',' '),
                color: mode === 'RF_JAM' ? '#00D4FF' : mode === 'DIRECTED_EMP' ? '#F5A623' : '#FF2020' },
            ].map(({ label, value, color }, i) => (
              <div key={label} style={{
                flex: 1, padding: '7px 0', textAlign: 'center',
                borderRight: i < 2 ? '1px solid #0A0A0A' : 'none',
              }}>
                <div style={{ fontSize: 9, color: '#383838', letterSpacing: '0.14em', marginBottom: 3 }}>
                  {label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: '0.06em' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── ATTACK PIPELINE STRIP ── */}
      <div style={{ height: 68, flexShrink: 0, borderTop: '1px solid #1A1A1A', background: '#000' }}>
        <PipelinePanel
          stepIdx={pipelineStepIdx}
          elapsedMs={elapsedMs}
          isEngaging={isEngaging}
          mode={mode}
        />
      </div>

      {/* ── ENGAGEMENT LOG ── */}
      <div style={{
        height: 120, flexShrink: 0, borderTop: '1px solid #1A1A1A',
        background: '#000', display: 'flex', flexDirection: 'column',
      }}>
        <EngagementLog />
      </div>
    </div>
  )
}

const MODE_GLOW: Record<string, string> = {
  RF_JAM:       'rgba(0,212,255,0.10)',
  DIRECTED_EMP: 'rgba(245,166,35,0.12)',
  KINETIC:      'rgba(255,32,32,0.10)',
}

function PanelHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '5px 12px', fontSize: 12, color: '#555',
      letterSpacing: '0.16em', borderBottom: '1px solid #111',
      background: '#010101', flexShrink: 0,
    }}>
      {children}
    </div>
  )
}

function HudItem({ label, value, color, blink }: {
  label: string; value: string; color: string; blink?: boolean
}) {
  return (
    <div style={{ padding: '0 9px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <span style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em' }}>{label}</span>
      <span style={{
        fontSize: 12, color, fontWeight: 700, letterSpacing: '0.08em',
        animation: blink ? 'hostile-pulse 0.6s ease-in-out infinite' : 'none',
      }}>
        {value}
      </span>
    </div>
  )
}

function HudSep() {
  return <div style={{ width: 1, height: 18, background: '#111', flexShrink: 0 }} />
}

function ViewLoader({ label, small }: { label: string; small?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100%', width: '100%', background: '#000',
      color: '#333', fontSize: small ? 9 : 12, letterSpacing: '0.12em',
    }}>
      {label}
    </div>
  )
}
