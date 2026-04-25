import { useState, useCallback, useRef } from 'react'
import type { SimState, Threat, ThreatType, WeaponMode, PipelineStep, KillEntry } from '../types'

const MAP_CENTER = { x: 500, y: 400 }
const PIXELS_PER_METER = 0.45

export function metersToPixels(m: number) {
  return m * PIXELS_PER_METER
}

export function polarToCanvas(bearing: number, range: number) {
  const rad = ((bearing - 90) * Math.PI) / 180
  return {
    x: MAP_CENTER.x + Math.cos(rad) * metersToPixels(range),
    y: MAP_CENTER.y + Math.sin(rad) * metersToPixels(range),
  }
}

const RF_FINGERPRINTS: Record<ThreatType, string[]> = {
  FPV_DRONE:   ['2.4GHz FHSS', '5.8GHz DJI', '900MHz LoRa', '433MHz FSK'],
  RF_IED:      ['315MHz OOK', '433MHz ASK', '868MHz GFSK', '27MHz AM'],
  ENEMY_RCWS:  ['1.4GHz DSS', '2.4GHz DSSS', '5.8GHz OFDM', '900MHz LFH'],
}

let threatIdCounter = 0

function generateThreat(type: ThreatType): Threat {
  threatIdCounter++
  const bearing = Math.random() * 360
  const range = 800 + Math.random() * 400
  const pos = polarToCanvas(bearing, range)
  const fps = RF_FINGERPRINTS[type]
  return {
    id: `T${String(threatIdCounter).padStart(3, '0')}`,
    type,
    x: pos.x,
    y: pos.y,
    bearing,
    range,
    speed: type === 'FPV_DRONE' ? 18 : type === 'ENEMY_RCWS' ? 8 : 2,
    status: 'APPROACHING',
    rfFingerprint: fps[Math.floor(Math.random() * fps.length)],
    priority: Math.floor(Math.random() * 3) + 1,
  }
}

const PIPELINE_STEPS: PipelineStep[] = [
  'FINGERPRINT', 'SOFT_ATTACK', 'FRONT_DOOR',
  'CUMULATIVE_STRESS', 'RESONANCE_STRIKE', 'ASSESS',
]

function makeInitialState(): SimState {
  threatIdCounter = 0
  return {
    threats: [
      generateThreat('FPV_DRONE'),
      generateThreat('RF_IED'),
      generateThreat('ENEMY_RCWS'),
    ],
    turret: { azimuth: 0, elevation: 15, mode: 'DIRECTED_EMP' },
    selectedThreatId: null,
    engagementApproved: false,
    pipelineActive: false,
    pipelineStep: null,
    pipelineProgress: 0,
    empFired: false,
    empFireCount: 0,
    systemTime: 0,
    killLog: [],
  }
}

export function useSimStore() {
  const [state, setState] = useState<SimState>(makeInitialState)
  const pipelineTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectThreat = useCallback((id: string | null) => {
    setState(s => ({ ...s, selectedThreatId: id, engagementApproved: false }))
  }, [])

  const setTurretAzimuth = useCallback((az: number) => {
    setState(s => ({ ...s, turret: { ...s.turret, azimuth: ((az % 360) + 360) % 360 } }))
  }, [])

  const setTurretElevation = useCallback((el: number) => {
    setState(s => ({ ...s, turret: { ...s.turret, elevation: Math.max(-10, Math.min(45, el)) } }))
  }, [])

  const setWeaponMode = useCallback((mode: WeaponMode) => {
    setState(s => ({ ...s, turret: { ...s.turret, mode } }))
  }, [])

  const approveEngagement = useCallback(() => {
    setState(s => {
      if (!s.selectedThreatId) return s
      return { ...s, engagementApproved: true }
    })
  }, [])

  const spawnThreat = useCallback((type: ThreatType) => {
    setState(s => ({ ...s, threats: [...s.threats, generateThreat(type)] }))
  }, [])

  const runPipeline = useCallback(() => {
    setState(s => {
      if (!s.selectedThreatId || !s.engagementApproved) return s
      return { ...s, pipelineActive: true, pipelineStep: 'FINGERPRINT', pipelineProgress: 0, empFired: false }
    })
    if (pipelineTimer.current) clearTimeout(pipelineTimer.current)

    let stepIndex = 0
    const advance = () => {
      stepIndex++
      if (stepIndex >= PIPELINE_STEPS.length) {
        // Pipeline complete
        setState(s => {
          const target = s.threats.find(t => t.id === s.selectedThreatId)
          const outcome: KillEntry['outcome'] = s.turret.mode === 'KINETIC' ? 'DESTROYED' : 'DISRUPTED'
          const threats = s.threats.map(t =>
            t.id === s.selectedThreatId
              ? { ...t, status: outcome as Threat['status'] }
              : t
          )
          const entry: KillEntry | null = target
            ? {
                id: target.id,
                type: target.type,
                mode: s.turret.mode,
                outcome,
                range: Math.round(target.range),
                time: s.systemTime,
              }
            : null
          return {
            ...s,
            threats,
            pipelineActive: false,
            pipelineStep: null,
            pipelineProgress: 100,
            empFired: true,
            empFireCount: s.empFireCount + 1,
            engagementApproved: false,
            killLog: entry ? [...s.killLog, entry] : s.killLog,
          }
        })
        return
      }
      setState(s => ({
        ...s,
        pipelineStep: PIPELINE_STEPS[stepIndex],
        pipelineProgress: Math.round((stepIndex / (PIPELINE_STEPS.length - 1)) * 100),
      }))
      pipelineTimer.current = setTimeout(advance, 1400)
    }

    pipelineTimer.current = setTimeout(advance, 1400)
  }, [])

  const tickThreats = useCallback((dt: number) => {
    setState(s => {
      const threats = s.threats.map(t => {
        if (t.status !== 'APPROACHING') return t
        const newRange = Math.max(0, t.range - t.speed * dt)
        if (newRange <= 5) {
          // Threat reached the position — mark escaped
          const pos = polarToCanvas(t.bearing, 0)
          return { ...t, range: 0, x: pos.x, y: pos.y, status: 'ESCAPED' as Threat['status'] }
        }
        const pos = polarToCanvas(t.bearing, newRange)
        return { ...t, range: newRange, x: pos.x, y: pos.y }
      })
      return { ...s, threats, systemTime: s.systemTime + dt * 1000 }
    })
  }, [])

  const resetScenario = useCallback(() => {
    if (pipelineTimer.current) {
      clearTimeout(pipelineTimer.current)
      pipelineTimer.current = null
    }
    setState(makeInitialState())
  }, [])

  return {
    state,
    selectThreat,
    setTurretAzimuth,
    setTurretElevation,
    setWeaponMode,
    approveEngagement,
    spawnThreat,
    runPipeline,
    tickThreats,
    resetScenario,
    MAP_CENTER,
  }
}
