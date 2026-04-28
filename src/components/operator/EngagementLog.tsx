import { useEffect, useRef } from 'react'
import { useRCWSStore } from '../../store/useRCWSStore'
import type { LogLevel } from '../../types'

const LEVEL_COLOR: Record<LogLevel, string> = {
  SYSTEM:  '#F5A623',
  INFO:    '#00D4FF',
  HOSTILE: '#FF2020',
  KILL:    '#00FF41',
}

export default function EngagementLog() {
  const { engagementLog } = useRCWSStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [engagementLog.length])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{
        fontSize: 12, color: '#777', letterSpacing: '0.14em',
        padding: '8px 12px 6px', borderBottom: '1px solid #111', flexShrink: 0,
      }}>
        ENGAGEMENT LOG
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        padding: '4px 0',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        {engagementLog.map(entry => (
          <div
            key={entry.id}
            style={{
              padding: '3px 10px',
              display: 'grid',
              gridTemplateColumns: '58px 28px 1fr',
              gap: '0 6px',
              alignItems: 'start',
              borderBottom: '1px solid #0A0A0A',
            }}
          >
            <span style={{ fontSize: 13, color: '#666', letterSpacing: '0.04em', paddingTop: 1 }}>
              {entry.utc}
            </span>
            <span style={{
              fontSize: 13, fontWeight: 700, letterSpacing: '0.06em',
              color: LEVEL_COLOR[entry.level], paddingTop: 1,
            }}>
              {entry.level.slice(0, 4)}
            </span>
            <span style={{ fontSize: 12, color: '#C0C0B8', lineHeight: 1.4, wordBreak: 'break-word' }}>
              {entry.message}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
