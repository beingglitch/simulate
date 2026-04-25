import { useEffect, useState } from 'react'
import type { SimState } from '../types'

interface Props {
  state: SimState
  onReset: () => void
}

export default function TopBar({ state, onReset }: Props) {
  const [clock, setClock] = useState('')
  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z')
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const activeThreats  = state.threats.filter(t => t.status === 'APPROACHING').length
  const neutralised    = state.killLog.length
  const escaped        = state.threats.filter(t => t.status === 'ESCAPED').length

  return (
    <div
      className="flex items-center justify-between px-4"
      style={{
        height: 40,
        background: '#060e1a',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      {/* Identity */}
      <div className="flex items-center gap-3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: '#3dd68c',
            boxShadow: '0 0 5px #3dd68c',
          }} className="blink" />
          <span className="mono" style={{ color: '#4da6ff', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em' }}>
            EMP-RCWS
          </span>
        </div>
        <div className="topbar-sep" />
        <span className="mono" style={{ color: 'rgba(160,185,215,0.45)', fontSize: 10, letterSpacing: '0.08em' }}>
          EMP-RCWS · COUNTER-UAS / EW SIMULATOR
        </span>
      </div>

      {/* Metrics */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Metric label="TRACKS"     value={String(state.threats.length)} />
        <Metric label="HOSTILE"    value={String(activeThreats)} accent={activeThreats > 0 ? '#f05252' : '#3dd68c'} />
        <Metric label="NEUTRALISED" value={String(neutralised)} accent={neutralised > 0 ? '#3dd68c' : undefined} />
        {escaped > 0 && <Metric label="ESCAPED" value={String(escaped)} accent="#f59e0b" />}
        <Metric label="MODE"       value={state.turret.mode.replace(/_/g, ' ')} accent="#4da6ff" />
        <Metric label="AZ"         value={`${state.turret.azimuth.toFixed(0)}°`} />
        <Metric label="EL"         value={`${state.turret.elevation.toFixed(0)}°`} />
      </div>

      {/* Clock + status + reset */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="mono" style={{ color: 'rgba(160,190,225,0.4)', fontSize: 10 }}>UTC</span>
        <span className="mono" style={{ color: 'rgba(200,220,245,0.75)', fontSize: 11 }}>{clock}</span>
        <div className="topbar-sep" />
        <div
          className="mono"
          style={{
            fontSize: 10, letterSpacing: '0.08em', padding: '2px 8px',
            border: `1px solid ${state.pipelineActive ? 'rgba(245,158,11,0.5)' : 'rgba(61,214,140,0.25)'}`,
            color:  state.pipelineActive ? '#f5bc4b' : '#3dd68c',
            background: state.pipelineActive ? 'rgba(245,158,11,0.06)' : 'rgba(61,214,140,0.04)',
          }}
        >
          {state.pipelineActive ? '● ENGAGING' : '● STANDBY'}
        </div>
        <div className="topbar-sep" />
        <button
          onClick={onReset}
          className="mono"
          title="Reset scenario [R]"
          style={{
            padding: '2px 10px', fontSize: 9, letterSpacing: '0.1em',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'transparent',
            color: 'rgba(160,190,225,0.45)',
            cursor: 'pointer',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(240,82,82,0.4)'
            ;(e.currentTarget as HTMLElement).style.color = '#f07070'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'
            ;(e.currentTarget as HTMLElement).style.color = 'rgba(160,190,225,0.45)'
          }}
        >
          RESET [R]
        </button>
      </div>
    </div>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span className="mono" style={{ color: 'rgba(140,170,205,0.38)', fontSize: 9, letterSpacing: '0.1em' }}>{label}</span>
      <span className="mono" style={{ color: accent ?? 'rgba(200,220,245,0.8)', fontSize: 12, fontWeight: 600 }}>{value}</span>
    </div>
  )
}
