// Left panel — detected active threats only + action buttons
import { useEffect, useRef } from 'react'
import { useRCWSStore } from '../../store/useRCWSStore'
import ThreatIcon from '../icons/ThreatIcon'
import { playLockTone, playHostileWarning, resumeAudio } from '../../utils/audio'
import type { Track } from '../../types'

const TYPE_LABEL: Record<string, string> = {
  FPV_DRONE: 'FPV DRONE', RF_IED: 'RF-IED', ENEMY_RCWS: 'E-RCWS', UNKNOWN: 'UNKNOWN',
}
const TYPE_COLOR: Record<string, string> = {
  FPV_DRONE: '#00D4FF', RF_IED: '#FF2020', ENEMY_RCWS: '#F5A623', UNKNOWN: '#888888',
}
const PRIO_COL: Record<number, string> = { 1: '#FF2020', 2: '#F5A623', 3: '#888' }

function fmtS(s: number | null | undefined): string {
  if (s == null || s < 0) return '—'
  return `${Math.round(s)}s`
}

function ThreatCard({ track, selected, queued, preSelected, recommended }: {
  track: Track; selected: boolean; queued: boolean; preSelected: boolean; recommended: boolean
}) {
  const {
    selectTrack, lockTarget, engagementQueue, setEngagementQueue,
    setPreSelected, preSelectedContactId, isEngaging,
  } = useRCWSStore()

  const tc = TYPE_COLOR[track.type] ?? '#888'
  const isLocked   = track.status === 'LOCKED'
  const isTracking = track.status === 'TRACKING'
  const inRange    = track.contactStatus === 'IN_RANGE'

  const borderCol = preSelected ? '#F5A623'
    : selected    ? '#00D4FF'
    : isLocked    ? '#00D4FF50'
    : '#FF202050'

  function handleLock(e: React.MouseEvent) {
    e.stopPropagation(); resumeAudio()
    if (isTracking) { lockTarget(track.id); playLockTone() }
  }

  function handleEngage(e: React.MouseEvent) {
    e.stopPropagation(); resumeAudio()
    if (isLocked && !isEngaging) {
      const s = useRCWSStore.getState()
      s.selectTrack(track.id)
      setTimeout(() => s.initiateEngagement(), 100)
    }
  }

  function handleQueue(e: React.MouseEvent) {
    e.stopPropagation()
    if (!isLocked) return
    if (queued) setEngagementQueue(engagementQueue.filter(id => id !== track.id))
    else setEngagementQueue([...engagementQueue, track.id])
  }

  function handlePreSel(e: React.MouseEvent) {
    e.stopPropagation()
    setPreSelected(preSelectedContactId === track.id ? null : track.id)
  }

  return (
    <div
      onClick={() => { resumeAudio(); selectTrack(track.id) }}
      style={{
        padding: '10px 12px 8px',
        borderLeft: `3px solid ${borderCol}`,
        borderBottom: '1px solid #181818',
        background: selected   ? 'rgba(0,212,255,0.05)'
          : preSelected        ? 'rgba(245,166,35,0.05)'
          : 'transparent',
        cursor: 'pointer',
        animation: isTracking && !selected ? 'hostile-pulse 2.8s ease-in-out infinite' : 'none',
        transition: 'background 0.12s',
      }}
    >
      {/* Row 1: icon + id + badges + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <ThreatIcon type={track.type} size={16} color={tc} />
        <span style={{ fontSize: 14, fontWeight: 700, color: selected ? '#00D4FF' : '#E0E0D8', letterSpacing: '0.05em' }}>
          {track.id}
        </span>
        <span style={{
          fontSize: 10, padding: '1px 5px',
          border: `1px solid ${tc}40`, color: tc, background: `${tc}12`, letterSpacing: '0.1em',
        }}>
          {TYPE_LABEL[track.type]}
        </span>
        <span style={{
          fontSize: 10, padding: '1px 4px',
          border: `1px solid ${PRIO_COL[track.priority]}40`,
          color: PRIO_COL[track.priority], letterSpacing: '0.08em',
        }}>
          P{track.priority}
        </span>
        {recommended && (
          <span style={{ fontSize: 10, color: '#F5A623', letterSpacing: '0.08em', animation: 'hostile-pulse 1.4s infinite' }}>
            ★
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          color: isLocked ? '#00D4FF' : '#FF2020',
        }}>
          {isLocked ? '● LOCKED' : '● TRACK'}
        </span>
      </div>

      {/* Row 2: nav data */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 7 }}>
        {[
          { l: 'BRG', v: `${Math.round(track.bearing)}°` },
          { l: 'DST', v: `${Math.round(track.distance)}m` },
          { l: 'ALT', v: `${Math.round(track.altitude)}m` },
          { l: 'SPD', v: `${Math.round(track.speed)}m/s` },
        ].map(({ l, v }) => (
          <div key={l}>
            <div style={{ fontSize: 10, color: '#444', letterSpacing: '0.1em' }}>{l}</div>
            <div style={{ fontSize: 12, color: '#C0C0B8', fontWeight: 600 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Row 3: engagement window */}
      {!track.outOfRange && (inRange || track.entersRangeIn != null) && (
        <div style={{
          fontSize: 11, padding: '3px 7px', marginBottom: 7,
          background: '#080808',
          borderLeft: `2px solid ${inRange ? '#FF2020' : '#F5A62360'}`,
          color: inRange ? '#FF2020' : '#F5A623', letterSpacing: '0.08em',
        }}>
          {inRange
            ? '⚡ IN RANGE NOW'
            : `RANGE IN ${fmtS(track.entersRangeIn)} · WIN ${fmtS(track.inRangeWindow)}`
          }
        </div>
      )}

      {/* Row 4: action buttons */}
      <div style={{ display: 'flex', gap: 5 }}>
        {isTracking && (
          <button onClick={handleLock} style={actionBtn('#00D4FF', true)}>
            ⊕ LOCK
          </button>
        )}
        {isLocked && (
          <button onClick={handleEngage} style={actionBtn('#FF2020', true)}>
            ⚡ ENGAGE
          </button>
        )}
        {isLocked && (
          <button onClick={handleQueue}
            style={actionBtn(queued ? '#F5A623' : '#F5A62350', false, queued ? 'rgba(245,166,35,0.1)' : 'transparent')}>
            {queued ? `Q#${engagementQueue.indexOf(track.id) + 1}` : 'QUEUE'}
          </button>
        )}
        {isTracking && (
          <button onClick={handlePreSel}
            style={actionBtn(preSelected ? '#F5A623' : '#2A2A2A', false, preSelected ? 'rgba(245,166,35,0.08)' : 'transparent')}>
            {preSelected ? '⚡PRE' : 'PRE'}
          </button>
        )}
      </div>
    </div>
  )
}

function actionBtn(color: string, flex?: boolean, bg = 'transparent'): React.CSSProperties {
  return {
    flex: flex ? 1 : undefined,
    padding: '5px 10px', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.1em', border: `1px solid ${color}`, color,
    background: bg || `${color}10`, cursor: 'pointer',
    fontFamily: 'JetBrains Mono, monospace',
  }
}

export default function ThreatDetectionPanel() {
  const {
    tracks, selectedTrackId, engagementQueue,
    preSelectedContactId, lockAll, setEngagementQueue,
    initiateEngagement, selectTrack,
  } = useRCWSStore()

  const prevCount = useRef(tracks.length)
  useEffect(() => {
    if (tracks.length > prevCount.current) playHostileWarning()
    prevCount.current = tracks.length
  }, [tracks.length])

  const active = tracks
    .filter(t => t.status === 'TRACKING' || t.status === 'LOCKED')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'TRACKING' ? -1 : 1
      return b.priorityScore - a.priorityScore
    })

  const trackingCount = active.filter(t => t.status === 'TRACKING').length
  const lockedCount   = active.filter(t => t.status === 'LOCKED').length
  const neutralCount  = tracks.filter(t => t.status === 'NEUTRALISED').length
  const escapedCount  = tracks.filter(t => t.status === 'ESCAPED').length
  const unqueuedLocked = active.filter(t => t.status === 'LOCKED' && !engagementQueue.includes(t.id))
  const recommendedId = active.length > 0 ? active[0].id : null

  function handleLockAll() { resumeAudio(); lockAll(); playLockTone() }

  function handleEngageAll() {
    resumeAudio()
    const locked = tracks.filter(t => t.status === 'LOCKED').sort((a, b) => b.priorityScore - a.priorityScore)
    if (!locked.length) return
    const [first, ...rest] = locked
    setEngagementQueue(rest.map(t => t.id))
    selectTrack(first.id)
    setTimeout(() => initiateEngagement(), 100)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Status bar */}
      <div style={{
        padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 8,
        background: '#030603', borderBottom: '1px solid #1A1A1A', flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, color: '#444', letterSpacing: '0.16em', flex: 1 }}>
          DETECTED THREATS
        </span>
        {active.length > 0 ? (
          <span style={{
            fontSize: 12, fontWeight: 700, color: '#FF2020',
            padding: '1px 7px', border: '1px solid #FF202050',
            background: 'rgba(255,32,32,0.06)', letterSpacing: '0.1em',
            animation: 'hostile-pulse 1.6s ease-in-out infinite',
          }}>
            {active.length} ACTIVE
          </span>
        ) : (
          <span style={{ fontSize: 11, color: '#333', letterSpacing: '0.1em' }}>ALL CLEAR</span>
        )}
      </div>

      {/* Bulk controls */}
      {(trackingCount > 1 || lockedCount > 1) && (
        <div style={{
          padding: '5px 10px', display: 'flex', gap: 4, flexWrap: 'wrap',
          background: '#020402', borderBottom: '1px solid #181818', flexShrink: 0,
        }}>
          {trackingCount > 1 && (
            <button onClick={handleLockAll} style={actionBtn('#00D4FF')}>
              LOCK ALL ({trackingCount})
            </button>
          )}
          {lockedCount > 1 && (
            <button onClick={handleEngageAll} style={actionBtn('#FF2020')}>
              ENGAGE ALL ({lockedCount})
            </button>
          )}
          {engagementQueue.length > 0 && unqueuedLocked.length > 0 && (
            <button
              onClick={() => setEngagementQueue([...engagementQueue, ...unqueuedLocked.map(t => t.id)])}
              style={actionBtn('#F5A623')}
            >
              +{unqueuedLocked.length}
            </button>
          )}
          {engagementQueue.length > 0 && (
            <span style={{ fontSize: 11, color: '#F5A623', letterSpacing: '0.08em', alignSelf: 'center' }}>
              Q:{engagementQueue.length}
            </span>
          )}
        </div>
      )}

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {active.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: '#333', fontSize: 12, letterSpacing: '0.12em' }}>
            NO ACTIVE THREATS<br />
            <span style={{ fontSize: 10, color: '#1A1A1A', display: 'block', marginTop: 8 }}>
              MONITORING ALL SECTORS
            </span>
          </div>
        ) : (
          active.map(t => (
            <ThreatCard
              key={t.id}
              track={t}
              selected={t.id === selectedTrackId}
              queued={engagementQueue.includes(t.id)}
              preSelected={t.id === preSelectedContactId}
              recommended={t.id === recommendedId}
            />
          ))
        )}
      </div>

      {/* Neutralized / escaped footer */}
      {(neutralCount > 0 || escapedCount > 0) && (
        <div style={{
          padding: '5px 12px', display: 'flex', gap: 16, flexShrink: 0,
          borderTop: '1px solid #111', background: '#020402',
        }}>
          {neutralCount > 0 && (
            <span style={{ fontSize: 11, color: '#00FF4155', letterSpacing: '0.1em' }}>
              ● {neutralCount} NEUTRALISED
            </span>
          )}
          {escapedCount > 0 && (
            <span style={{ fontSize: 11, color: '#F5A62350', letterSpacing: '0.1em' }}>
              ◎ {escapedCount} ESCAPED
            </span>
          )}
        </div>
      )}
    </div>
  )
}
