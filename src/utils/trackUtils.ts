import type { Track, ThreatType, RFProfile, PresetName, Priority, FlightPath, MissionType } from '../types'

export const RCWS_LAT = 25.4358
export const RCWS_LNG = 81.8463
export const ENGAGEMENT_RANGE_M = 1000

// ─── Position maths ───────────────────────────────────────────────
export function bearingToLatLng(
  originLat: number, originLng: number,
  bearingDeg: number, distM: number,
): { lat: number; lng: number } {
  const R = 6371000
  const δ = distM / R
  const θ = (bearingDeg * Math.PI) / 180
  const φ1 = (originLat * Math.PI) / 180
  const λ1 = (originLng * Math.PI) / 180
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ),
  )
  const λ2 = λ1 + Math.atan2(
    Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
    Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2),
  )
  return { lat: (φ2 * 180) / Math.PI, lng: ((λ2 * 180) / Math.PI) }
}

export function latLngDistanceM(
  lat1: number, lng1: number, lat2: number, lng2: number,
): number {
  const R = 6371000
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180
  const dφ = φ2 - φ1, dλ = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function bearingBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180
  const dλ = ((lng2 - lng1) * Math.PI) / 180
  const y = Math.sin(dλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dλ)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

// ─── RF Profiles ─────────────────────────────────────────────────
const RF_PROFILES: Record<ThreatType, RFProfile> = {
  FPV_DRONE: {
    freqGHz: 5.8,
    protocol: 'DJI OcuSync 2.0',
    vulnerability: 'HIGH',
    peaks: [
      { freqGHz: 2.412, label: 'CTRL LINK',   dbm: -58 },
      { freqGHz: 5.8,   label: 'VIDEO TX',    dbm: -42 },
      { freqGHz: 1.575, label: 'GPS L1',      dbm: -130 },
    ],
    recPulseWidthNs: 20,
    recPrfHz: 500,
  },
  RF_IED: {
    freqGHz: 0.433,
    protocol: 'LoRa 915MHz · Unencrypted',
    vulnerability: 'CRITICAL',
    peaks: [
      { freqGHz: 0.433, label: 'PAYLOAD TRIG', dbm: -35 },
      { freqGHz: 0.915, label: 'CTRL LINK',    dbm: -48 },
    ],
    recPulseWidthNs: 50,
    recPrfHz: 200,
  },
  ENEMY_RCWS: {
    freqGHz: 1.3,
    protocol: 'Military Datalink · Hardened',
    vulnerability: 'LOW',
    peaks: [
      { freqGHz: 1.3,   label: 'RADAR EMIT',  dbm: -38 },
      { freqGHz: 4.9,   label: 'DATALINK',    dbm: -55 },
      { freqGHz: 0.900, label: 'COMMS',       dbm: -62 },
    ],
    recPulseWidthNs: 15,
    recPrfHz: 600,
  },
  UNKNOWN: {
    freqGHz: 2.4,
    protocol: 'UNCLASSIFIED',
    vulnerability: 'MEDIUM',
    peaks: [
      { freqGHz: 2.4,   label: 'SIG A',  dbm: -60 },
      { freqGHz: 5.2,   label: 'SIG B',  dbm: -72 },
    ],
    recPulseWidthNs: 30,
    recPrfHz: 300,
  },
}

const SPEEDS: Record<ThreatType, [number, number]> = {
  FPV_DRONE:  [12, 22],
  RF_IED:     [4,  8],
  ENEMY_RCWS: [0,  2],
  UNKNOWN:    [6, 16],
}
const ALTITUDES: Record<ThreatType, [number, number]> = {
  FPV_DRONE:  [40, 150],
  RF_IED:     [20, 60],
  ENEMY_RCWS: [5,  25],
  UNKNOWN:    [30, 120],
}
const SPAWN_DIST: Record<ThreatType, [number, number]> = {
  FPV_DRONE:  [1500, 2500],
  RF_IED:     [800,  1500],
  ENEMY_RCWS: [800,  2000],
  UNKNOWN:    [1000, 2000],
}
const FLIGHT_PATH: Record<ThreatType, FlightPath> = {
  FPV_DRONE:  'DIRECT',
  RF_IED:     'DIRECT',
  ENEMY_RCWS: 'PATROL',
  UNKNOWN:    'ERRATIC',
}
const MISSION: Record<ThreatType, MissionType> = {
  FPV_DRONE:  'STRIKE',
  RF_IED:     'IED_DELIVERY',
  ENEMY_RCWS: 'ESCORT',
  UNKNOWN:    'RECON',
}

function rand(min: number, max: number) { return min + Math.random() * (max - min) }

let _counter = 0
export function resetIdCounter() { _counter = 0 }
export function nextTrackId()    { return `T${String(++_counter).padStart(3, '0')}` }

// ─── Priority score calculation ───────────────────────────────────
const THREAT_WEIGHT: Record<ThreatType, number> = {
  RF_IED:     3,
  ENEMY_RCWS: 2.5,
  FPV_DRONE:  2,
  UNKNOWN:    1,
}

export function calcPriorityScore(track: Partial<Track> & { type: ThreatType; distance: number; speed: number }): number {
  const tw   = THREAT_WEIGHT[track.type] ?? 1
  const tte  = track.distance / (track.speed || 1)
  const rng  = track.inRangeWindow ?? 30
  return Math.round(
    tw * 40
    + (1 / Math.max(tte, 1)) * 30 * 100
    + (1 / Math.max(rng, 1)) * 20 * 100
    + (1 / Math.max(track.distance, 1)) * 10 * 10000,
  )
}

// ─── Trajectory intersection with range ring ──────────────────────
export function calcRangeIntersection(
  trackLat: number, trackLng: number,
  objLat: number, objLng: number,
  speed: number,
): { entersRangeIn: number | null; inRangeWindow: number; outOfRange: boolean } {
  const steps = 200
  let entryTime: number | null = null
  let exitTime: number | null = null
  const totalDist = latLngDistanceM(trackLat, trackLng, objLat, objLng)
  if (totalDist < 1) return { entersRangeIn: null, inRangeWindow: 0, outOfRange: true }

  for (let i = 0; i <= steps; i++) {
    const frac = i / steps
    const lat  = trackLat + (objLat - trackLat) * frac
    const lng  = trackLng + (objLng - trackLng) * frac
    const d    = latLngDistanceM(RCWS_LAT, RCWS_LNG, lat, lng)
    const t    = (frac * totalDist) / speed

    if (entryTime === null && d <= ENGAGEMENT_RANGE_M) entryTime = t
    if (entryTime !== null && d > ENGAGEMENT_RANGE_M && exitTime === null) { exitTime = t; break }
  }

  if (entryTime === null) return { entersRangeIn: null, inRangeWindow: 0, outOfRange: true }
  const window = exitTime !== null ? exitTime - entryTime : (totalDist / speed) - entryTime
  return { entersRangeIn: entryTime, inRangeWindow: Math.max(0, window), outOfRange: false }
}

// ─── Build a full track with all movement fields ──────────────────
export function buildTrack(
  id: string,
  type: ThreatType,
  bearing: number,
  distance?: number,
  speed?: number,
  altitude?: number,
  priority: Priority = 1,
  objective?: { lat: number; lng: number },
): Track {
  const [sMin, sMax] = SPEEDS[type]
  const [aMin, aMax] = ALTITUDES[type]
  const [dMin, dMax] = SPAWN_DIST[type]

  const spd  = speed    ?? rand(sMin, sMax)
  const alt  = altitude ?? rand(aMin, aMax)
  const dist = distance ?? rand(dMin, dMax)
  const brg  = bearing

  const pos = bearingToLatLng(RCWS_LAT, RCWS_LNG, brg, dist)

  // Default objective: a random point NOT the RCWS, ~2-4km from spawn
  const objOffset = objective ?? (() => {
    const objBrg = (brg + rand(-60, 60)) % 360
    const objDist = dist + rand(800, 2500)
    return bearingToLatLng(pos.lat, pos.lng, objBrg, objDist)
  })()

  const { entersRangeIn, inRangeWindow, outOfRange } = calcRangeIntersection(
    pos.lat, pos.lng, objOffset.lat, objOffset.lng, spd,
  )

  const partial = { type, speed: spd, distance: dist }
  const score = calcPriorityScore({ ...partial, inRangeWindow: inRangeWindow ?? 30 })

  return {
    id, type, bearing: brg, distance: dist, priority,
    speed: spd,
    altitude: alt,
    status: 'TRACKING',
    rfProfile: { ...RF_PROFILES[type] },
    ...pos,
    objective: objOffset,
    flightPath: FLIGHT_PATH[type],
    waypoints: [],
    missionType: MISSION[type],
    awardsRCWS: type === 'ENEMY_RCWS',
    inRangeWindowStart: null,
    timeToObjective: latLngDistanceM(pos.lat, pos.lng, objOffset.lat, objOffset.lng) / spd,
    contactStatus: 'APPROACHING',
    priorityScore: score,
    driftAngle: rand(-0.05, 0.05),
    patrolAngle: rand(0, Math.PI * 2),
    erraticTimer: rand(3, 8),
    erraticBearing: brg,
    preSelected: false,
    entersRangeIn,
    inRangeWindow,
    outOfRange,
  }
}

// ─── Engagement params derived from RF profile ───────────────────
export function getEngagementParams(track: Track) {
  const p = track.rfProfile
  return {
    peakPowerMW:   450,
    pulseWidthNs:  p.recPulseWidthNs,
    prfHz:         p.recPrfHz,
    killProbPct:   p.vulnerability === 'CRITICAL' ? 99
                 : p.vulnerability === 'HIGH'     ? 94
                 : p.vulnerability === 'MEDIUM'   ? 82 : 65,
    beamWidthDeg:  3.2,
    timeToEffectS: 0.3,
  }
}

// ─── Scenario presets ─────────────────────────────────────────────
type PresetDef = {
  tracks: Array<{
    type: ThreatType; bearing: number; distance: number; speed?: number
    altitude?: number; priority: Priority
    objective?: { lat: number; lng: number }
  }>
}

export const PRESETS: Record<PresetName, PresetDef> = {
  SINGLE_FPV: {
    tracks: [
      {
        type: 'FPV_DRONE', bearing: 45, distance: 1200, speed: 16, altitude: 80, priority: 1,
        objective: bearingToLatLng(RCWS_LAT + 0.008, RCWS_LNG + 0.006, 45, 1200),
      },
    ],
  },
  RF_IED_URBAN: {
    tracks: [
      {
        type: 'RF_IED', bearing: 128, distance: 900, speed: 6, altitude: 30, priority: 1,
        objective: bearingToLatLng(RCWS_LAT + 0.004, RCWS_LNG + 0.005, 128, 400),
      },
      {
        type: 'RF_IED', bearing: 195, distance: 1400, speed: 5, altitude: 25, priority: 2,
        objective: bearingToLatLng(RCWS_LAT - 0.006, RCWS_LNG - 0.003, 195, 600),
      },
    ],
  },
  MULTI_CONTACT_INTERCEPT: {
    tracks: [
      { type: 'FPV_DRONE',  bearing: 22,  distance: 1800, speed: 18, priority: 1 },
      { type: 'FPV_DRONE',  bearing: 67,  distance: 2100, speed: 15, priority: 1 },
      { type: 'RF_IED',     bearing: 110, distance: 1200, speed: 6,  priority: 1 },
      { type: 'FPV_DRONE',  bearing: 155, distance: 1600, speed: 20, priority: 2 },
      { type: 'UNKNOWN',    bearing: 200, distance: 1900, speed: 10, priority: 3 },
      { type: 'RF_IED',     bearing: 245, distance: 1400, speed: 7,  priority: 1 },
      { type: 'UNKNOWN',    bearing: 290, distance: 2200, speed: 12, priority: 3 },
      { type: 'ENEMY_RCWS', bearing: 335, distance: 1800, speed: 0,  priority: 2 },
    ],
  },
  COUNTER_BATTERY: {
    tracks: [
      { type: 'ENEMY_RCWS', bearing: 310, distance: 1800, speed: 1,  altitude: 10, priority: 1 },
      { type: 'FPV_DRONE',  bearing: 300, distance: 1200, speed: 18, altitude: 80, priority: 1 },
      { type: 'FPV_DRONE',  bearing: 315, distance: 1500, speed: 16, altitude: 70, priority: 1 },
      { type: 'FPV_DRONE',  bearing: 325, distance: 1800, speed: 14, altitude: 60, priority: 2 },
    ],
  },
  TIME_CRITICAL: {
    tracks: [
      { type: 'FPV_DRONE', bearing: 30,  distance: 1050, speed: 22, priority: 1 },
      { type: 'FPV_DRONE', bearing: 75,  distance: 980,  speed: 20, priority: 1 },
      { type: 'RF_IED',    bearing: 130, distance: 850,  speed: 8,  priority: 1 },
      { type: 'FPV_DRONE', bearing: 185, distance: 1100, speed: 19, priority: 2 },
      { type: 'RF_IED',    bearing: 240, distance: 920,  speed: 7,  priority: 1 },
      { type: 'UNKNOWN',   bearing: 295, distance: 1020, speed: 14, priority: 3 },
    ],
  },
}
