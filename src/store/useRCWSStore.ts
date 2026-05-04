import { create } from 'zustand'
import type {
  RCWSStore, Track, LogEntry, LogLevel, WeaponMode,
  PresetName, Environment, Alert, MultiContactConfig, ThreatType, ActiveView,
} from '../types'
import {
  buildTrack, nextTrackId, resetIdCounter, PRESETS,
  bearingToLatLng, latLngDistanceM, bearingBetween, calcPriorityScore, calcRangeIntersection,
  RCWS_LAT, RCWS_LNG, ENGAGEMENT_RANGE_M,
} from '../utils/trackUtils'

const CHANNEL = 'rcws-sim-broadcast'
let bc: BroadcastChannel | null = null
try { bc = new BroadcastChannel(CHANNEL) } catch { /* SSR/unsupported */ }

const SYNC_KEYS: Array<keyof RCWSStore> = [
  'tracks', 'selectedTrackId', 'mode', 'azimuth', 'elevation',
  'systemStatus', 'neutralisedCount', 'engagementLog', 'isEngaging',
  'engagementTargetId', 'simulationSpeed', 'isPaused', 'environment',
  'zonesVisible', 'autoSpawnEnabled', 'engagementQueue', 'alerts',
  'activeView', 'radarSweepAngle', 'preSelectedContactId',
]

function utcStamp(): string {
  return new Date().toISOString().slice(11, 19) + 'Z'
}

function initialState() {
  resetIdCounter()
  return {
    tracks:              [] as Track[],
    selectedTrackId:     null as string | null,
    preSelectedContactId: null as string | null,
    mode:                'DIRECTED_EMP' as WeaponMode,
    azimuth:             0,
    elevation:           15,
    systemStatus:        'STANDBY' as const,
    neutralisedCount:    0,
    engagementLog:       [
      { id: 'boot-0', utc: utcStamp(), message: 'EMP-RCWS UNIT-01 ONLINE — SYSTEM NOMINAL', level: 'SYSTEM' },
      { id: 'boot-1', utc: utcStamp(), message: 'RADAR ARRAY ACTIVE — SCANNING 360°',       level: 'SYSTEM' },
    ] as LogEntry[],
    isEngaging:          false,
    engagementTargetId:  null as string | null,
    simulationSpeed:     1,
    isPaused:            false,
    environment:         { timeOfDay: 'DAY', weather: 'CLEAR', windSpeedMs: 0 } as Environment,
    zonesVisible:        true,
    autoSpawnEnabled:    false,
    engagementQueue:     [] as string[],
    alerts:              [] as Alert[],
    activeView:          'MAP' as ActiveView,
    radarSweepAngle:     0,
  }
}

const THREAT_TYPES_SPAWN: ThreatType[] = ['FPV_DRONE', 'RF_IED', 'ENEMY_RCWS', 'UNKNOWN']

export const useRCWSStore = create<RCWSStore>((set, get) => {
  const log = (message: string, level: LogLevel) => {
    const entry: LogEntry = { id: Date.now().toString() + Math.random(), utc: utcStamp(), message, level }
    set(s => ({ engagementLog: [...s.engagementLog.slice(-199), entry] }))
  }

  const broadcast = () => {
    if (!bc) return
    const s = get()
    const payload: Partial<RCWSStore> = {}
    SYNC_KEYS.forEach(k => { (payload as Record<string, unknown>)[k] = s[k] })
    try { bc.postMessage(payload) } catch { /* quota */ }
  }

  const store: RCWSStore = {
    ...initialState(),

    // ── Track injection ──────────────────────────────────────────
    injectTrack(partial) {
      const id    = nextTrackId()
      const track = { id, ...partial }
      set(s => ({ tracks: [...s.tracks, track], systemStatus: 'ACTIVE' }))
      log(`${id} ${track.type.replace(/_/g,' ')} ACQUIRED — BRG ${track.bearing.toFixed(0)}° / ${Math.round(track.distance)}m`, 'HOSTILE')
      broadcast()
    },

    injectMultiContact(cfg: MultiContactConfig) {
      const types: ThreatType[] = ['FPV_DRONE', 'RF_IED', 'ENEMY_RCWS', 'UNKNOWN']
      const newTracks: Track[] = []
      for (let i = 0; i < cfg.count; i++) {
        const spread = cfg.count === 1 ? 0 : ((i / (cfg.count - 1)) - 0.5) * 2 * cfg.bearingSpread
        const bearing = ((cfg.centreBearing + spread) + 360) % 360
        const dist = cfg.distanceMin + Math.random() * (cfg.distanceMax - cfg.distanceMin)
        const type = types[i % types.length]
        const id = nextTrackId()
        newTracks.push(buildTrack(id, type, bearing, dist))
      }
      set(s => ({ tracks: [...s.tracks, ...newTracks], systemStatus: 'ACTIVE' }))
      log(`MULTI-CONTACT INJECT — ${newTracks.length} ELEMENTS — BRG ${cfg.centreBearing.toFixed(0)}° ±${cfg.bearingSpread}°`, 'HOSTILE')
      broadcast()
    },

    selectTrack(id) {
      set({ selectedTrackId: id })
      if (id) {
        const t = get().tracks.find(x => x.id === id)
        if (t) log(`${t.id} ${t.rfProfile.protocol} — ${t.rfProfile.freqGHz}GHz — SELECTED`, 'INFO')
      }
      broadcast()
    },

    lockTarget(id) {
      const t = get().tracks.find(x => x.id === id)
      if (!t) return
      set(s => ({
        tracks: s.tracks.map(x => x.id === id ? { ...x, status: 'LOCKED' as const } : x),
        selectedTrackId: id,
        systemStatus: 'ACTIVE' as const,
        azimuth: t.bearing,
      }))
      log(`TARGET LOCKED — ${t.id} ${t.type.replace(/_/g,' ')} — ${t.rfProfile.protocol}`, 'INFO')
      broadcast()
    },

    initiateEngagement() {
      const { selectedTrackId, mode, tracks } = get()
      if (!selectedTrackId) return
      const t = tracks.find(x => x.id === selectedTrackId)
      if (!t || t.status === 'NEUTRALISED' || t.status === 'ESCAPED') return
      set({ isEngaging: true, engagementTargetId: selectedTrackId, systemStatus: 'ENGAGING' })
      log(`EMP DISCHARGE INITIATED — ${mode.replace(/_/g,' ')} — TARGET ${t.id}`, 'SYSTEM')
      log(`PEAK POWER 450MW — PULSE WIDTH ${t.rfProfile.recPulseWidthNs}ns — PRF ${t.rfProfile.recPrfHz}Hz`, 'SYSTEM')
      broadcast()
    },

    completeEngagement() {
      const { engagementTargetId, tracks, neutralisedCount } = get()
      if (!engagementTargetId) return
      const t = tracks.find(x => x.id === engagementTargetId)
      if (!t) return
      set(s => ({
        tracks: s.tracks.map(x =>
          x.id === engagementTargetId ? { ...x, status: 'NEUTRALISED' as const, contactStatus: 'NEUTRALISED' as const } : x,
        ),
        neutralisedCount:    neutralisedCount + 1,
        isEngaging:          false,
        engagementTargetId:  null,
        selectedTrackId:     null,
        systemStatus:        'ACTIVE' as const,
      }))
      log(`${t.id} NEUTRALISED — ELECTRONICS DESTROYED`, 'KILL')
      broadcast()
    },

    abortEngagement() {
      set({ isEngaging: false, engagementTargetId: null, systemStatus: 'ACTIVE' as const })
      log('ENGAGEMENT ABORTED BY OPERATOR', 'SYSTEM')
      broadcast()
    },

    lockAll() {
      const { tracks } = get()
      const locked: string[] = []
      set(s => ({
        tracks: s.tracks.map(t => {
          if (t.status !== 'TRACKING') return t
          locked.push(t.id)
          return { ...t, status: 'LOCKED' as const }
        }),
        systemStatus: 'ACTIVE' as const,
        azimuth: tracks.find(t => t.status === 'TRACKING')?.bearing ?? get().azimuth,
      }))
      log(`MULTI-LOCK — ${locked.length} TARGETS LOCKED: ${locked.join(' ')}`, 'INFO')
      broadcast()
    },

    setEngagementQueue(ids) { set({ engagementQueue: ids }); broadcast() },

    // ── Setters ──────────────────────────────────────────────────
    setAutoSpawn(v)    { set({ autoSpawnEnabled: v }); broadcast() },
    setMode(mode)      { set({ mode }); broadcast() },
    setAzimuth(az)     { set({ azimuth: az }); broadcast() },
    setElevation(el)   { set({ elevation: el }); broadcast() },
    setSimSpeed(s)     { set({ simulationSpeed: s }); broadcast() },
    setPaused(p)       { set({ isPaused: p }); broadcast() },
    toggleZones()      { set(s => ({ zonesVisible: !s.zonesVisible })); broadcast() },
    setEnvironment(e)  { set(s => ({ environment: { ...s.environment, ...e } })); broadcast() },
    setActiveView(v: ActiveView) { set({ activeView: v }); broadcast() },
    setPreSelected(id: string | null) {
      set(s => ({
        preSelectedContactId: id,
        tracks: s.tracks.map(t => ({ ...t, preSelected: t.id === id })),
      }))
      if (id) log(`PRE-SELECT ARMED — ${id} — AUTO-FIRE ON RANGE ENTRY`, 'INFO')
      broadcast()
    },

    addLog: log,

    addAlert(alert) {
      const id = Date.now().toString() + Math.random()
      set(s => ({
        alerts: [...s.alerts, { ...alert, id, timestamp: Date.now(), dismissed: false }],
      }))
    },

    dismissAlert(id) {
      set(s => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, dismissed: true } : a) }))
    },

    // ── Movement tick ────────────────────────────────────────────
    tickTracks(dt: number) {
      const { tracks, isPaused, simulationSpeed, preSelectedContactId } = get()
      if (isPaused) return
      const eff = dt * simulationSpeed
      const now = Date.now()
      const alertsToAdd: Array<Parameters<RCWSStore['addAlert']>[0]> = []
      let needsBroadcast = false

      const updated = tracks.map(t => {
        if (t.status === 'NEUTRALISED') return t

        // Already escaped/reached obj — just keep state
        if (t.status === 'ESCAPED' || t.contactStatus === 'OBJECTIVE_REACHED') return t

        // ENEMY_RCWS: stays stationary (speed ~0), just track
        if (t.type === 'ENEMY_RCWS') {
          const rcwsDist = latLngDistanceM(t.lat, t.lng, RCWS_LAT, RCWS_LNG)
          const newBrg = bearingBetween(t.lat, t.lng, RCWS_LAT, RCWS_LNG)
          return { ...t, bearing: newBrg, distance: rcwsDist }
        }

        // Compute movement step
        const stepM = t.speed * eff

        let newLat = t.lat
        let newLng = t.lng
        let newBearing = t.bearing
        let erraticTimer = t.erraticTimer
        let erraticBearing = t.erraticBearing
        let patrolAngle = t.patrolAngle

        if (t.flightPath === 'ERRATIC') {
          erraticTimer -= eff
          if (erraticTimer <= 0) {
            erraticBearing = (erraticBearing + (Math.random() - 0.5) * 90 + 360) % 360
            erraticTimer = 3 + Math.random() * 5
          }
          const pos = bearingToLatLng(t.lat, t.lng, erraticBearing, stepM)
          newLat = pos.lat; newLng = pos.lng
          newBearing = erraticBearing

        } else if (t.flightPath === 'PATROL') {
          // Circular patrol around objective
          patrolAngle += (stepM / 50) * (180 / Math.PI)
          const px = t.objective.lat + (50 / 111320) * Math.cos(patrolAngle * Math.PI / 180)
          const py = t.objective.lng + (50 / (111320 * Math.cos(t.objective.lat * Math.PI / 180))) * Math.sin(patrolAngle * Math.PI / 180)
          newBearing = bearingBetween(t.lat, t.lng, px, py)
          const pos = bearingToLatLng(t.lat, t.lng, newBearing, stepM)
          newLat = pos.lat; newLng = pos.lng

        } else {
          // DIRECT: fly toward objective with slight drift
          const toObjBrg = bearingBetween(t.lat, t.lng, t.objective.lat, t.objective.lng)
          const drift = t.driftAngle * (180 / Math.PI)
          newBearing = (toObjBrg + drift + 360) % 360
          const pos = bearingToLatLng(t.lat, t.lng, newBearing, stepM)
          newLat = pos.lat; newLng = pos.lng
        }

        const newDist = latLngDistanceM(newLat, newLng, RCWS_LAT, RCWS_LNG)
        const distToObj = latLngDistanceM(newLat, newLng, t.objective.lat, t.objective.lng)
        const wasInRange = t.contactStatus === 'IN_RANGE'
        const inRange = newDist <= ENGAGEMENT_RANGE_M

        // Recalculate range intersection for updated position
        const { entersRangeIn, inRangeWindow, outOfRange } = calcRangeIntersection(
          newLat, newLng, t.objective.lat, t.objective.lng, t.speed,
        )

        let contactStatus: import('../types').ContactStatus = t.contactStatus
        let inRangeWindowStart = t.inRangeWindowStart
        let newStatus: import('../types').TrackStatus = t.status

        // Entered range ring
        if (inRange && !wasInRange) {
          contactStatus = 'IN_RANGE'
          inRangeWindowStart = now
          alertsToAdd.push({
            type: 'ENTERING_RANGE', trackId: t.id,
            message: `${t.id} ENTERING ENGAGEMENT RANGE`,
            subMessage: t.preSelected ? 'Auto-fire: ARMED' : `BRG ${Math.round(newBearing)}° · ${Math.round(newDist)}m`,
            autoDismiss: true, autoDismissMs: 6000,
          })
          needsBroadcast = true

          // Pre-select auto-fire
          if (t.id === preSelectedContactId) {
            setTimeout(() => {
              const s = get()
              const track = s.tracks.find(x => x.id === t.id)
              if (track && track.status !== 'NEUTRALISED' && track.status !== 'ESCAPED') {
                if (track.status === 'TRACKING') s.lockTarget(t.id)
                setTimeout(() => get().initiateEngagement(), 150)
              }
            }, 100)
          }
        }

        // Exited range without engagement → ESCAPED
        if (wasInRange && !inRange) {
          contactStatus = 'ESCAPED'
          newStatus = 'ESCAPED'
          alertsToAdd.push({
            type: 'ESCAPED', trackId: t.id,
            message: `${t.id} ESCAPED ENGAGEMENT RANGE`,
            subMessage: `Last BRG: ${Math.round(newBearing)}° · Speed ${Math.round(t.speed)}m/s`,
            autoDismiss: true, autoDismissMs: 8000,
          })
          needsBroadcast = true
        }

        // Reached objective
        if (distToObj < 80 && t.flightPath !== 'PATROL') {
          contactStatus = 'OBJECTIVE_REACHED' as import('../types').ContactStatus
          alertsToAdd.push({
            type: 'THREAT_REALIZED', trackId: t.id,
            message: `${t.id} OBJECTIVE REACHED`,
            subMessage: `${t.type.replace(/_/g,' ')} · Mission accomplished · THREAT REALIZED`,
            autoDismiss: false, autoDismissMs: 0,
          })
          needsBroadcast = true
        }

        const timeToObjective = distToObj / Math.max(t.speed, 0.1)
        const score = calcPriorityScore({ type: t.type, distance: newDist, speed: t.speed, inRangeWindow })

        return {
          ...t,
          lat: newLat, lng: newLng,
          bearing: newBearing,
          distance: newDist,
          status: newStatus,
          contactStatus,
          inRangeWindowStart,
          timeToObjective,
          patrolAngle,
          erraticTimer,
          erraticBearing,
          priorityScore: score,
          entersRangeIn,
          inRangeWindow,
          outOfRange,
        }
      })

      // Radar sweep
      const sweepSpeed = (2 * Math.PI) / 3  // one rotation per 3s
      const newSweep = ((get().radarSweepAngle ?? 0) + sweepSpeed * eff) % (2 * Math.PI)

      set({ tracks: updated, radarSweepAngle: newSweep })
      alertsToAdd.forEach(a => get().addAlert(a))
      if (needsBroadcast) broadcast()
    },

    // ── Presets ──────────────────────────────────────────────────
    loadPreset(name: PresetName) {
      get().resetScenario()
      setTimeout(() => {
        const def = PRESETS[name]
        def.tracks.forEach(td => {
          const id = nextTrackId()
          get().injectTrack(buildTrack(id, td.type, td.bearing, td.distance, td.speed, td.altitude, td.priority, td.objective) as Omit<Track, 'id'>)
        })
      }, 80)
    },

    // ── Reset ────────────────────────────────────────────────────
    resetScenario() {
      set(initialState())
      broadcast()
    },
  }

  if (bc) {
    bc.onmessage = (e: MessageEvent) => { set(e.data as Partial<RCWSStore>) }
  }

  return store
})
