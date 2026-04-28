import { useRCWSStore } from '../../store/useRCWSStore'
import type { TimeOfDay, Weather } from '../../types'

const TIME_OPTIONS: TimeOfDay[] = ['DAY', 'DUSK', 'NIGHT']
const WEATHER_OPTIONS: Weather[] = ['CLEAR', 'OVERCAST', 'RAIN']

// Weather degrades RF effectiveness
const WEATHER_EFFECT: Record<Weather, string> = {
  CLEAR:    '+0% RF attenuation',
  OVERCAST: '+3% RF attenuation',
  RAIN:     '+12% RF attenuation',
}

export default function EnvironmentControls() {
  const { environment, setEnvironment } = useRCWSStore()

  return (
    <div style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: 12, color: '#00D4FF', letterSpacing: '0.14em', marginBottom: 10, borderBottom: '1px solid #111', paddingBottom: 6 }}>
        ENVIRONMENT
      </div>

      {/* Time of day */}
      <div style={{ marginBottom: 10 }}>
        <Label>TIME OF DAY</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          {TIME_OPTIONS.map(t => (
            <button
              key={t}
              onClick={() => setEnvironment({ timeOfDay: t })}
              style={optBtn(environment.timeOfDay === t, '#F5A623')}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Weather */}
      <div style={{ marginBottom: 10 }}>
        <Label>WEATHER</Label>
        <div style={{ display: 'flex', gap: 4 }}>
          {WEATHER_OPTIONS.map(w => (
            <button
              key={w}
              onClick={() => setEnvironment({ weather: w })}
              style={optBtn(environment.weather === w, '#00D4FF')}
            >
              {w}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 4, letterSpacing: '0.06em' }}>
          {WEATHER_EFFECT[environment.weather]}
        </div>
      </div>

      {/* Wind */}
      <div>
        <Label>WIND (m/s)</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="range"
            min={0} max={20} step={1}
            value={environment.windSpeedMs}
            onChange={e => setEnvironment({ windSpeedMs: Number(e.target.value) })}
            style={{ flex: 1, accentColor: '#F5A623' }}
          />
          <span style={{ fontSize: 13, color: '#C8C8C0', fontFamily: 'JetBrains Mono, monospace', minWidth: 28 }}>
            {environment.windSpeedMs}
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#666', marginTop: 2, letterSpacing: '0.06em' }}>
          {environment.windSpeedMs === 0 ? 'CALM'
            : environment.windSpeedMs < 5 ? 'LIGHT BREEZE'
            : environment.windSpeedMs < 10 ? 'MODERATE'
            : environment.windSpeedMs < 15 ? 'STRONG' : 'STORM CONDITIONS'}
        </div>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, color: '#666', letterSpacing: '0.1em', marginBottom: 4 }}>{children}</div>
  )
}

function optBtn(active: boolean, color: string): React.CSSProperties {
  return {
    flex: 1, padding: '5px 2px', fontSize: 13, letterSpacing: '0.08em',
    border: `1px solid ${active ? color : '#1A1A1A'}`,
    color: active ? color : '#444',
    background: active ? `${color}08` : 'transparent',
    cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
  }
}
