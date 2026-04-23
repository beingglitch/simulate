import { useEffect, useRef, useCallback } from 'react'
import {
  MapContainer, TileLayer, Circle, useMap, useMapEvents,
} from 'react-leaflet'
import L from 'leaflet'
import type { SimState, Threat } from '../types'

// Fictional desert ops area — generic enough, looks tactical
const MAP_CENTER: L.LatLngExpression = [28.52, 77.08]
const ZOOM = 14

// Convert bearing+range(m) to LatLng offset from center
function polarToLatLng(center: L.LatLng, bearingDeg: number, rangeM: number): L.LatLng {
  const R = 6371000 // earth radius
  const δ = rangeM / R
  const θ = (bearingDeg * Math.PI) / 180
  const φ1 = (center.lat * Math.PI) / 180
  const λ1 = (center.lng * Math.PI) / 180
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ))
  const λ2 = λ1 + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2))
  return L.latLng((φ2 * 180) / Math.PI, (λ2 * 180) / Math.PI)
}

// Range zone config: [range_m, stroke_color, fill_color, label]
const ZONES: [number, string, string, string][] = [
  [50,   '#e03030', 'rgba(220,40,40,0.12)',  'HARD-KILL 50m'],
  [150,  '#e06020', 'rgba(200,80,0,0.08)',   'HARD-KILL 150m'],
  [300,  '#d09000', 'rgba(200,140,0,0.06)',  'DISRUPT 300m'],
  [600,  '#b0a000', 'rgba(160,140,0,0.04)',  'DISRUPT 600m'],
  [1000, '#3080c0', 'rgba(40,100,180,0.03)', 'RF JAM 1km'],
]

const THREAT_TYPE_CLASS: Record<string, string> = {
  FPV_DRONE:  'fpv-drone',
  RF_IED:     'rf-ied',
  ENEMY_RCWS: 'enemy-rcws',
}

const THREAT_LETTER: Record<string, string> = {
  FPV_DRONE:  'F',
  RF_IED:     'I',
  ENEMY_RCWS: 'R',
}

interface InnerProps {
  state: SimState
  onSelectThreat: (id: string) => void
}

// Canvas layer for radar sweep + azimuth line
function RadarSweep({ azimuth }: { azimuth: number }) {
  const map = useMap()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef    = useRef<number>(0)
  const sweepRef  = useRef(0)
  const azRef     = useRef(azimuth)
  azRef.current   = azimuth

  useEffect(() => {
    const canvas = L.DomUtil.create('canvas') as HTMLCanvasElement
    canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:400'
    const container = map.getContainer()
    container.appendChild(canvas)
    canvasRef.current = canvas

    const resize = () => {
      canvas.width  = container.clientWidth
      canvas.height = container.clientHeight
    }
    resize()
    map.on('resize move zoom', resize)

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const { clientWidth: W, clientHeight: H } = container
      ctx.clearRect(0, 0, W, H)

      const center = map.latLngToContainerPoint(MAP_CENTER as L.LatLngExpression)
      const edgePt = map.latLngToContainerPoint(
        polarToLatLng(L.latLng(...(MAP_CENTER as [number,number])), 0, 1000)
      )
      const maxR = Math.abs(edgePt.y - center.y)

      sweepRef.current = (sweepRef.current + 0.35) % 360

      // Sweep line
      const sweepRad = ((sweepRef.current - 90) * Math.PI) / 180
      ctx.beginPath()
      ctx.moveTo(center.x, center.y)
      ctx.lineTo(center.x + Math.cos(sweepRad) * maxR, center.y + Math.sin(sweepRad) * maxR)
      ctx.strokeStyle = 'rgba(61,214,140,0.45)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Sweep trail
      const trailRad = ((sweepRef.current - 90 - 40) * Math.PI) / 180
      const grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, maxR)
      grad.addColorStop(0, 'rgba(61,214,140,0)')
      grad.addColorStop(1, 'rgba(61,214,140,0.04)')
      ctx.beginPath()
      ctx.moveTo(center.x, center.y)
      ctx.arc(center.x, center.y, maxR, trailRad, sweepRad)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()

      // Azimuth line
      const azRad = ((azRef.current - 90) * Math.PI) / 180
      ctx.beginPath()
      ctx.moveTo(center.x, center.y)
      ctx.lineTo(center.x + Math.cos(azRad) * maxR, center.y + Math.sin(azRad) * maxR)
      ctx.strokeStyle = 'rgba(77,166,255,0.3)'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 4])
      ctx.stroke()
      ctx.setLineDash([])

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      map.off('resize move zoom', resize)
      container.removeChild(canvas)
    }
  }, [map])

  return null
}

// EMP pulse canvas overlay
function EMPPulse({ fired }: { fired: boolean }) {
  const map = useMap()
  const firedRef  = useRef(fired)
  const prevFired = useRef(false)
  const pulseR    = useRef(0)
  const activeRef = useRef(false)
  const rafRef    = useRef<number>(0)
  firedRef.current = fired

  useEffect(() => {
    const canvas = L.DomUtil.create('canvas') as HTMLCanvasElement
    canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:401'
    const container = map.getContainer()
    container.appendChild(canvas)

    const resize = () => {
      canvas.width  = container.clientWidth
      canvas.height = container.clientHeight
    }
    resize()
    map.on('resize move zoom', resize)

    const draw = () => {
      if (firedRef.current && !prevFired.current) {
        pulseR.current = 0
        activeRef.current = true
      }
      prevFired.current = firedRef.current

      const ctx = canvas.getContext('2d')
      if (!ctx) { rafRef.current = requestAnimationFrame(draw); return }
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      if (activeRef.current) {
        const center = map.latLngToContainerPoint(MAP_CENTER as L.LatLngExpression)
        const edgePt = map.latLngToContainerPoint(
          polarToLatLng(L.latLng(...(MAP_CENTER as [number,number])), 0, 700)
        )
        const maxR = Math.abs(edgePt.y - center.y)
        pulseR.current += 3.5

        if (pulseR.current > maxR) {
          activeRef.current = false
          pulseR.current = 0
        } else {
          const a = Math.max(0, 1 - pulseR.current / maxR)
          ctx.beginPath()
          ctx.arc(center.x, center.y, pulseR.current, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(255,110,20,${a * 0.85})`
          ctx.lineWidth = 2.5
          ctx.stroke()
          if (pulseR.current > 20) {
            ctx.beginPath()
            ctx.arc(center.x, center.y, pulseR.current * 0.6, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(255,200,50,${a * 0.5})`
            ctx.lineWidth = 1.5
            ctx.stroke()
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      map.off('resize move zoom', resize)
      container.removeChild(canvas)
    }
  }, [map])

  return null
}

// ── Step-specific beam drawing functions ──────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1) ^ (s + Math.imul(s ^ (s >>> 7), s | 61))
    return ((s ^ (s >>> 14)) >>> 0) / 0xffffffff
  }
}

function drawFingerprint(ctx: CanvasRenderingContext2D, cx: number, cy: number, tx: number, ty: number, now: number) {
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty)
  ctx.strokeStyle = 'rgba(77,166,255,0.22)'; ctx.lineWidth = 1
  ctx.setLineDash([4, 5]); ctx.stroke(); ctx.setLineDash([])
  const period = 900
  ;[0, 0.33, 0.66].forEach(offset => {
    const phase = ((now % period) / period + offset) % 1
    const px = cx + (tx - cx) * phase, py = cy + (ty - cy) * phase
    const alpha = Math.sin(phase * Math.PI) * 0.7
    ctx.beginPath(); ctx.arc(px, py, 3 + phase * 10, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(77,166,255,${alpha.toFixed(2)})`; ctx.lineWidth = 1.5; ctx.stroke()
  })
}

function drawSoftAttack(ctx: CanvasRenderingContext2D, cx: number, cy: number, tx: number, ty: number, now: number) {
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty)
  ctx.strokeStyle = 'rgba(0,212,255,0.3)'; ctx.lineWidth = 1.2
  ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([])
  const rng = seededRandom(Math.floor(now / 80))
  for (let i = 0; i < 22; i++) {
    const r = rng() * 44, a = rng() * Math.PI * 2
    ctx.beginPath(); ctx.arc(tx + Math.cos(a) * r, ty + Math.sin(a) * r, 0.8 + rng() * 2, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0,212,255,${(rng() * 0.45 + 0.1).toFixed(2)})`; ctx.fill()
  }
}

function drawFrontDoor(ctx: CanvasRenderingContext2D, cx: number, cy: number, tx: number, ty: number, now: number) {
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty)
  ctx.strokeStyle = 'rgba(245,188,75,0.1)'; ctx.lineWidth = 7; ctx.stroke()
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty)
  ctx.strokeStyle = 'rgba(245,188,75,0.8)'; ctx.lineWidth = 1.5; ctx.stroke()
  const pulse = 0.5 + 0.5 * Math.sin(now / 130)
  ctx.beginPath(); ctx.arc(tx, ty, 3 + pulse * 3, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(245,188,75,${(0.55 + pulse * 0.35).toFixed(2)})`; ctx.fill()
}

function drawCumStress(ctx: CanvasRenderingContext2D, cx: number, cy: number, tx: number, ty: number, now: number) {
  const a = 0.35 + 0.25 * Math.abs(Math.sin(now / 280))
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty)
  ctx.strokeStyle = `rgba(245,158,11,${a.toFixed(2)})`; ctx.lineWidth = 2; ctx.stroke()
  ;[0.2, 0.4, 0.6, 0.8].forEach((frac, i) => {
    const hx = cx + (tx - cx) * frac, hy = cy + (ty - cy) * frac
    const p = Math.sin(now / 200 + i * 1.2)
    ctx.beginPath(); ctx.arc(hx, hy, 5 + p * 3, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(245,158,11,${(0.18 + 0.12 * p).toFixed(2)})`; ctx.lineWidth = 1; ctx.stroke()
  })
}

function drawResonanceStrike(ctx: CanvasRenderingContext2D, cx: number, cy: number, tx: number, ty: number, now: number) {
  const bright = 0.6 + 0.4 * Math.abs(Math.sin(now / 90))
  for (const [sw, sa] of [[9, 0.08], [3, 0.28]] as [number, number][]) {
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty)
    ctx.strokeStyle = `rgba(255,100,40,${sa})`; ctx.lineWidth = sw; ctx.stroke()
  }
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty)
  ctx.strokeStyle = `rgba(255,200,60,${bright.toFixed(2)})`; ctx.lineWidth = 1.5; ctx.stroke()
  ;[0, 0.38, 0.72].forEach(off => {
    const phase = ((now % 580) / 580 + off) % 1
    ctx.beginPath(); ctx.arc(tx, ty, phase * 32, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255,140,50,${((1 - phase) * 0.65).toFixed(2)})`; ctx.lineWidth = 1.5; ctx.stroke()
  })
  ctx.beginPath(); ctx.arc(tx, ty, 3 + bright * 2.5, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(255,220,80,${bright.toFixed(2)})`; ctx.fill()
}

function drawAssess(ctx: CanvasRenderingContext2D, cx: number, cy: number, tx: number, ty: number, now: number) {
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tx, ty)
  ctx.strokeStyle = 'rgba(61,214,140,0.18)'; ctx.lineWidth = 1
  ctx.setLineDash([3, 5]); ctx.stroke(); ctx.setLineDash([])
  const phase = 1 - ((now % 1100) / 1100)
  ctx.beginPath(); ctx.arc(cx + (tx - cx) * phase, cy + (ty - cy) * phase, 2.5, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(61,214,140,0.75)'; ctx.fill()
}

// Pipeline beam canvas
function PipelineBeam({ state }: { state: SimState }) {
  const map    = useMap()
  const sRef   = useRef(state)
  sRef.current = state
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = L.DomUtil.create('canvas') as HTMLCanvasElement
    canvas.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:402'
    const container = map.getContainer()
    container.appendChild(canvas)

    const resize = () => {
      canvas.width  = container.clientWidth
      canvas.height = container.clientHeight
    }
    resize()
    map.on('resize move zoom', resize)

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) { rafRef.current = requestAnimationFrame(draw); return }
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const s = sRef.current
      if (s.pipelineActive && s.selectedThreatId) {
        const t = s.threats.find(x => x.id === s.selectedThreatId)
        if (t) {
          const cLL = L.latLng(...(MAP_CENTER as [number,number]))
          const tLL = polarToLatLng(cLL, t.bearing, t.range)
          const cp  = map.latLngToContainerPoint(cLL)
          const tp  = map.latLngToContainerPoint(tLL)
          const now = Date.now()
          switch (s.pipelineStep) {
            case 'FINGERPRINT':       drawFingerprint(ctx, cp.x, cp.y, tp.x, tp.y, now); break
            case 'SOFT_ATTACK':       drawSoftAttack(ctx, cp.x, cp.y, tp.x, tp.y, now); break
            case 'FRONT_DOOR':        drawFrontDoor(ctx, cp.x, cp.y, tp.x, tp.y, now); break
            case 'CUMULATIVE_STRESS': drawCumStress(ctx, cp.x, cp.y, tp.x, tp.y, now); break
            case 'RESONANCE_STRIKE':  drawResonanceStrike(ctx, cp.x, cp.y, tp.x, tp.y, now); break
            case 'ASSESS':            drawAssess(ctx, cp.x, cp.y, tp.x, tp.y, now); break
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(rafRef.current)
      map.off('resize move zoom', resize)
      container.removeChild(canvas)
    }
  }, [map])

  return null
}

// Threat markers as Leaflet DivIcons
function ThreatMarkers({ state, onSelectThreat }: InnerProps) {
  const map          = useMap()
  const markersRef   = useRef<Map<string, L.Marker>>(new Map())
  const centerLatLng = L.latLng(...(MAP_CENTER as [number,number]))

  useEffect(() => {
    const current = markersRef.current
    const seen    = new Set<string>()

    state.threats.forEach(t => {
      seen.add(t.id)
      const latlng    = polarToLatLng(centerLatLng, t.bearing, t.range)
      const typeClass = THREAT_TYPE_CLASS[t.type] ?? 'fpv-drone'
      const selected  = t.id === state.selectedThreatId
      const statusCls = t.status.toLowerCase()
      const letter    = THREAT_LETTER[t.type] ?? '?'

      const iconHtml = `
        <div class="threat-marker">
          <div class="threat-icon ${typeClass} ${selected ? 'selected' : ''} ${statusCls}">${letter}</div>
          <div class="threat-label">${t.id} · ${Math.round(t.range)}m</div>
        </div>`

      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize:   [40, 40],
        iconAnchor: [20, 11],
      })

      const existing = current.get(t.id)
      if (existing) {
        existing.setLatLng(latlng)
        existing.setIcon(icon)
      } else {
        const marker = L.marker(latlng, { icon, zIndexOffset: 500 })
          .addTo(map)
          .on('click', (e) => {
            L.DomEvent.stopPropagation(e)
            onSelectThreat(t.id)
          })
        current.set(t.id, marker)
      }
    })

    // Remove stale markers
    current.forEach((marker, id) => {
      if (!seen.has(id)) { marker.remove(); current.delete(id) }
    })
  }, [state, map, onSelectThreat, centerLatLng])

  useEffect(() => {
    return () => markersRef.current.forEach(m => m.remove())
  }, [])

  return null
}

// Vehicle marker (center)
function VehicleMarker() {
  const map = useMap()
  useEffect(() => {
    const icon = L.divIcon({
      html: `<div class="vehicle-marker">EMP</div>`,
      className: '',
      iconSize:   [28, 28],
      iconAnchor: [14, 14],
    })
    const m = L.marker(MAP_CENTER as L.LatLngExpression, { icon, zIndexOffset: 1000 }).addTo(map)
    return () => { m.remove() }
  }, [map])
  return null
}

// Disable map click propagation to parent
function MapClickHandler({ onBgClick }: { onBgClick: () => void }) {
  useMapEvents({ click: onBgClick })
  return null
}

// ── Main exported component ───────────────────────────────────────────────

interface Props {
  state: SimState
  onSelectThreat: (id: string | null) => void
}

export default function MapView({ state, onSelectThreat }: Props) {
  const handleBgClick = useCallback(() => onSelectThreat(null), [onSelectThreat])

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={ZOOM}
      className="w-full h-full"
      zoomControl={false}
      attributionControl={true}
    >
      {/* Dark satellite-style tiles (CartoDB dark matter) */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        maxZoom={19}
        subdomains="abcd"
      />

      {/* Range zones */}
      {ZONES.map(([rangeM, stroke, fill, label]) => (
        <Circle
          key={label}
          center={MAP_CENTER}
          radius={rangeM}
          pathOptions={{
            color:       stroke,
            fillColor:   fill,
            fillOpacity: 1,
            weight:      0.8,
            dashArray:   '4 6',
          }}
        />
      ))}

      {/* Animated overlays */}
      <RadarSweep azimuth={state.turret.azimuth} />
      <EMPPulse   fired={state.empFired} />
      <PipelineBeam state={state} />

      {/* Markers */}
      <VehicleMarker />
      <ThreatMarkers state={state} onSelectThreat={id => onSelectThreat(id)} />

      <MapClickHandler onBgClick={handleBgClick} />
    </MapContainer>
  )
}
