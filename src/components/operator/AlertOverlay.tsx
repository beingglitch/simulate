import { useEffect } from 'react'
import { useRCWSStore } from '../../store/useRCWSStore'
import type { Alert } from '../../types'

export default function AlertOverlay() {
  const { alerts, dismissAlert, initiateEngagement, selectTrack, tracks } = useRCWSStore()

  const visible = alerts.filter(a => !a.dismissed)

  // Auto-dismiss
  useEffect(() => {
    const timers = visible
      .filter(a => a.autoDismiss)
      .map(a => setTimeout(() => dismissAlert(a.id), a.autoDismissMs))
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.length])

  if (visible.length === 0) return null

  return (
    <div style={{
      position: 'absolute', top: 46, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, display: 'flex', flexDirection: 'column', gap: 6,
      alignItems: 'center', pointerEvents: 'none',
      width: 400,
    }}>
      {visible.map(a => <AlertCard key={a.id} alert={a} onDismiss={() => dismissAlert(a.id)}
        onEmergencyEngage={() => {
          const t = tracks.find(x => x.id === a.trackId)
          if (t) { selectTrack(t.id); setTimeout(() => initiateEngagement(), 100) }
        }}
      />)}
    </div>
  )
}

function AlertCard({
  alert, onDismiss, onEmergencyEngage,
}: { alert: Alert; onDismiss: () => void; onEmergencyEngage: () => void }) {
  const cfg = ALERT_CONFIG[alert.type]

  return (
    <div style={{
      width: '100%', padding: '10px 14px',
      border: `1px solid ${cfg.border}`,
      background: cfg.bg,
      pointerEvents: 'all',
      animation: alert.type === 'ENEMY_FIRING' ? 'hostile-pulse 0.4s ease-in-out infinite' : 'none',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 16, color: cfg.accent, flexShrink: 0 }}>{cfg.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: cfg.accent, letterSpacing: '0.1em', lineHeight: 1.3 }}>
            {alert.message}
          </div>
          <div style={{ fontSize: 12, color: cfg.sub, letterSpacing: '0.06em', marginTop: 2, lineHeight: 1.4 }}>
            {alert.subMessage}
          </div>
        </div>
        {alert.autoDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: 'none', border: 'none', color: '#555',
              cursor: 'pointer', fontSize: 14, padding: '0 2px', flexShrink: 0,
            }}
          >✕</button>
        )}
      </div>

      {/* Action buttons for persistent alerts */}
      {alert.type === 'THREAT_REALIZED' && (
        <button
          onClick={onDismiss}
          style={{
            marginTop: 6, padding: '4px 12px', fontSize: 12, letterSpacing: '0.14em', fontWeight: 700,
            border: `1px solid ${cfg.accent}`, color: cfg.accent,
            background: `${cfg.accent}15`, cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace', width: '100%',
          }}
        >
          ACKNOWLEDGE
        </button>
      )}
      {alert.type === 'ENEMY_FIRING' && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button
            onClick={onEmergencyEngage}
            style={{
              flex: 1, padding: '4px 8px', fontSize: 12, letterSpacing: '0.12em', fontWeight: 700,
              border: '1px solid #FF2020', color: '#FF2020', background: 'rgba(255,32,32,0.12)',
              cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            EMERGENCY ENGAGE
          </button>
          <button
            onClick={onDismiss}
            style={{
              flex: 1, padding: '4px 8px', fontSize: 12, letterSpacing: '0.12em', fontWeight: 700,
              border: '1px solid #555', color: '#888', background: 'transparent',
              cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            EVADE
          </button>
        </div>
      )}
    </div>
  )
}

const ALERT_CONFIG: Record<string, {
  accent: string; border: string; bg: string; sub: string; icon: string
}> = {
  ESCAPED: {
    accent: '#F5A623', border: '#F5A62350', bg: 'rgba(245,166,35,0.08)',
    sub: '#F5A62380', icon: '⚠',
  },
  THREAT_REALIZED: {
    accent: '#FF2020', border: '#FF202060', bg: 'rgba(255,32,32,0.1)',
    sub: '#FF202080', icon: '✕',
  },
  ENEMY_FIRING: {
    accent: '#FF2020', border: '#FF2020', bg: 'rgba(255,32,32,0.12)',
    sub: '#FF2020A0', icon: '⚡',
  },
  ENTERING_RANGE: {
    accent: '#00D4FF', border: '#00D4FF50', bg: 'rgba(0,212,255,0.07)',
    sub: '#00D4FF80', icon: '◎',
  },
}
