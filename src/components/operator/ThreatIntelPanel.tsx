// Right panel — selected threat intelligence OR bulk threat overview
import { useRCWSStore } from '../../store/useRCWSStore'
import ThreatIcon from '../icons/ThreatIcon'
import { resumeAudio, playLockTone } from '../../utils/audio'
import type { Track } from '../../types'

const TYPE_LABEL: Record<string, string> = {
  FPV_DRONE: 'FPV DRONE', RF_IED: 'RF-IED', ENEMY_RCWS: 'ENEMY RCWS', UNKNOWN: 'UNKNOWN',
}
const TYPE_COLOR: Record<string, string> = {
  FPV_DRONE: '#00D4FF', RF_IED: '#FF2020', ENEMY_RCWS: '#F5A623', UNKNOWN: '#888888',
}
const VULN_COLOR = { LOW: '#00FF41', MEDIUM: '#F5A623', HIGH: '#FF8020', CRITICAL: '#FF2020' }
const VULN_PCT   = { LOW: 25, MEDIUM: 52, HIGH: 76, CRITICAL: 100 }
const PRIO_COL: Record<number, string> = { 1: '#FF2020', 2: '#F5A623', 3: '#888' }
const LOG_COL = { INFO: '#555', HOSTILE: '#FF2020', SYSTEM: '#F5A623', KILL: '#00FF41' } as Record<string, string>

function fmtS(s: number | null | undefined): string {
  if (s == null || s < 0) return '—'
  return `${Math.round(s)}s`
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', alignItems: 'baseline' }}>
      <span style={{ fontSize: 10, color: '#484848', letterSpacing: '0.12em' }}>{label}</span>
      <span style={{ fontSize: 12, color: color ?? '#C0C0B8', fontWeight: 600, letterSpacing: '0.05em' }}>
        {value}
      </span>
    </div>
  )
}

function Section({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 10, color: '#3A3A3A', letterSpacing: '0.18em', fontWeight: 700,
      padding: '7px 0 3px', borderTop: '1px solid #111', marginTop: 3,
    }}>
      {label}
    </div>
  )
}

// Mini compass bearing indicator
function Compass({ bearing }: { bearing: number }) {
  const rad = ((bearing - 90) * Math.PI) / 180
  const ox = 12 + Math.cos(rad) * 9
  const oy = 12 + Math.sin(rad) * 9
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" stroke="#252525" strokeWidth="1" fill="#0A0A0A" />
      <text x="12" y="4"  textAnchor="middle" fontSize="4" fill="#444" dominantBaseline="middle">N</text>
      <text x="12" y="21" textAnchor="middle" fontSize="4" fill="#333" dominantBaseline="middle">S</text>
      <text x="21" y="12.5" textAnchor="middle" fontSize="4" fill="#333" dominantBaseline="middle">E</text>
      <text x="3"  y="12.5" textAnchor="middle" fontSize="4" fill="#333" dominantBaseline="middle">W</text>
      <line x1="12" y1="12" x2={ox} y2={oy} stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.5" fill="#555" />
    </svg>
  )
}

// RF spectrum bar (miniature inline)
function SpectrumBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ flex: 1, height: 3, background: '#0C0C0C', borderRadius: 2 }}>
      <div style={{
        height: '100%', width: `${Math.max(3, pct)}%`,
        background: `linear-gradient(90deg, ${color}60, ${color})`,
        borderRadius: 2, transition: 'width 0.3s',
      }} />
    </div>
  )
}

// ── Selected threat detail view ────────────────────────────────────
function SelectedView({ track }: { track: Track }) {
  const { initiateEngagement, isEngaging, mode } = useRCWSStore()
  const tc   = TYPE_COLOR[track.type] ?? '#888'
  const vc   = VULN_COLOR[track.rfProfile.vulnerability]
  const vpct = VULN_PCT[track.rfProfile.vulnerability]
  const isLocked   = track.status === 'LOCKED'
  const isTracking = track.status === 'TRACKING'
  const inRange    = track.contactStatus === 'IN_RANGE'

  const maxDbm = Math.max(...track.rfProfile.peaks.map(p => Math.abs(p.dbm)), 1)

  function handleEngage() {
    if (isLocked && !isEngaging) {
      const s = useRCWSStore.getState()
      s.selectTrack(track.id)
      setTimeout(() => s.initiateEngagement(), 100)
    }
  }

  function handleLock() {
    resumeAudio()
    if (isTracking) { useRCWSStore.getState().lockTarget(track.id); playLockTone() }
  }

  return (
    <div style={{ padding: '10px 12px', fontSize: 12 }}>

      {/* Identity card */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', marginBottom: 2,
        background: '#050805', border: `1px solid ${tc}28`,
      }}>
        <ThreatIcon type={track.type} size={28} color={tc} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#E4E4DC', letterSpacing: '0.06em' }}>
            {track.id}
          </div>
          <div style={{ fontSize: 11, color: tc, letterSpacing: '0.12em', marginTop: 1 }}>
            {TYPE_LABEL[track.type]}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            color: isLocked ? '#00D4FF' : '#FF2020',
          }}>
            ● {track.status}
          </div>
          <div style={{
            fontSize: 10, color: PRIO_COL[track.priority],
            border: `1px solid ${PRIO_COL[track.priority]}38`,
            padding: '1px 5px', marginTop: 2, letterSpacing: '0.08em',
          }}>
            P{track.priority}
          </div>
        </div>
      </div>

      {/* ── RF SIGNATURE ──────────────────────────────────────── */}
      <Section label="RF SIGNATURE" />
      <Row label="FREQUENCY"   value={`${track.rfProfile.freqGHz.toFixed(3)} GHz`} />
      <Row label="PROTOCOL"    value={track.rfProfile.protocol} color="#00D4FF" />
      <Row label="PULSE WIDTH" value={`${track.rfProfile.recPulseWidthNs} ns`} />
      <Row label="PRF"         value={`${track.rfProfile.recPrfHz} Hz`} />

      {/* Vulnerability */}
      <div style={{ padding: '5px 0 4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: '#484848', letterSpacing: '0.12em' }}>VULNERABILITY</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: vc, letterSpacing: '0.1em' }}>
            {track.rfProfile.vulnerability}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ flex: 1, height: 5, background: '#0A0A0A', borderRadius: 2 }}>
            <div style={{
              height: '100%', width: `${vpct}%`,
              background: `linear-gradient(90deg, ${vc}70, ${vc})`,
              borderRadius: 2, transition: 'width 0.4s',
            }} />
          </div>
          <span style={{ fontSize: 10, color: '#444', minWidth: 24 }}>{vpct}%</span>
        </div>
      </div>

      {/* RF Peaks spectrum */}
      {track.rfProfile.peaks.length > 0 && (
        <div style={{ padding: '3px 0' }}>
          <div style={{ fontSize: 10, color: '#333', letterSpacing: '0.1em', marginBottom: 4 }}>SIGNAL PEAKS</div>
          {track.rfProfile.peaks.map((p, i) => {
            const peakColor = p.label.includes('GPS') ? '#00FF41'
              : p.label.includes('VIDEO') || p.label.includes('CTRL') ? '#00D4FF'
              : p.label.includes('PAYLOAD') || p.label.includes('TRIG') ? '#FF2020'
              : '#F5A623'
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '2px 0' }}>
                <span style={{ fontSize: 9, color: peakColor, width: 52, letterSpacing: '0.06em' }}>
                  {p.freqGHz.toFixed(2)}G
                </span>
                <SpectrumBar pct={Math.round((Math.abs(p.dbm) / maxDbm) * 90)} color={peakColor} />
                <span style={{ fontSize: 9, color: '#444', width: 28, textAlign: 'right' }}>{p.dbm}dB</span>
                <span style={{ fontSize: 9, color: '#333', width: 48, letterSpacing: '0.04em' }}>{p.label}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── NAVIGATION & POSITION ─────────────────────────────── */}
      <Section label="NAVIGATION" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0 5px' }}>
        <Compass bearing={track.bearing} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: '#484848', letterSpacing: '0.12em' }}>BEARING</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F5A623', letterSpacing: '0.08em' }}>
            {String(Math.round(track.bearing)).padStart(3, '0')}°
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#484848', letterSpacing: '0.12em' }}>ALTITUDE</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#C0C0B8' }}>
            {Math.round(track.altitude)} m
          </div>
        </div>
      </div>
      <Row label="DISTANCE"    value={`${Math.round(track.distance)} m`} />
      <Row label="SPEED"       value={`${Math.round(track.speed)} m/s · ${Math.round(track.speed * 3.6)} km/h`} />
      <Row label="FLIGHT PATH" value={track.flightPath} color="#888" />
      <Row label="MISSION"     value={track.missionType} color="#888" />

      {/* ── ENGAGEMENT WINDOW ─────────────────────────────────── */}
      <Section label="ENGAGEMENT WINDOW" />
      {track.outOfRange ? (
        <div style={{ fontSize: 11, color: '#3A3A3A', letterSpacing: '0.08em', padding: '4px 0' }}>
          PATH CLEARS RANGE RING — MONITOR ONLY
        </div>
      ) : (
        <>
          <Row
            label="ENTERS 1km RING"
            value={inRange ? 'NOW — IN RANGE' : fmtS(track.entersRangeIn)}
            color={inRange ? '#FF2020' : '#F5A623'}
          />
          <Row label="IN-RANGE WINDOW"  value={fmtS(track.inRangeWindow)}  color="#F5A623" />
          <Row label="TIME TO OBJ"      value={fmtS(track.timeToObjective)} />
          <Row label="PRIORITY SCORE"   value={String(Math.round(track.priorityScore))} color="#F5A623" />
        </>
      )}

      {/* ── ACTION ──────────────────────────────────────────────── */}
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {isLocked && !isEngaging && (
          <button onClick={handleEngage} style={{
            padding: '9px 0', width: '100%', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.15em', border: '1px solid #FF2020', color: '#FF2020',
            background: 'rgba(255,32,32,0.08)', cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            ⚡ ENGAGE {mode.replace('_', ' ')}
          </button>
        )}
        {isTracking && (
          <button onClick={handleLock} style={{
            padding: '9px 0', width: '100%', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.15em', border: '1px solid #00D4FF', color: '#00D4FF',
            background: 'rgba(0,212,255,0.08)', cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            ⊕ LOCK TARGET
          </button>
        )}
        {isEngaging && (
          <div style={{
            padding: '9px 0', textAlign: 'center', fontSize: 12,
            fontWeight: 700, letterSpacing: '0.15em', color: '#F5A623',
            border: '1px solid #F5A62360', animation: 'hostile-pulse 0.5s ease-in-out infinite',
          }}>
            ⚡ ENGAGING…
          </div>
        )}
      </div>
    </div>
  )
}

// ── No-selection overview ──────────────────────────────────────────
function OverviewView() {
  const { tracks, neutralisedCount, systemStatus, mode, engagementLog } = useRCWSStore()

  const tracking  = tracks.filter(t => t.status === 'TRACKING').length
  const locked    = tracks.filter(t => t.status === 'LOCKED').length
  const neutralised = tracks.filter(t => t.status === 'NEUTRALISED').length
  const escaped   = tracks.filter(t => t.status === 'ESCAPED').length

  const typeCounts = (Object.keys(TYPE_LABEL) as string[]).map(type => ({
    type,
    count: tracks.filter(t => t.type === type && (t.status === 'TRACKING' || t.status === 'LOCKED')).length,
  }))
  const maxTypeCount = Math.max(1, ...typeCounts.map(t => t.count))

  const statusBoxes = [
    { l: 'TRACKING',   v: tracking,   c: '#FF2020' },
    { l: 'LOCKED',     v: locked,     c: '#00D4FF' },
    { l: 'NEUTRALISED', v: neutralised, c: '#00FF41' },
    { l: 'ESCAPED',    v: escaped,    c: '#F5A623' },
  ]

  const recentLog = [...engagementLog].slice(0, 6)
  const modeColor = mode === 'RF_JAM' ? '#00D4FF' : mode === 'DIRECTED_EMP' ? '#F5A623' : '#FF2020'

  return (
    <div style={{ padding: '10px 12px', fontSize: 12 }}>

      {/* Status grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 4 }}>
        {statusBoxes.map(({ l, v, c }) => (
          <div key={l} style={{
            padding: '6px 8px', background: '#040604',
            border: `1px solid ${v > 0 ? c + '28' : '#111'}`,
          }}>
            <div style={{ fontSize: 9, color: '#3A3A3A', letterSpacing: '0.14em', marginBottom: 2 }}>{l}</div>
            <div style={{
              fontSize: 20, fontWeight: 700,
              color: v > 0 ? c : '#282828',
              animation: (l === 'TRACKING' || l === 'LOCKED') && v > 0 ? 'hostile-pulse 2s ease-in-out infinite' : 'none',
            }}>
              {v}
            </div>
          </div>
        ))}
      </div>

      {/* Type breakdown */}
      <Section label="ACTIVE BY TYPE" />
      {typeCounts.map(({ type, count }) => (
        <div key={type} style={{ padding: '3px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 10, color: count > 0 ? TYPE_COLOR[type] : '#2A2A2A', letterSpacing: '0.1em' }}>
              {TYPE_LABEL[type]}
            </span>
            <span style={{ fontSize: 10, color: count > 0 ? '#666' : '#222' }}>{count}</span>
          </div>
          <div style={{ height: 3, background: '#0A0A0A', borderRadius: 2 }}>
            <div style={{
              height: '100%',
              width: `${count > 0 ? Math.max(8, (count / maxTypeCount) * 100) : 0}%`,
              background: TYPE_COLOR[type] + '70',
              borderRadius: 2, transition: 'width 0.35s',
            }} />
          </div>
        </div>
      ))}

      {/* System status */}
      <Section label="SYSTEM STATUS" />
      <Row
        label="ACTIVE MODE"
        value={mode.replace('_', ' ')}
        color={modeColor}
      />
      <Row
        label="SYSTEM"
        value={systemStatus}
        color={systemStatus === 'ENGAGING' ? '#FF2020' : systemStatus === 'ACTIVE' ? '#F5A623' : '#555'}
      />
      <Row label="TOTAL KILLS"  value={String(neutralisedCount).padStart(3, '0')} color="#00FF41" />
      <Row label="TOTAL TRACKS" value={String(tracks.length)} />

      {/* Threat score summary */}
      {(tracking + locked) > 0 && (() => {
        const hostileTracks = tracks.filter(t => t.status === 'TRACKING' || t.status === 'LOCKED')
        const highest = hostileTracks.reduce((a, b) => a.priorityScore > b.priorityScore ? a : b)
        return (
          <>
            <Section label="TOP PRIORITY" />
            <div style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ThreatIcon type={highest.type} size={16} color={TYPE_COLOR[highest.type] ?? '#888'} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#E0E0D8' }}>{highest.id}</span>
              <span style={{ fontSize: 11, color: TYPE_COLOR[highest.type], flex: 1 }}>
                {TYPE_LABEL[highest.type]}
              </span>
              <span style={{ fontSize: 11, color: '#F5A623' }}>{Math.round(highest.priorityScore)}</span>
            </div>
            <Row label="RANGE" value={`${Math.round(highest.distance)} m`} />
            <Row label="BEARING" value={`${Math.round(highest.bearing)}°`} />
          </>
        )
      })()}

      {/* Recent log */}
      {recentLog.length > 0 && (
        <>
          <Section label="RECENT LOG" />
          {recentLog.map(e => (
            <div key={e.id} style={{ display: 'flex', gap: 6, padding: '2px 0' }}>
              <span style={{ fontSize: 9, color: '#2A2A2A', flexShrink: 0 }}>{e.utc.slice(11, 19)}</span>
              <span style={{ fontSize: 9, color: LOG_COL[e.level] ?? '#444', flex: 1, letterSpacing: '0.03em' }}>
                {e.message}
              </span>
            </div>
          ))}
        </>
      )}

      {/* Empty state */}
      {tracks.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#2A2A2A', letterSpacing: '0.14em' }}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>SECTOR CLEAR</div>
          <div style={{ fontSize: 10 }}>NO THREATS DETECTED</div>
        </div>
      )}
    </div>
  )
}

export default function ThreatIntelPanel() {
  const { tracks, selectedTrackId } = useRCWSStore()
  const selected = tracks.find(t => t.id === selectedTrackId) ?? null

  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      {selected ? <SelectedView track={selected} /> : <OverviewView />}
    </div>
  )
}
