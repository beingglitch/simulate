import { useState, useRef } from 'react'

type Phase = 'IDLE' | 'RUNNING' | 'COMPLETE'
type SubStatus = 'PASS' | 'CHECKING' | 'ARMED' | 'NOMINAL' | 'CHARGED' | 'ENCRYPTED' | 'ACTIVE'

interface Subsystem {
  label: string
  nominal: SubStatus
}

const SUBSYSTEMS: Subsystem[] = [
  { label: 'RADAR ARRAY',   nominal: 'ACTIVE'     },
  { label: 'EMP GENERATOR', nominal: 'CHARGED'    },
  { label: 'RF JAMMER',     nominal: 'NOMINAL'    },
  { label: 'FIRE CONTROL',  nominal: 'ARMED'      },
  { label: 'COMMS',         nominal: 'ENCRYPTED'  },
]

const STATUS_COLOR: Record<string, string> = {
  PASS:      '#3dd68c',
  CHECKING:  '#f5bc4b',
  ACTIVE:    '#3dd68c',
  CHARGED:   '#3dd68c',
  NOMINAL:   '#3dd68c',
  ARMED:     '#f05252',
  ENCRYPTED: '#4da6ff',
}

export default function BITPanel() {
  const [phase, setPhase]     = useState<Phase>('IDLE')
  const [statuses, setStatuses] = useState<SubStatus[]>(SUBSYSTEMS.map(s => s.nominal))
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  function runBIT() {
    if (phase === 'RUNNING') return
    // Clear any pending timers
    timers.current.forEach(clearTimeout)
    timers.current = []

    setPhase('RUNNING')
    setStatuses(SUBSYSTEMS.map(() => 'CHECKING'))

    SUBSYSTEMS.forEach((sub, i) => {
      const t = setTimeout(() => {
        setStatuses(prev => {
          const next = [...prev] as SubStatus[]
          next[i] = sub.nominal
          return next
        })
        if (i === SUBSYSTEMS.length - 1) {
          setPhase('COMPLETE')
          const done = setTimeout(() => setPhase('IDLE'), 1000)
          timers.current.push(done)
        }
      }, (i + 1) * 300)
      timers.current.push(t)
    })
  }

  return (
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.06)',
      padding: '10px 12px 12px',
      flexShrink: 0,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span className="mono" style={{ color: 'rgba(120,150,185,0.4)', fontSize: 9, letterSpacing: '0.1em' }}>
          BUILT-IN TEST
        </span>
        {phase === 'COMPLETE' && (
          <span className="mono" style={{ color: '#3dd68c', fontSize: 9, letterSpacing: '0.08em' }}>
            ALL PASS
          </span>
        )}
        {phase === 'RUNNING' && (
          <span className="mono blink" style={{ color: '#f5bc4b', fontSize: 9 }}>
            CHECKING…
          </span>
        )}
      </div>

      {/* Subsystem rows */}
      <div style={{ marginBottom: 8 }}>
        {SUBSYSTEMS.map((sub, i) => {
          const st = statuses[i]
          const color = STATUS_COLOR[st] ?? '#4da6ff'
          return (
            <div key={sub.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3,
            }}>
              <span className="mono" style={{ color: 'rgba(140,170,205,0.55)', fontSize: 9 }}>{sub.label}</span>
              <span className={st === 'CHECKING' ? 'mono blink' : 'mono'} style={{
                color,
                fontSize: 9,
              }}>
                {st}
              </span>
            </div>
          )
        })}
      </div>

      {/* RUN BIT button */}
      <button
        onClick={runBIT}
        disabled={phase === 'RUNNING'}
        className="mono"
        style={{
          width: '100%', padding: '5px 0', fontSize: 9,
          letterSpacing: '0.12em', cursor: phase === 'RUNNING' ? 'not-allowed' : 'pointer',
          border: '1px solid rgba(77,166,255,0.3)',
          background: phase === 'RUNNING' ? 'rgba(77,166,255,0.04)' : 'rgba(77,166,255,0.08)',
          color: phase === 'RUNNING' ? 'rgba(77,166,255,0.35)' : 'rgba(77,166,255,0.7)',
          transition: 'all 0.15s',
        }}
      >
        RUN BIT
      </button>
    </div>
  )
}
