// SVG threat icons — distinct visual shape per threat type
import type { ThreatType } from '../../types'

interface IconProps { size?: number; color?: string }

// FPV Drone — quadcopter top-down view
function FPVIcon({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Center body */}
      <rect x="8" y="8" width="4" height="4" rx="0.5" fill={color} />
      {/* Arms — diagonal */}
      <line x1="10" y1="10" x2="3.5" y2="3.5" stroke={color} strokeWidth="1.2" />
      <line x1="10" y1="10" x2="16.5" y2="3.5" stroke={color} strokeWidth="1.2" />
      <line x1="10" y1="10" x2="3.5" y2="16.5" stroke={color} strokeWidth="1.2" />
      <line x1="10" y1="10" x2="16.5" y2="16.5" stroke={color} strokeWidth="1.2" />
      {/* Rotors */}
      <circle cx="3.5" cy="3.5" r="2.5" stroke={color} strokeWidth="1" fill="none" />
      <circle cx="16.5" cy="3.5" r="2.5" stroke={color} strokeWidth="1" fill="none" />
      <circle cx="3.5" cy="16.5" r="2.5" stroke={color} strokeWidth="1" fill="none" />
      <circle cx="16.5" cy="16.5" r="2.5" stroke={color} strokeWidth="1" fill="none" />
      {/* Rotor centre dots */}
      <circle cx="3.5" cy="3.5" r="0.8" fill={color} />
      <circle cx="16.5" cy="3.5" r="0.8" fill={color} />
      <circle cx="3.5" cy="16.5" r="0.8" fill={color} />
      <circle cx="16.5" cy="16.5" r="0.8" fill={color} />
      {/* Camera / nose dot */}
      <circle cx="10" cy="10" r="1" fill="none" stroke={color} strokeWidth="0.8" />
    </svg>
  )
}

// RF-IED — bomb with antenna / radio waves
function RFIEDIcon({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Body (round bomb) */}
      <circle cx="10" cy="12" r="5.5" stroke={color} strokeWidth="1.4" fill="none" />
      {/* Fuse */}
      <path d="M10 6.5 C11.5 4.5 9 2.5 10.5 1" stroke={color} strokeWidth="1.2" strokeLinecap="round" fill="none" />
      {/* Radio waves left */}
      <path d="M3 8.5 Q1.5 10 3 11.5" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
      <path d="M4.5 7 Q2 9.5 4.5 12" stroke={color} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6" />
      {/* Radio waves right */}
      <path d="M17 8.5 Q18.5 10 17 11.5" stroke={color} strokeWidth="1" strokeLinecap="round" fill="none" />
      <path d="M15.5 7 Q18 9.5 15.5 12" stroke={color} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6" />
      {/* Circuit cross inside body */}
      <line x1="10" y1="8.5" x2="10" y2="15.5" stroke={color} strokeWidth="0.7" opacity="0.5" />
      <line x1="6.5" y1="12" x2="13.5" y2="12" stroke={color} strokeWidth="0.7" opacity="0.5" />
    </svg>
  )
}

// Unknown — question mark with signal rings
function UnknownIcon({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer ring */}
      <circle cx="10" cy="10" r="8.5" stroke={color} strokeWidth="1" opacity="0.4" strokeDasharray="2 2" />
      {/* Inner circle */}
      <circle cx="10" cy="10" r="5" stroke={color} strokeWidth="1.2" fill="none" />
      {/* Question mark */}
      <path d="M8 7.5 Q8 6 10 6 Q12 6 12 7.8 Q12 9 10 9.8 L10 11" stroke={color} strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <circle cx="10" cy="13" r="0.7" fill={color} />
    </svg>
  )
}

// Enemy RCWS — tracked vehicle with turret + barrel (top-down)
function EnemyRCWSIcon({ size = 20, color = 'currentColor' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hull outline */}
      <rect x="3" y="5" width="14" height="10" rx="1" stroke={color} strokeWidth="1.3" fill="none" />
      {/* Turret (circle) */}
      <circle cx="10" cy="10" r="3.2" stroke={color} strokeWidth="1.2" fill="none" />
      {/* Barrel pointing right (12 o'clock = forward) */}
      <line x1="10" y1="10" x2="10" y2="1.5" stroke={color} strokeWidth="1.6" strokeLinecap="square" />
      {/* Track on left */}
      <rect x="1" y="5.5" width="2" height="9" rx="0.5" stroke={color} strokeWidth="0.8" fill="none" />
      {/* Track on right */}
      <rect x="17" y="5.5" width="2" height="9" rx="0.5" stroke={color} strokeWidth="0.8" fill="none" />
      {/* Targeting cross inside turret */}
      <line x1="10" y1="7.5" x2="10" y2="8.5" stroke={color} strokeWidth="0.6" />
      <line x1="10" y1="11.5" x2="10" y2="12.5" stroke={color} strokeWidth="0.6" />
      <line x1="7.5" y1="10" x2="8.5" y2="10" stroke={color} strokeWidth="0.6" />
      <line x1="11.5" y1="10" x2="12.5" y2="10" stroke={color} strokeWidth="0.6" />
    </svg>
  )
}

// ── Export ────────────────────────────────────────────────────────
export default function ThreatIcon({
  type, size = 20, color = 'currentColor',
}: { type: ThreatType; size?: number; color?: string }) {
  switch (type) {
    case 'FPV_DRONE':  return <FPVIcon size={size} color={color} />
    case 'RF_IED':     return <RFIEDIcon size={size} color={color} />
    case 'ENEMY_RCWS': return <EnemyRCWSIcon size={size} color={color} />
    case 'UNKNOWN':    return <UnknownIcon size={size} color={color} />
    default:           return <UnknownIcon size={size} color={color} />
  }
}
