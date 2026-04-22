import { useEffect, useState } from 'react'
import type { SimState } from '../types'

interface Props { state: SimState }

export default function TopBar({ state }: Props) {
  const [clock, setClock] = useState('')
  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z')
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const activeThreats = state.threats.filter(t => t.status === 'APPROACHING').length

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
          COUNTER-UAS / EW SIMULATOR
        </span>
      </div>

      {/* Metrics */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Metric label="TRACKS" value={String(state.threats.length)} />
        <Metric label="HOSTILE" value={String(activeThreats)} accent={activeThreats > 0 ? '#f05252' : '#3dd68c'} />
        <Metric label="MODE" value={state.turret.mode.replace(/_/g, ' ')} accent="#4da6ff" />
        <Metric label="AZ" value={`${state.turret.azimuth.toFixed(0)}°`} />
        <Metric label="EL" value={`${state.turret.elevation.toFixed(0)}°`} />
      </div>

      {/* Clock + status */}
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
