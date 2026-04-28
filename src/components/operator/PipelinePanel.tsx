// Mode-specific 6-step attack pipeline visualization
import type { WeaponMode } from '../../types'

interface StepDef { label: string; desc: string; color: string; durationMs: number }

// ── Per-mode pipeline definitions ─────────────────────────────────
const PIPELINES: Record<WeaponMode, StepDef[]> = {
  RF_JAM: [
    { label: 'SCAN',       desc: 'Full-spectrum sweep, threat ID',         color: '#00D4FF', durationMs: 350 },
    { label: 'IDENTIFY',   desc: 'Protocol fingerprint, freq mapping',     color: '#00D4FF', durationMs: 400 },
    { label: 'FREQ LOCK',  desc: 'Tune to C2 uplink frequency',           color: '#00AAFF', durationMs: 450 },
    { label: 'JAM BURST',  desc: 'Initial jamming pulse, response test',  color: '#F5A623', durationMs: 500 },
    { label: 'SATURATION', desc: 'Full-band power, saturate receiver',    color: '#F5A623', durationMs: 600 },
    { label: 'CONFIRM',    desc: 'C2 link confirmed dead, hold jam',      color: '#00FF41', durationMs: 350 },
  ],
  DIRECTED_EMP: [
    { label: 'FINGERPRINT', desc: 'RF profile analysis, protocol ID',      color: '#00D4FF', durationMs: 400 },
    { label: 'SOFT ATTACK', desc: 'Initial discharge, test susceptibility', color: '#00D4FF', durationMs: 500 },
    { label: 'FRONT DOOR',  desc: 'Direct freq injection, uplink cut',     color: '#F5A623', durationMs: 550 },
    { label: 'CUM. STRESS', desc: 'Sustained power, thermal buildup',      color: '#F5A623', durationMs: 650 },
    { label: 'RES. STRIKE', desc: 'Peak resonance, max power 450 MW',     color: '#FF2020', durationMs: 700 },
    { label: 'ASSESS',      desc: 'Damage assessment, confirm kill',       color: '#00FF41', durationMs: 350 },
  ],
  KINETIC: [
    { label: 'ACQUIRE',    desc: 'Optical + radar target acquisition',    color: '#FF6020', durationMs: 300 },
    { label: 'TRACK',      desc: 'Compute bearing, lead, velocity',       color: '#FF6020', durationMs: 400 },
    { label: 'FIRE SOLN',  desc: 'Ballistic solution calculated',         color: '#F5A623', durationMs: 400 },
    { label: 'ARM',        desc: 'Proximity fuze armed, safety off',      color: '#FF2020', durationMs: 250 },
    { label: 'FIRE',       desc: 'Round away — intercept in progress',    color: '#FF2020', durationMs: 600 },
    { label: 'ASSESS',     desc: 'Kill confirm, re-acquire if needed',    color: '#00FF41', durationMs: 300 },
  ],
}

// ── Compute total MS per mode ──────────────────────────────────────
export function getPipelineTotalMs(mode: WeaponMode): number {
  return PIPELINES[mode].reduce((s, step) => s + step.durationMs, 0)
}

export function getPipelineSteps(mode: WeaponMode) { return PIPELINES[mode] }

// ── Component ──────────────────────────────────────────────────────
interface PipelinePanelProps {
  stepIdx: number
  elapsedMs: number
  isEngaging: boolean
  mode: WeaponMode
}

export default function PipelinePanel({ stepIdx, elapsedMs, isEngaging, mode }: PipelinePanelProps) {
  const steps   = PIPELINES[mode]
  const totalMs = getPipelineTotalMs(mode)
  const idle    = !isEngaging && stepIdx < 0

  // Mode accent colors for the panel header
  const modeColor = mode === 'RF_JAM' ? '#00D4FF' : mode === 'DIRECTED_EMP' ? '#F5A623' : '#FF4010'
  const modeLabel = mode === 'RF_JAM' ? 'RF JAM' : mode === 'DIRECTED_EMP' ? 'DIR. EMP' : 'KINETIC'

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      borderTop: '1px solid #111', borderBottom: '1px solid #111',
      background: '#000', padding: '0 8px', height: '100%',
    }}>
      {/* Mode label */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 10px 0 4px', borderRight: `1px solid ${modeColor}30`, flexShrink: 0, gap: 2,
        minWidth: 54,
      }}>
        <div style={{ fontSize: 8, color: '#555', letterSpacing: '0.14em' }}>PIPELINE</div>
        <div style={{ fontSize: 10, color: modeColor, fontWeight: 700, letterSpacing: '0.1em' }}>
          {modeLabel}
        </div>
      </div>

      {/* Steps */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
        {steps.map((step, i) => {
          const done    = stepIdx > i || (!isEngaging && stepIdx === 6)
          const active  = stepIdx === i && isEngaging
          const pending = !done && !active

          const col = active ? step.color : done ? step.color + '90' : '#3A3A3A'
          const bg  = active ? step.color + '16' : done ? step.color + '0A' : 'transparent'

          // Within-step progress
          let stepProgress = 0
          if (active) {
            const offset = steps.slice(0, i).reduce((s, st) => s + st.durationMs, 0)
            stepProgress = Math.min(1, (elapsedMs - offset) / step.durationMs)
          }

          return (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
              padding: '3px 5px', borderRight: '1px solid #111',
              background: bg, position: 'relative', overflow: 'hidden',
            }}>
              {/* Progress sweep */}
              {active && (
                <div style={{
                  position: 'absolute', left: 0, bottom: 0, top: 0,
                  width: `${stepProgress * 100}%`,
                  background: `${step.color}20`,
                  borderRight: `1px solid ${step.color}60`,
                }} />
              )}

              {/* Step number */}
              <div style={{
                fontSize: 9, letterSpacing: '0.1em',
                color: active ? step.color : done ? step.color + '70' : '#3A3A3A',
                marginBottom: 1, position: 'relative',
              }}>
                {String(i + 1).padStart(2, '0')}
              </div>

              {/* Label */}
              <div style={{
                fontSize: 9, fontWeight: active ? 700 : 400,
                color: col, letterSpacing: '0.06em', lineHeight: 1.2,
                animation: active ? 'hostile-pulse 0.5s ease-in-out infinite' : 'none',
                position: 'relative',
              }}>
                {step.label}
              </div>

              {/* Done check / pending dash */}
              <div style={{ fontSize: 9, color: done ? step.color + '80' : '#333', marginTop: 1, position: 'relative' }}>
                {done ? '✓' : pending ? '—' : ''}
              </div>

              {/* Idle hint on first step */}
              {idle && i === 0 && (
                <div style={{ fontSize: 8, color: '#333', marginTop: 1, letterSpacing: '0.06em', position: 'relative' }}>
                  LOCK TGT
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Timer */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 8px', flexShrink: 0, borderLeft: '1px solid #111', minWidth: 48,
      }}>
        {isEngaging ? (
          <>
            <div style={{ fontSize: 8, color: '#555', letterSpacing: '0.08em' }}>ELAPSED</div>
            <div style={{ fontSize: 13, color: modeColor, fontWeight: 700 }}>
              {(elapsedMs / 1000).toFixed(1)}s
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 8, color: '#333', letterSpacing: '0.08em' }}>TTK</div>
            <div style={{ fontSize: 12, color: '#555' }}>{(totalMs / 1000).toFixed(1)}s</div>
          </>
        )}
      </div>
    </div>
  )
}
