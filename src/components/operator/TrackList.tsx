import { useRCWSStore } from '../../store/useRCWSStore'
import { playLockTone, playHostileWarning, resumeAudio } from '../../utils/audio'
import type { Track } from '../../types'
import { useEffect, useRef } from 'react'
import ThreatIcon from '../icons/ThreatIcon'

const TYPE_LABEL: Record<string, string> = {
  FPV_DRONE:  'FPV DRONE',
  RF_IED:     'RF-IED',
  ENEMY_RCWS: 'E-RCWS',
  UNKNOWN:    'UNKNOWN',
}
const TYPE_COLOR: Record<string, string> = {
  FPV_DRONE:  '#00D4FF',
  RF_IED:     '#FF2020',
  ENEMY_RCWS: '#F5A623',
  UNKNOWN:    '#888888',
}
const STATUS_COLOR: Record<string, string> = {
  TRACKING:    '#FF2020',
  LOCKED:      '#00D4FF',
  NEUTRALISED: '#00FF41',
  ESCAPED:     '#666666',
}
const PRIORITY_COLOR: Record<number, string> = { 1: '#FF2020', 2: '#F5A623', 3: '#888' }

function fmtTime(s: number | null | undefined): string {
  if (s == null || s < 0) return '—'
  return `${Math.round(s)}s`
}

function TrackCard({
  track, selected, queued, isPreSelected,
}: { track: Track; selected: boolean; queued: boolean; isPreSelected: boolean }) {
  const {
    selectTrack, lockTarget, engagementQueue, setEngagementQueue,
    setPreSelected, preSelectedContactId,
  } = useRCWSStore()

  const typeCol = TYPE_COLOR[track.type] ?? '#888'

  function handleClick() { resumeAudio(); selectTrack(track.id) }

  function handleLock(e: React.MouseEvent) {
    e.stopPropagation(); resumeAudio()
    if (track.status === 'TRACKING') { lockTarget(track.id); playLockTone() }
  }

  function handleQueue(e: React.MouseEvent) {
    e.stopPropagation()
    if (track.status !== 'LOCKED') return
    if (queued) setEngagementQueue(engagementQueue.filter(id => id !== track.id))
    else setEngagementQueue([...engagementQueue, track.id])
  }

  function handlePreSelect(e: React.MouseEvent) {
    e.stopPropagation()
    if (preSelectedContactId === track.id) setPreSelected(null)
    else setPreSelected(track.id)
  }

  const hostile = track.status === 'TRACKING' || track.status === 'LOCKED'
  const dim = track.status === 'NEUTRALISED' || track.status === 'ESCAPED'
  const statusCol = STATUS_COLOR[track.status]

  return (
    <div
      onClick={handleClick}
      style={{
        padding: '10px 12px',
        borderLeft: `3px solid ${
          isPreSelected ? '#F5A623' :
          selected ? '#00D4FF' :
          queued ? '#F5A62380' :
          hostile ? statusCol + '80' : '#222'
        }`,
        borderBottom: '1px solid #1A1A1A',
        background: selected ? 'rgba(0,212,255,0.06)'
          : isPreSelected ? 'rgba(245,166,35,0.06)'
          : queued ? 'rgba(245,166,35,0.03)'
          : 'transparent',
        cursor: 'pointer',
        position: 'relative',
        opacity: dim ? 0.5 : 1,
        animation: (hostile && !selected && !queued) ? 'hostile-pulse 2s ease-in-out infinite' : 'none',
        transition: 'background 0.1s',
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          <ThreatIcon type={track.type} size={17} color={dim ? '#444' : typeCol} />

          <span style={{ color: selected ? '#00D4FF' : '#E0E0D8', fontSize: 13, fontWeight: 700, letterSpacing: '0.05em' }}>
            {track.id}
          </span>

          {/* Type badge */}
          <span style={{
            fontSize: 11, padding: '1px 5px',
            border: `1px solid ${typeCol}50`,
            color: dim ? '#555' : typeCol,
            background: `${typeCol}10`,
            letterSpacing: '0.1em',
          }}>
            {TYPE_LABEL[track.type]}
          </span>

          <span style={{
            fontSize: 11, color: PRIORITY_COLOR[track.priority],
            border: `1px solid ${PRIORITY_COLOR[track.priority]}40`,
            padding: '1px 4px', letterSpacing: '0.08em',
          }}>
            P{track.priority}
          </span>
        </div>

        <span style={{ fontSize: 12, color: statusCol, fontWeight: 700, letterSpacing: '0.1em' }}>
          {track.status}
        </span>
      </div>

      {/* RF row */}
      <div style={{ fontSize: 12, color: '#777', marginBottom: 5, letterSpacing: '0.04em' }}>
        {track.rfProfile.freqGHz}GHz · {track.rfProfile.protocol}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 5 }}>
        <StatItem label="BRG" value={`${Math.round(track.bearing)}°`} />
        <StatItem label="SPD" value={`${Math.round(track.speed)}m/s`} />
        <StatItem label="DST" value={`${Math.round(track.distance)}m`} />
        <StatItem label="ALT" value={`${Math.round(track.altitude)}m`} />
      </div>

      {/* Timing row — only for active hostile */}
      {hostile && !track.outOfRange && (
        <div style={{
          display: 'flex', gap: 12,
          padding: '4px 0', borderTop: '1px solid #111', marginTop: 2,
        }}>
          <TimingItem
            label="ENTERS RANGE"
            value={track.contactStatus === 'IN_RANGE' ? 'NOW' : fmtTime(track.entersRangeIn)}
            color={track.contactStatus === 'IN_RANGE' ? '#FF2020' : '#F5A623'}
          />
          <TimingItem label="IN-RANGE WIN" value={fmtTime(track.inRangeWindow)} color="#F5A623" />
          <TimingItem label="TO OBJ" value={fmtTime(track.timeToObjective)} color="#888" />
        </div>
      )}

      {hostile && track.outOfRange && (
        <div style={{
          fontSize: 11, color: '#444', letterSpacing: '0.1em',
          borderTop: '1px solid #111', paddingTop: 4, marginTop: 2,
        }}>
          OUT OF RANGE — MONITORING
        </div>
      )}

      {/* Priority score */}
      {hostile && (
        <div style={{ fontSize: 11, color: '#444', letterSpacing: '0.08em', marginTop: 2 }}>
          PRIORITY SCORE: {Math.round(track.priorityScore)}
        </div>
      )}

      {/* Action buttons */}
      <div style={{
        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        {track.status === 'TRACKING' && (
          <button onClick={handleLock} style={btnStyle('#00D4FF')}>LOCK</button>
        )}
        {track.status === 'LOCKED' && (
          <button onClick={handleQueue} style={btnStyle(queued ? '#F5A623' : '#F5A62350', queued ? 'rgba(245,166,35,0.1)' : 'transparent')}>
            {queued ? 'QUEUED' : 'QUEUE'}
          </button>
        )}
        {hostile && track.status === 'TRACKING' && (
          <button
            onClick={handlePreSelect}
            style={btnStyle(isPreSelected ? '#F5A623' : '#333', isPreSelected ? 'rgba(245,166,35,0.1)' : 'transparent')}
          >
            {isPreSelected ? 'PRE-SEL' : 'PRE-SEL'}
          </button>
        )}
        {queued && (
          <div style={{ fontSize: 12, textAlign: 'center', color: '#F5A623', letterSpacing: '0.08em' }}>
            #{engagementQueue.indexOf(track.id) + 1}
          </div>
        )}
      </div>
    </div>
  )
}

function btnStyle(color: string, bg = 'transparent'): React.CSSProperties {
  return {
    padding: '3px 8px', fontSize: 11, letterSpacing: '0.1em', fontWeight: 700,
    border: `1px solid ${color}`, color,
    background: bg, cursor: 'pointer',
    fontFamily: 'JetBrains Mono, monospace',
  }
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#555', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: 12, color: '#C8C8C0', fontWeight: 600 }}>{value}</div>
    </div>
  )
}

function TimingItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#444', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ fontSize: 12, color, fontWeight: 700 }}>{value}</div>
    </div>
  )
}

export default function TrackList() {
  const {
    tracks, selectedTrackId, engagementQueue, preSelectedContactId,
    lockAll, setEngagementQueue, initiateEngagement, selectTrack,
  } = useRCWSStore()

  const prevCount = useRef(tracks.length)

  useEffect(() => {
    if (tracks.length > prevCount.current) playHostileWarning()
    prevCount.current = tracks.length
  }, [tracks.length])

  const trackingCount  = tracks.filter(t => t.status === 'TRACKING').length
  const lockedCount    = tracks.filter(t => t.status === 'LOCKED').length
  const unqueuedLocked = tracks.filter(t => t.status === 'LOCKED' && !engagementQueue.includes(t.id))

  function handleLockAll() { resumeAudio(); lockAll(); playLockTone() }

  function handleEngageQueue() {
    resumeAudio()
    const locked = tracks
      .filter(t => t.status === 'LOCKED')
      .sort((a, b) => b.priorityScore - a.priorityScore)
    if (locked.length === 0) return
    const [first, ...rest] = locked
    setEngagementQueue(rest.map(t => t.id))
    selectTrack(first.id)
    setTimeout(() => initiateEngagement(), 100)
  }

  // Sort: by priority score descending, then status order
  const sorted = [...tracks].sort((a, b) => {
    const statusOrder: Record<string, number> = { TRACKING: 0, LOCKED: 1, NEUTRALISED: 2, ESCAPED: 3 }
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status]
    return b.priorityScore - a.priorityScore
  })

  // Highlight top-score active track as RECOMMENDED
  const activeHostile = sorted.filter(t => t.status === 'TRACKING' || t.status === 'LOCKED')
  const recommendedId = activeHostile.length > 0 ? activeHostile[0].id : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>

      {/* Multi-target controls */}
      {(trackingCount > 1 || lockedCount > 1) && (
        <div style={{
          padding: '7px 12px',
          borderBottom: '1px solid #1A1A1A',
          display: 'flex', gap: 5, alignItems: 'center', background: '#050505',
        }}>
          {trackingCount > 1 && (
            <button onClick={handleLockAll} style={btnStyle('#00D4FF', 'rgba(0,212,255,0.06)')}>
              LOCK ALL ({trackingCount})
            </button>
          )}
          {lockedCount > 1 && (
            <button onClick={handleEngageQueue} style={btnStyle('#FF2020', 'rgba(255,32,32,0.06)')}>
              ENGAGE ALL ({lockedCount})
            </button>
          )}
          {engagementQueue.length > 0 && unqueuedLocked.length > 0 && (
            <button
              onClick={() => setEngagementQueue([...engagementQueue, ...unqueuedLocked.map(t => t.id)])}
              style={btnStyle('#F5A623')}
            >
              +{unqueuedLocked.length}
            </button>
          )}
          {engagementQueue.length > 0 && (
            <div style={{ fontSize: 12, color: '#F5A623', letterSpacing: '0.08em', paddingLeft: 4 }}>
              Q:{engagementQueue.length}
            </div>
          )}
        </div>
      )}

      {/* Track cards */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {sorted.length === 0 && (
          <div style={{
            padding: 24, textAlign: 'center',
            color: '#444', fontSize: 12, letterSpacing: '0.12em',
          }}>
            NO TRACKS<span style={{ animation: 'cursor-blink 1s infinite' }}> ▋</span>
          </div>
        )}
        {sorted.map(t => (
          <div key={t.id} style={{ position: 'relative' }}>
            {/* RECOMMENDED badge */}
            {t.id === recommendedId && (
              <div style={{
                position: 'absolute', top: 6, right: 90, fontSize: 9,
                color: '#F5A623', letterSpacing: '0.12em', zIndex: 1,
                animation: 'hostile-pulse 1.5s ease-in-out infinite',
              }}>
                ★ REC
              </div>
            )}
            <TrackCard
              track={t}
              selected={t.id === selectedTrackId}
              queued={engagementQueue.includes(t.id)}
              isPreSelected={t.id === preSelectedContactId}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
