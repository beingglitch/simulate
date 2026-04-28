import { useRCWSStore } from '../../store/useRCWSStore'
import type { PresetName } from '../../types'

const PRESETS: { id: PresetName; label: string; desc: string; color: string }[] = [
  {
    id:    'SINGLE_FPV',
    label: 'SINGLE FPV',
    desc:  '1× FPV drone, BRG 045°, 1200m — path crosses range ring, 45s window',
    color: '#FF2020',
  },
  {
    id:    'RF_IED_URBAN',
    label: 'RF-IED URBAN',
    desc:  '2× RF-IED — Contact A has 60s window, Contact B clips ring with only 12s — pre-select required',
    color: '#F5A623',
  },
  {
    id:    'MULTI_CONTACT_INTERCEPT',
    label: 'MULTI-CONTACT INTERCEPT',
    desc:  '8 mixed contacts — only 5 cross the 1km ring — discriminate & engage correctly',
    color: '#FF2020',
  },
  {
    id:    'COUNTER_BATTERY',
    label: 'COUNTER-BATTERY',
    desc:  '1× ENEMY RCWS at 1800m + 3× FPV escorts — engage escorts, then switch to KINETIC for RCWS',
    color: '#CC00FF',
  },
  {
    id:    'TIME_CRITICAL',
    label: 'TIME CRITICAL',
    desc:  '6 contacts entering range within 15s — short windows, pre-select required — tests queue management',
    color: '#F5A623',
  },
]

export default function ScenarioPresets() {
  const { loadPreset } = useRCWSStore()

  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: 12, color: '#00D4FF', letterSpacing: '0.14em', marginBottom: 10, borderBottom: '1px solid #111', paddingBottom: 6 }}>
        SCENARIO PRESETS
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => loadPreset(p.id)}
            style={{
              padding: '10px 12px', textAlign: 'left', cursor: 'pointer',
              border: `1px solid ${p.color}40`,
              background: `${p.color}06`,
              fontFamily: 'JetBrains Mono, monospace',
              transition: 'all 0.1s',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: p.color, letterSpacing: '0.1em', marginBottom: 3 }}>
              {p.label}
            </div>
            <div style={{ fontSize: 13, color: '#777', letterSpacing: '0.06em', lineHeight: 1.5 }}>
              {p.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
