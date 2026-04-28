// Web Audio API synthesiser — no audio files required

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function sine(freq: number, duration: number, gainVal: number, startTime: number, ac: AudioContext) {
  const osc  = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(freq, startTime)
  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.start(startTime)
  osc.stop(startTime + duration + 0.05)
}

// 800Hz radar ping — called every 2s in ACTIVE mode
export function playRadarPing() {
  const ac = getCtx()
  sine(800, 0.12, 0.15, ac.currentTime, ac)
}

// Ascending two-tone — target locked
export function playLockTone() {
  const ac = getCtx()
  sine(880, 0.08, 0.3, ac.currentTime,        ac)
  sine(1100, 0.1, 0.3, ac.currentTime + 0.10, ac)
}

// Low-frequency EMP thrum — 60-80Hz, 1.5s
export function playEMPDischarge() {
  const ac = getCtx()
  const now = ac.currentTime

  // Sub-bass thrum
  const osc  = ac.createOscillator()
  const gain = ac.createGain()
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(60, now)
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.5)
  osc.frequency.exponentialRampToValueAtTime(40, now + 1.5)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.55, now + 0.04)   // fast attack
  gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5) // slow decay
  osc.start(now)
  osc.stop(now + 1.6)

  // High-freq crackle layered on top
  const osc2  = ac.createOscillator()
  const gain2 = ac.createGain()
  osc2.connect(gain2)
  gain2.connect(ac.destination)
  osc2.type = 'square'
  osc2.frequency.setValueAtTime(220, now)
  osc2.frequency.exponentialRampToValueAtTime(440, now + 0.3)
  gain2.gain.setValueAtTime(0, now)
  gain2.gain.linearRampToValueAtTime(0.08, now + 0.02)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6)
  osc2.start(now)
  osc2.stop(now + 0.7)
}

// Descending kill-confirmed tone
export function playKillConfirmed() {
  const ac = getCtx()
  sine(1047, 0.12, 0.25, ac.currentTime,       ac)
  sine(784,  0.12, 0.25, ac.currentTime + 0.14, ac)
  sine(523,  0.16, 0.25, ac.currentTime + 0.28, ac)
}

// Sharp 1200Hz warning — new hostile
export function playHostileWarning() {
  const ac = getCtx()
  sine(1200, 0.07, 0.4, ac.currentTime,        ac)
  sine(1200, 0.07, 0.4, ac.currentTime + 0.12, ac)
}

// Short 800Hz ping — new contact detected
export function playContactDetected() {
  const ac = getCtx()
  sine(800, 0.08, 0.2, ac.currentTime, ac)
}

// Ascending two-tone — contact entering range
export function playEnteringRange() {
  const ac = getCtx()
  sine(600, 0.12, 0.25, ac.currentTime,       ac)
  sine(900, 0.15, 0.28, ac.currentTime + 0.14, ac)
}

// Soft click + low hum — pre-select armed
export function playPreSelectArmed() {
  const ac = getCtx()
  const now = ac.currentTime
  sine(1200, 0.03, 0.15, now, ac)
  const osc = ac.createOscillator()
  const g   = ac.createGain()
  osc.connect(g); g.connect(ac.destination)
  osc.type = 'sine'; osc.frequency.value = 80
  g.gain.setValueAtTime(0, now + 0.04)
  g.gain.linearRampToValueAtTime(0.06, now + 0.12)
  g.gain.linearRampToValueAtTime(0.04, now + 1.0)
  g.gain.exponentialRampToValueAtTime(0.001, now + 2.0)
  osc.start(now + 0.04); osc.stop(now + 2.1)
}

// Descending warble — contact escaped
export function playEscapedAlert() {
  const ac = getCtx()
  const now = ac.currentTime
  const osc = ac.createOscillator()
  const g   = ac.createGain()
  osc.connect(g); g.connect(ac.destination)
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(700, now)
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.6)
  g.gain.setValueAtTime(0.25, now)
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.7)
  osc.start(now); osc.stop(now + 0.8)
}

// Two short harsh bursts — objective reached
export function playObjectiveReached() {
  const ac = getCtx()
  const now = ac.currentTime
  ;[0, 0.3].forEach(offset => {
    const osc = ac.createOscillator()
    const g   = ac.createGain()
    osc.connect(g); g.connect(ac.destination)
    osc.type = 'square'; osc.frequency.value = 440
    g.gain.setValueAtTime(0.35, now + offset)
    g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18)
    osc.start(now + offset); osc.stop(now + offset + 0.2)
  })
}

// Rapid beeping — enemy RCWS firing
export function playEnemyFiring() {
  const ac = getCtx()
  const now = ac.currentTime
  ;[0, 0.15, 0.3, 0.45, 0.6].forEach(offset => {
    sine(1400, 0.07, 0.4, now + offset, ac)
  })
}

// Resume AudioContext on first user interaction
export function resumeAudio() {
  if (ctx && ctx.state === 'suspended') ctx.resume()
}
