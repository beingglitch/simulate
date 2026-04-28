import { useState } from 'react'
import TrackInjector         from '../components/simulator/TrackInjector'
import MultiContactInjector  from '../components/simulator/MultiContactInjector'
import ScenarioPresets    from '../components/simulator/ScenarioPresets'
import SimulationControls from '../components/simulator/SimulationControls'
import EnvironmentControls from '../components/simulator/EnvironmentControls'
import { useRCWSStore }   from '../store/useRCWSStore'

const PASSWORD = 'SIM2026'

export default function SimulatorControl() {
  const [unlocked, setUnlocked] = useState(false)
  const [input,    setInput]    = useState('')
  const [error,    setError]    = useState(false)
  const { tracks, neutralisedCount, systemStatus } = useRCWSStore()

  if (!unlocked) {
    return (
      <div style={{
        width: '100vw', height: '100vh', background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        <div className="scanlines" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />

        <div style={{
          width: 340, padding: '32px 28px',
          border: '1px solid #1A1A1A',
          background: '#020202',
        }}>
          <div style={{ fontSize: 12, color: '#00D4FF', letterSpacing: '0.2em', marginBottom: 4 }}>
            EMP-RCWS SIM CONTROL
          </div>
          <div style={{ fontSize: 13, color: '#777', letterSpacing: '0.12em', marginBottom: 28 }}>
            CLASSIFIED ACCESS — AUTHORISED PERSONNEL ONLY
          </div>

          <div style={{ fontSize: 13, color: '#777', letterSpacing: '0.14em', marginBottom: 6 }}>
            ACCESS CODE
          </div>
          <input
            type="password"
            value={input}
            autoFocus
            onChange={e => { setInput(e.target.value); setError(false) }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (input === PASSWORD) setUnlocked(true)
                else { setError(true); setInput('') }
              }
            }}
            style={{
              width: '100%', padding: '8px 10px', fontSize: 14,
              background: '#000', border: `1px solid ${error ? '#FF2020' : '#222'}`,
              color: '#00D4FF', fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.3em', outline: 'none', marginBottom: 12,
              boxSizing: 'border-box',
            }}
          />

          {error && (
            <div style={{ fontSize: 12, color: '#FF2020', letterSpacing: '0.12em', marginBottom: 10 }}>
              ACCESS DENIED — INVALID CODE
            </div>
          )}

          <button
            onClick={() => {
              if (input === PASSWORD) setUnlocked(true)
              else { setError(true); setInput('') }
            }}
            style={{
              width: '100%', padding: '8px', fontSize: 13, letterSpacing: '0.16em', fontWeight: 700,
              border: '1px solid #00D4FF', color: '#00D4FF', background: 'rgba(0,212,255,0.06)',
              cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            AUTHENTICATE
          </button>
        </div>
      </div>
    )
  }

  // ── Unlocked UI ───────────────────────────────────────────────
  const active = tracks.filter(t => t.status === 'TRACKING' || t.status === 'LOCKED').length

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#000',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      <div className="scanlines" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div style={{
        height: 40, flexShrink: 0, borderBottom: '1px solid #1A1A1A',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 0,
        background: '#000', zIndex: 1,
      }}>
        <span style={{ fontSize: 13, color: '#00D4FF', fontWeight: 700, letterSpacing: '0.16em', marginRight: 20 }}>
          SIM CONTROL · CLASSIFIED
        </span>

        <div style={{ padding: '0 10px', borderLeft: '1px solid #111' }}>
          <span style={{ fontSize: 13, color: '#777', display: 'block', letterSpacing: '0.1em' }}>STATUS</span>
          <span style={{ fontSize: 12, color: STATUS_COL[systemStatus], fontWeight: 700 }}>{systemStatus}</span>
        </div>
        <div style={{ padding: '0 10px', borderLeft: '1px solid #111' }}>
          <span style={{ fontSize: 13, color: '#777', display: 'block', letterSpacing: '0.1em' }}>ACTIVE</span>
          <span style={{ fontSize: 12, color: '#FF2020', fontWeight: 700 }}>{active}</span>
        </div>
        <div style={{ padding: '0 10px', borderLeft: '1px solid #111' }}>
          <span style={{ fontSize: 13, color: '#777', display: 'block', letterSpacing: '0.1em' }}>KILLS</span>
          <span style={{ fontSize: 12, color: '#00FF41', fontWeight: 700 }}>{neutralisedCount}</span>
        </div>

        <div style={{ flex: 1 }} />
        <a
          href="/operator"
          style={{
            fontSize: 13, color: '#777', letterSpacing: '0.12em',
            textDecoration: 'none', border: '1px solid #1A1A1A', padding: '3px 8px',
          }}
        >
          → OPERATOR VIEW
        </a>
      </div>

      {/* Content grid */}
      <div style={{
        flex: 1, display: 'grid', overflow: 'auto',
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: 'auto auto',
        gap: 0, zIndex: 1,
        alignContent: 'start',
      }}>
        <Cell><ScenarioPresets /></Cell>
        <Cell><TrackInjector /></Cell>
        <Cell><MultiContactInjector /></Cell>
        <Cell><SimulationControls /></Cell>
        <Cell style={{ gridColumn: 'span 2' }}><EnvironmentControls /></Cell>
      </div>
    </div>
  )
}

const STATUS_COL: Record<string, string> = {
  STANDBY: '#555', ACTIVE: '#F5A623', ENGAGING: '#FF2020',
}

function Cell({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      borderRight: '1px solid #111', borderBottom: '1px solid #111',
      ...style,
    }}>
      {children}
    </div>
  )
}
