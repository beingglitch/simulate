import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import type { WeaponMode } from '../../types'

const MODE_HEX: Record<WeaponMode, string> = {
  RF_JAM:       '#4da6ff',
  DIRECTED_EMP: '#f5bc4b',
  KINETIC:      '#f05252',
}

// ── Spinning radar ring on top of turret ───────────────────────────
function RadarRing() {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((_, dt) => { ref.current.rotation.y += dt * 1.8 })
  return (
    <mesh ref={ref} position={[0, 0.72, 0]}>
      <torusGeometry args={[0.22, 0.022, 6, 32]} />
      <meshStandardMaterial color="#3dd68c" emissive="#3dd68c" emissiveIntensity={0.6} />
    </mesh>
  )
}

// ── Ground disc with range rings + radar sweep ─────────────────────
function GroundDisc() {
  const sweepRef = useRef<THREE.Mesh>(null!)
  const angleRef = useRef(0)

  useFrame((_, dt) => {
    angleRef.current = (angleRef.current + dt * 1.4) % (Math.PI * 2)
    if (sweepRef.current) sweepRef.current.rotation.z = -angleRef.current
  })

  const rings = [
    { r: 0.45, color: '#cc2828' },
    { r: 0.9,  color: '#c07800' },
    { r: 1.35, color: '#2870b0' },
    { r: 1.8,  color: '#2870b0' },
  ]

  return (
    <group position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Base */}
      <mesh>
        <circleGeometry args={[2.15, 64]} />
        <meshStandardMaterial color="#060c16" />
      </mesh>
      {/* Range rings */}
      {rings.map(({ r, color }) => (
        <mesh key={r}>
          <ringGeometry args={[r, r + 0.013, 64]} />
          <meshStandardMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {/* Sweep sector */}
      <mesh ref={sweepRef}>
        <circleGeometry args={[2.15, 48, 0, Math.PI * 0.2]} />
        <meshStandardMaterial color="#3dd68c" transparent opacity={0.07} side={THREE.DoubleSide} />
      </mesh>
      {/* North tick */}
      <mesh position={[0, 1.93, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.01]} />
        <meshStandardMaterial color="#3dd68c" emissive="#3dd68c" emissiveIntensity={0.9} />
      </mesh>
    </group>
  )
}

// ── Armored vehicle hull with tracks ─────────────────────────────
function VehicleHull() {
  const trackX: [number, number][] = [[-0.76, -0.16], [0.76, -0.16]]
  const wheelZ = [-0.7, -0.35, 0, 0.35, 0.7]

  return (
    <group>
      <mesh position={[0, -0.07, 0]}>
        <boxGeometry args={[1.35, 0.28, 1.75]} />
        <meshStandardMaterial color="#0d1e32" metalness={0.75} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.0, 0.82]} rotation={[-0.28, 0, 0]}>
        <boxGeometry args={[1.25, 0.26, 0.28]} />
        <meshStandardMaterial color="#0f2038" metalness={0.7} roughness={0.5} />
      </mesh>
      {trackX.map(([x, y]) => (
        <mesh key={x} position={[x, y, 0]}>
          <boxGeometry args={[0.17, 0.2, 1.82]} />
          <meshStandardMaterial color="#091420" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      {trackX.map(([x]) =>
        wheelZ.map(z => (
          <mesh key={`w${x}${z}`} position={[x, -0.17, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.095, 0.095, 0.13, 8]} />
            <meshStandardMaterial color="#0c1822" metalness={0.85} roughness={0.25} />
          </mesh>
        ))
      )}
    </group>
  )
}

// ── Turret assembly with barrel ───────────────────────────────────
interface SceneProps {
  azimuth: number
  elevation: number
  mode: WeaponMode
  empFireCount: number
  pipelineActive: boolean
  selectedBearing?: number
}

function TurretMesh({ azimuth, elevation, mode, empFireCount, pipelineActive }: SceneProps) {
  const turretRef    = useRef<THREE.Group>(null!)
  const barrelRef    = useRef<THREE.Group>(null!)
  const barrelMatRef = useRef<THREE.MeshStandardMaterial>(null!)
  const glowRef      = useRef<THREE.PointLight>(null!)
  const prevFire     = useRef(empFireCount)
  const flash        = useRef(0)

  const modeHex = MODE_HEX[mode]

  // Sync barrel color when mode changes
  useEffect(() => {
    if (!barrelMatRef.current) return
    const c = new THREE.Color(modeHex)
    barrelMatRef.current.color.copy(c)
    barrelMatRef.current.emissive.copy(c)
  }, [modeHex])

  useFrame((_, dt) => {
    // Smooth azimuth rotation
    const tY = -(azimuth * Math.PI) / 180
    turretRef.current.rotation.y = THREE.MathUtils.lerp(turretRef.current.rotation.y, tY, 0.1)

    // Smooth elevation
    const tX = -(elevation * Math.PI) / 180
    barrelRef.current.rotation.x = THREE.MathUtils.lerp(barrelRef.current.rotation.x, tX, 0.1)

    // EMP flash trigger
    if (empFireCount > prevFire.current) {
      flash.current = 1.0
      prevFire.current = empFireCount
    }
    flash.current = Math.max(0, flash.current - dt * 1.3)

    // Pipeline pulse
    const pulse = pipelineActive ? 0.28 + 0.28 * Math.sin(Date.now() / 190) : 0

    if (glowRef.current)      glowRef.current.intensity    = flash.current * 5.5 + pulse * 1.8
    if (barrelMatRef.current) barrelMatRef.current.emissiveIntensity = 0.22 + flash.current * 0.9 + pulse * 0.55
  })

  return (
    <group ref={turretRef} position={[0, 0.07, 0]}>
      {/* Base ring */}
      <mesh>
        <torusGeometry args={[0.4, 0.065, 8, 32]} />
        <meshStandardMaterial color="#152038" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.34, 0.4, 0.32, 12]} />
        <meshStandardMaterial color="#1a2e4a" metalness={0.65} roughness={0.45} />
      </mesh>
      {/* Radar */}
      <RadarRing />
      {/* Barrel pivot */}
      <group ref={barrelRef} position={[0, 0.25, 0]}>
        <mesh position={[0, 0, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.048, 0.062, 1.1, 8]} />
          <meshStandardMaterial
            ref={barrelMatRef}
            color={modeHex}
            emissive={modeHex}
            emissiveIntensity={0.22}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        {/* Support strut */}
        <mesh position={[0, -0.065, 0.32]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.55, 6]} />
          <meshStandardMaterial color="#182438" metalness={0.8} roughness={0.4} />
        </mesh>
        {/* Muzzle glow point light */}
        <pointLight ref={glowRef} position={[0, 0, 1.2]} color={modeHex} intensity={0} distance={4.5} />
      </group>
    </group>
  )
}

// Threat bearing indicator — rendered in world space, not inside turret group
function ThreatIndicator({ bearing }: { bearing: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(() => {
    if (!ref.current) return
    ref.current.rotation.y += 0.03
  })
  const angle = -(bearing * Math.PI) / 180
  return (
    <mesh
      ref={ref}
      position={[Math.sin(angle) * 1.45, 0.06, Math.cos(angle) * 1.45]}
    >
      <octahedronGeometry args={[0.08, 0]} />
      <meshStandardMaterial color="#f05252" emissive="#f05252" emissiveIntensity={0.9} />
    </mesh>
  )
}

// ── Full 3D scene ─────────────────────────────────────────────────
function Scene(props: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.38} />
      <directionalLight position={[5, 8, 4]} intensity={1.0} color="#8ab8e8" />
      <pointLight position={[-4, 3, -4]} intensity={0.25} color="#1a3560" />
      <GroundDisc />
      <VehicleHull />
      <TurretMesh {...props} />
      {props.selectedBearing !== undefined && (
        <ThreatIndicator bearing={props.selectedBearing} />
      )}
    </>
  )
}

// ── Exported component ────────────────────────────────────────────
export default function TurretView3D(props: SceneProps) {
  return (
    <div style={{ width: '100%', height: 215, background: '#060c18', position: 'relative', flexShrink: 0 }}>
      <Canvas
        camera={{ position: [3.2, 4.2, 3.2], fov: 40, near: 0.1, far: 100 }}
        gl={{ antialias: true }}
        style={{ background: '#060c18' }}
      >
        <Scene {...props} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 8}
          maxPolarAngle={Math.PI / 2.1}
          rotateSpeed={0.55}
        />
      </Canvas>
      <div style={{
        position: 'absolute', bottom: 5, left: 8, right: 8,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 7, color: 'rgba(120,160,200,0.32)',
        letterSpacing: '0.08em', pointerEvents: 'none',
      }}>
        <span>3D TURRET VIEW</span>
        <span>DRAG TO ROTATE</span>
      </div>
    </div>
  )
}
