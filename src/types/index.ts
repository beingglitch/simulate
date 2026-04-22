export type ThreatType = 'FPV_DRONE' | 'RF_IED' | 'ENEMY_RCWS'
export type ThreatStatus = 'APPROACHING' | 'ENGAGED' | 'DESTROYED' | 'DISRUPTED' | 'ESCAPED'
export type WeaponMode = 'RF_JAM' | 'DIRECTED_EMP' | 'KINETIC'
export type PipelineStep =
  | 'FINGERPRINT'
  | 'SOFT_ATTACK'
  | 'FRONT_DOOR'
  | 'CUMULATIVE_STRESS'
  | 'RESONANCE_STRIKE'
  | 'ASSESS'

export interface Threat {
  id: string
  type: ThreatType
  x: number       // canvas coords
  y: number
  bearing: number // degrees from north
  range: number   // meters
  speed: number   // m/s
  status: ThreatStatus
  rfFingerprint: string
  priority: number
}

export interface TurretState {
  azimuth: number    // 0–360
  elevation: number  // -10–45
  mode: WeaponMode
}

export interface SimState {
  threats: Threat[]
  turret: TurretState
  selectedThreatId: string | null
  engagementApproved: boolean
  pipelineActive: boolean
  pipelineStep: PipelineStep | null
  pipelineProgress: number  // 0–100
  empFired: boolean
  systemTime: number  // ms since start
}
