import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { useRCWSStore } from '../../store/useRCWSStore'
import { defaultViewerOptions, addRCWSEntity, hexToCesiumColor, ZONE_RADII, RCWS_LAT, RCWS_LNG } from '../../utils/cesiumUtils'
import { THREAT_COLORS } from '../../utils/cesiumUtils'

// Zone visibility managed via Cesium entities directly

export default function CesiumMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef    = useRef<Cesium.Viewer | null>(null)
  const droneRefs    = useRef<Map<string, Cesium.Entity>>(new Map())
  const zoneRefs     = useRef<Cesium.Entity[]>([])
  const beamRef      = useRef<Cesium.Entity | null>(null)

  const {
    tracks, selectedTrackId, zonesVisible,
    isEngaging, engagementTargetId,
  } = useRCWSStore()

  // ── Init viewer ────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return
    const viewer = defaultViewerOptions(containerRef.current)
    viewerRef.current = viewer
    addRCWSEntity(viewer)
    addZones(viewer, zoneRefs)
    return () => {
      viewer.destroy()
      viewerRef.current = null
    }
  }, [])

  // ── Zone visibility ────────────────────────────────────────────
  useEffect(() => {
    zoneRefs.current.forEach(e => { e.show = zonesVisible })
  }, [zonesVisible])

  // ── Track entities ─────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    const activeIds = new Set(tracks.map(t => t.id))

    // Remove stale entities
    droneRefs.current.forEach((entity, id) => {
      if (!activeIds.has(id)) {
        viewer.entities.remove(entity)
        droneRefs.current.delete(id)
      }
    })

    // Add / update
    tracks.forEach(track => {
      const pos = Cesium.Cartesian3.fromDegrees(track.lng, track.lat, track.altitude)
      const color = hexToCesiumColor(
        track.status === 'NEUTRALISED' ? '#00FF41'
          : track.status === 'ESCAPED'     ? '#555555'
          : THREAT_COLORS[track.type] ?? '#FF2020',
        track.status === 'NEUTRALISED' || track.status === 'ESCAPED' ? 0.5 : 0.9,
      )
      const selected = track.id === selectedTrackId

      if (droneRefs.current.has(track.id)) {
        const e = droneRefs.current.get(track.id)!
        // Update position
        ;(e.position as unknown as Cesium.ConstantPositionProperty) =
          new Cesium.ConstantPositionProperty(pos)
        if (e.point) {
          e.point.color  = new Cesium.ConstantProperty(color)
          e.point.pixelSize = new Cesium.ConstantProperty(selected ? 10 : 6)
          e.point.outlineColor = new Cesium.ConstantProperty(
            selected ? hexToCesiumColor('#00D4FF') : hexToCesiumColor('#000')
          )
          e.point.outlineWidth = new Cesium.ConstantProperty(selected ? 2 : 1)
        }
      } else {
        const entity = viewer.entities.add({
          id: track.id,
          position: pos,
          point: {
            pixelSize:    selected ? 10 : 6,
            color,
            outlineColor: selected ? hexToCesiumColor('#00D4FF') : hexToCesiumColor('#000'),
            outlineWidth: selected ? 2 : 1,
          },
          label: {
            text:           track.id,
            font:           '10px JetBrains Mono, monospace',
            fillColor:      color,
            outlineColor:   Cesium.Color.BLACK,
            outlineWidth:   2,
            style:          Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset:    new Cesium.Cartesian2(12, 0),
            showBackground: false,
            show:           true,
          },
        })
        droneRefs.current.set(track.id, entity)
      }
    })
  }, [tracks, selectedTrackId])

  // ── EMP beam ──────────────────────────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    if (beamRef.current) {
      viewer.entities.remove(beamRef.current)
      beamRef.current = null
    }

    if (isEngaging && engagementTargetId) {
      const target = tracks.find(t => t.id === engagementTargetId)
      if (target) {
        const origin = Cesium.Cartesian3.fromDegrees(RCWS_LNG, RCWS_LAT, 0)
        const end    = Cesium.Cartesian3.fromDegrees(target.lng, target.lat, target.altitude)
        beamRef.current = viewer.entities.add({
          polyline: {
            positions:  [origin, end],
            width:      3,
            material:   new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.3,
              color:     hexToCesiumColor('#F5A623', 0.8),
            }),
          },
        })
      }
    }
  }, [isEngaging, engagementTargetId, tracks])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', background: '#000' }}
    />
  )
}

function addZones(viewer: Cesium.Viewer, zoneRefs: React.MutableRefObject<Cesium.Entity[]>) {
  const rcwsPos = Cesium.Cartesian3.fromDegrees(RCWS_LNG, RCWS_LAT, 0)

  const zones = [
    { r: ZONE_RADII.EMP_HARD_KILL,  color: '#FF2020', label: 'EMP HARD KILL 1km',   alpha: 0.08 },
    { r: ZONE_RADII.EMP_DISRUPTION, color: '#F5A623', label: 'EMP DISRUPTION 3km',  alpha: 0.05 },
    { r: ZONE_RADII.RF_JAM,         color: '#00D4FF', label: 'RF JAM 10km',         alpha: 0.03 },
  ]

  zones.forEach(z => {
    const e = viewer.entities.add({
      position: rcwsPos,
      ellipse: {
        semiMajorAxis: z.r,
        semiMinorAxis: z.r,
        material:      hexToCesiumColor(z.color, z.alpha),
        outline:       true,
        outlineColor:  hexToCesiumColor(z.color, 0.4),
        outlineWidth:  1,
        height:        0,
      },
    })
    zoneRefs.current.push(e)
  })
}
