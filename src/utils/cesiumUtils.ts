import * as Cesium from 'cesium'

// ─── RCWS fixed position — Prayagraj, Uttar Pradesh ─────────────
export const RCWS_LAT = 25.4358
export const RCWS_LNG = 81.8463
export const RCWS_POSITION = Cesium.Cartesian3.fromDegrees(RCWS_LNG, RCWS_LAT, 0)

// ─── Zone radii (metres) ─────────────────────────────────────────
export const ZONE_RADII = {
  EMP_HARD_KILL:  1000,
  EMP_DISRUPTION: 3000,
  RF_JAM:         10000,
}

// ─── Colour helpers ───────────────────────────────────────────────
export function hexToCesiumColor(hex: string, alpha = 1.0): Cesium.Color {
  return Cesium.Color.fromCssColorString(hex).withAlpha(alpha)
}

// ─── Default viewer options ────────────────────────────────────────
export function defaultViewerOptions(container: HTMLElement): Cesium.Viewer {
  const viewer = new Cesium.Viewer(container, {
    baseLayerPicker:        false,
    timeline:               false,
    animation:              false,
    homeButton:             false,
    sceneModePicker:        false,
    navigationHelpButton:   false,
    fullscreenButton:       false,
    geocoder:               false,
    infoBox:                false,
    selectionIndicator:     false,
    skyBox:                 false as unknown as Cesium.SkyBox,
    skyAtmosphere:          false as unknown as Cesium.SkyAtmosphere,
    globe:                  new Cesium.Globe(),
  })

  // Dark CARTO tiles — no token required
  viewer.imageryLayers.removeAll()
  viewer.imageryLayers.addImageryProvider(
    new Cesium.UrlTemplateImageryProvider({
      url:        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c', 'd'],
      credit:     new Cesium.Credit('CARTO', false),
    }),
  )

  // Turn off stock UI chrome that bleeds through
  viewer.scene.globe.enableLighting     = false
  viewer.scene.fog.enabled              = false
  viewer.scene.sun                      = undefined as unknown as Cesium.Sun
  viewer.scene.moon                     = undefined as unknown as Cesium.Moon
  viewer.scene.backgroundColor          = Cesium.Color.BLACK
  viewer.scene.globe.baseColor          = hexToCesiumColor('#050d14')

  // Initial camera — isometric 45° tilt over Prayagraj
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(RCWS_LNG, RCWS_LAT - 0.03, 6000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch:   Cesium.Math.toRadians(-45),
      roll:    0,
    },
  })

  return viewer
}

// ─── Add RCWS entity ─────────────────────────────────────────────
export function addRCWSEntity(viewer: Cesium.Viewer): Cesium.Entity {
  return viewer.entities.add({
    position: RCWS_POSITION,
    box: {
      dimensions:    new Cesium.Cartesian3(20, 20, 10),
      material:      hexToCesiumColor('#F5A623', 0.9),
      outline:       true,
      outlineColor:  hexToCesiumColor('#F5A623'),
      outlineWidth:  2,
    },
    label: {
      text:          'EMP-RCWS UNIT-01',
      font:          '12px JetBrains Mono, monospace',
      fillColor:     hexToCesiumColor('#F5A623'),
      outlineColor:  Cesium.Color.BLACK,
      outlineWidth:  2,
      style:         Cesium.LabelStyle.FILL_AND_OUTLINE,
      pixelOffset:   new Cesium.Cartesian2(0, -24),
      showBackground: true,
      backgroundColor: hexToCesiumColor('#000000', 0.7),
      backgroundPadding: new Cesium.Cartesian2(6, 4),
    },
    point: {
      pixelSize:   6,
      color:       hexToCesiumColor('#F5A623'),
      outlineColor: hexToCesiumColor('#000000'),
      outlineWidth: 1,
    },
  })
}

// ─── Threat colours ──────────────────────────────────────────────
export const THREAT_COLORS: Record<string, string> = {
  FPV_DRONE:  '#00D4FF',
  RF_IED:     '#FF2020',
  ENEMY_RCWS: '#F5A623',
  UNKNOWN:    '#888888',
}
