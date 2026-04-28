// ─── Enums ────────────────────────────────────────────────────────
export type ThreatType    = 'FPV_DRONE' | 'RF_IED' | 'ENEMY_RCWS' | 'UNKNOWN'
export type FlightPath    = 'DIRECT' | 'WAYPOINT' | 'PATROL' | 'ERRATIC'
export type MissionType   = 'STRIKE' | 'RECON' | 'IED_DELIVERY' | 'ESCORT'
export type ContactStatus = 'APPROACHING' | 'IN_RANGE' | 'ESCAPED' | 'NEUTRALISED' | 'OBJECTIVE_REACHED'
export type TrackStatus   = 'TRACKING' | 'LOCKED' | 'NEUTRALISED' | 'ESCAPED'
export type PipelineStep  = 'FINGERPRINT' | 'SOFT_ATTACK' | 'FRONT_DOOR' | 'CUMULATIVE_STRESS' | 'RESONANCE_STRIKE' | 'ASSESS'
export const PIPELINE_STEPS: PipelineStep[] = [
  'FINGERPRINT', 'SOFT_ATTACK', 'FRONT_DOOR', 'CUMULATIVE_STRESS', 'RESONANCE_STRIKE', 'ASSESS',
]
export type WeaponMode   = 'RF_JAM' | 'DIRECTED_EMP' | 'KINETIC'
export type SystemStatus = 'STANDBY' | 'ACTIVE' | 'ENGAGING'
export type Priority     = 1 | 2 | 3
export type TimeOfDay    = 'DAY' | 'DUSK' | 'NIGHT'
export type Weather      = 'CLEAR' | 'OVERCAST' | 'RAIN'
export type LogLevel     = 'INFO' | 'HOSTILE' | 'SYSTEM' | 'KILL'
export type PresetName   = 'SINGLE_FPV' | 'RF_IED_URBAN' | 'MULTI_CONTACT_INTERCEPT' | 'COUNTER_BATTERY' | 'TIME_CRITICAL'
export type ActiveView   = 'RADAR' | 'MAP' | '3D'
export type AlertType    = 'ESCAPED' | 'THREAT_REALIZED' | 'ENEMY_FIRING' | 'ENTERING_RANGE'

// ─── RF / Signal ──────────────────────────────────────────────────
export interface RFPeak {
  freqGHz: number
  label: string
  dbm: number
}

export interface RFProfile {
  freqGHz: number
  protocol: string
  vulnerability: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  peaks: RFPeak[]
  recPulseWidthNs: number
  recPrfHz: number
}

// ─── Track ────────────────────────────────────────────────────────
export interface Track {
  id: string
  type: ThreatType
  bearing: number
  speed: number
  altitude: number
  distance: number
  priority: Priority
  status: TrackStatus
  rfProfile: RFProfile
  lat: number
  lng: number
  // Movement
  objective: { lat: number; lng: number }
  flightPath: FlightPath
  waypoints: { lat: number; lng: number }[]
  missionType: MissionType
  awardsRCWS: boolean
  inRangeWindowStart: number | null
  timeToObjective: number
  contactStatus: ContactStatus
  priorityScore: number
  driftAngle: number
  patrolAngle: number
  erraticTimer: number
  erraticBearing: number
  preSelected: boolean
  entersRangeIn: number | null
  inRangeWindow: number | null
  outOfRange: boolean
}

// ─── Alert ────────────────────────────────────────────────────────
export interface Alert {
  id: string
  type: AlertType
  trackId: string
  message: string
  subMessage: string
  timestamp: number
  dismissed: boolean
  autoDismiss: boolean
  autoDismissMs: number
}

// ─── Engagement ───────────────────────────────────────────────────
export interface EngagementParams {
  peakPowerMW: number
  pulseWidthNs: number
  prfHz: number
  killProbPct: number
  beamWidthDeg: number
  timeToEffectS: number
}

// ─── Log ──────────────────────────────────────────────────────────
export interface LogEntry {
  id: string
  utc: string
  message: string
  level: LogLevel
}

// ─── Environment ──────────────────────────────────────────────────
export interface Environment {
  timeOfDay: TimeOfDay
  weather: Weather
  windSpeedMs: number
}

// ─── Multi-contact inject config ──────────────────────────────────
export interface MultiContactConfig {
  count: number
  centreBearing: number
  bearingSpread: number
  distanceMin: number
  distanceMax: number
}

// ─── Store ────────────────────────────────────────────────────────
export interface RCWSState {
  tracks: Track[]
  selectedTrackId: string | null
  preSelectedContactId: string | null
  mode: WeaponMode
  azimuth: number
  elevation: number
  systemStatus: SystemStatus
  neutralisedCount: number
  engagementLog: LogEntry[]
  isEngaging: boolean
  engagementTargetId: string | null
  simulationSpeed: number
  isPaused: boolean
  environment: Environment
  zonesVisible: boolean
  autoSpawnEnabled: boolean
  engagementQueue: string[]
  alerts: Alert[]
  activeView: ActiveView
  radarSweepAngle: number
}

export interface RCWSActions {
  injectTrack: (partial: Omit<Track, 'id'>) => void
  injectMultiContact: (cfg: MultiContactConfig) => void
  selectTrack: (id: string | null) => void
  lockTarget: (id: string) => void
  initiateEngagement: () => void
  abortEngagement: () => void
  completeEngagement: () => void
  setMode: (m: WeaponMode) => void
  setAzimuth: (az: number) => void
  setElevation: (el: number) => void
  setSimSpeed: (s: number) => void
  setPaused: (p: boolean) => void
  setEnvironment: (e: Partial<Environment>) => void
  toggleZones: () => void
  setAutoSpawn: (v: boolean) => void
  lockAll: () => void
  setEngagementQueue: (ids: string[]) => void
  tickTracks: (dt: number) => void
  addLog: (msg: string, level: LogLevel) => void
  loadPreset: (name: PresetName) => void
  resetScenario: () => void
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'dismissed'>) => void
  dismissAlert: (id: string) => void
  setPreSelected: (id: string | null) => void
  setActiveView: (v: ActiveView) => void
}

export type RCWSStore = RCWSState & RCWSActions
