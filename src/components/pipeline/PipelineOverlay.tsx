import { useEffect, useRef, useState } from 'react'
import type { SimState } from '../../types'

const STEPS = [
  { key: 'FINGERPRINT',       short: 'FP',  label: 'FINGERPRINT',       desc: 'Analysing RF signature',    color: '#4da6ff' },
  { key: 'SOFT_ATTACK',       short: 'SA',  label: 'SOFT ATTACK',       desc: 'Injecting noise floor',     color: '#00d4ff' },
  { key: 'FRONT_DOOR',        short: 'FD',  label: 'FRONT DOOR',        desc: 'Exploiting RF receiver',    color: '#f5bc4b' },
  { key: 'CUMULATIVE_STRESS', short: 'CS',  label: 'CUMULATIVE STRESS', desc: 'Building EM stress field',  color: '#f59e0b' },
  { key: 'RESONANCE_STRIKE',  short: 'RS',  label: 'RESONANCE STRIKE',  desc: 'Firing directed EMP pulse', color: '#f05252' },
  { key: 'ASSESS',            short: 'AS',  label: 'ASSESS',            desc: 'Evaluating target status',  color: '#3dd68c' },
] as const

interface Props { state: SimState }

export default function PipelineOverlay({ state }: Props) {
  const [elapsed, setElapsed] = useState(0)
  const startRef    = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (state.pipelineActive) {
      if (startRef.current === null) {
        startRef.current = Date.now()
        setElapsed(0)
      }
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - (startRef.current ?? Date.now())) / 100) / 10)
      }, 100)
    } else {
      startRef.current = null
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [state.pipelineActive])

  if (!state.pipelineActive) return null

  const stepIdx = STEPS.findIndex(s => s.key === state.pipelineStep)
  const current  = STEPS[Math.max(0, stepIdx)]
  const progress = state.pipelineProgress

  return (
    <div style={{
      position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(8,15,26,0.97)',
      border: `1px solid ${current.color}40`,
      minWidth: 370, zIndex: 1000, backdropFilter: 'blur(6px)',
    }}>
      {/* Header */}
      <div style={{
        padding: '7px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div className="blink" style={{
          width: 6, height: 6, borderRadius: '50%',
          background: current.color, flexShrink: 0,
        }} />
        <span className="mono" style={{
          color: current.color, fontSize: 10,
          letterSpacing: '0.12em', fontWeight: 700,
        }}>ATTACK PIPELINE</span>
        <span className="mono" style={{
          color: 'rgba(140,170,210,0.45)', fontSize: 10, marginLeft: 'auto',
        }}>{state.selectedThreatId}</span>
        <span className="mono" style={{ color: 'rgba(140,170,210,0.3)', fontSize: 9 }}>
          {elapsed.toFixed(1)}s
        </span>
      </div>

      {/* Step indicator row */}
      <div style={{ padding: '10px 14px 6px', display: 'flex', gap: 4 }}>
        {STEPS.map((s, i) => {
          const done    = i < stepIdx
          const active  = i === stepIdx
          const color   = done ? '#3dd68c' : active ? s.color : 'rgba(255,255,255,0.1)'
          return (
            <div key={s.key} style={{ flex: 1 }}>
              <div style={{
                height: 24,
                border: `1px solid ${color}`,
                background: active ? `${s.color}18` : done ? 'rgba(61,214,140,0.06)' : 'transparent',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
              }}>
                <span className="mono" style={{
                  fontSize: 8, letterSpacing: '0.05em',
                  color: done ? '#3dd68c' : active ? s.color : 'rgba(255,255,255,0.2)',
                  fontWeight: active ? 700 : 400,
                }}>{done ? '✓' : s.short}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 14px', marginBottom: 8 }}>
        <div style={{
          height: 2, background: 'rgba(255,255,255,0.06)', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(to right, #3dd68c, ${current.color})`,
            transition: 'width 0.4s ease-out',
          }} />
        </div>
      </div>

      {/* Current step detail */}
      <div style={{
        padding: '7px 14px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span className="mono" style={{
          color: current.color, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
        }}>{current.label}</span>
        <span className="mono" style={{ color: 'rgba(140,170,210,0.5)', fontSize: 9 }}>
          {current.desc}
        </span>
        <span className="mono" style={{
          color: 'rgba(140,170,210,0.25)', fontSize: 9, marginLeft: 'auto',
        }}>{progress}%</span>
      </div>
    </div>
  )
}
