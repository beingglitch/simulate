// 3D EMP-RCWS — Directed Energy Weapon System (@react-three/fiber)
// Pedestal-mounted phased-array DEW platform — NOT a tank
import { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { WeaponMode } from '../../types'

const MODE_COLOR: Record<WeaponMode, string> = {
  RF_JAM:       '#00D4FF',
  DIRECTED_EMP: '#F5A623',
  KINETIC:      '#FF2020',
}

// ── Ground Plane ─────────────────────────────────────────────────
function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[8, 64]} />
        <meshStandardMaterial color="#0D1A0A" />
      </mesh>
      <gridHelper args={[16, 16, '#1A2818', '#111A0E']} position={[0, -0.015, 0]} />
      {[1.5, 3, 5.5].map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <ringGeometry args={[r - 0.02, r + 0.02, 64]} />
          <meshBasicMaterial
            color={i === 0 ? '#FF2020' : i === 1 ? '#F5A623' : '#00D4FF'}
            transparent
            opacity={i === 0 ? 0.5 : i === 1 ? 0.35 : 0.25}
          />
        </mesh>
      ))}
      <RadarSweep />
    </>
  )
}

function RadarSweep() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.z -= dt * 0.8 })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
      <ringGeometry args={[0, 5.5, 64, 1, 0, 0.8]} />
      <meshBasicMaterial color="#00FF41" transparent opacity={0.18} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ── Wheeled Platform ──────────────────────────────────────────────
// Low-profile tactical vehicle, 4 large wheels, no tracks
function Platform() {
  return (
    <group position={[0, 0, 0]}>
      {/* Main chassis — flat & low */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[2.4, 0.28, 1.1]} />
        <meshStandardMaterial color="#2E3828" roughness={0.85} metalness={0.4} />
      </mesh>
      {/* Underbody clearance frame */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[2.0, 0.1, 0.9]} />
        <meshStandardMaterial color="#253020" roughness={0.9} metalness={0.3} />
      </mesh>
      {/* Rear power module (generator/capacitor bank) */}
      <mesh position={[-0.9, 0.38, 0]}>
        <boxGeometry args={[0.55, 0.38, 0.96]} />
        <meshStandardMaterial color="#1E2A1C" roughness={0.8} metalness={0.5} />
      </mesh>
      {/* Cooling fins on power module */}
      {[-0.35, -0.25, -0.15, -0.05, 0.05, 0.15, 0.25, 0.35].map((z, i) => (
        <mesh key={i} position={[-1.18, 0.44, z]}>
          <boxGeometry args={[0.02, 0.22, 0.06]} />
          <meshStandardMaterial color="#3A4A38" roughness={0.7} metalness={0.7} />
        </mesh>
      ))}
      {/* Electronics bay (front) */}
      <mesh position={[0.75, 0.36, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.9]} />
        <meshStandardMaterial color="#22301E" roughness={0.8} metalness={0.5} />
      </mesh>
      {/* Status indicator light strip on electronics bay */}
      <mesh position={[0.96, 0.42, 0]}>
        <boxGeometry args={[0.02, 0.06, 0.7]} />
        <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={0.4} roughness={0.3} />
      </mesh>

      {/* 4 large wheels (MRAP-style, off-road) */}
      {[
        [0.85,  0.12,  0.68],
        [0.85,  0.12, -0.68],
        [-0.85, 0.12,  0.68],
        [-0.85, 0.12, -0.68],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          {/* Tyre */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.22, 14]} />
            <meshStandardMaterial color="#1A1A18" roughness={0.95} metalness={0.1} />
          </mesh>
          {/* Hub */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.24, 8]} />
            <meshStandardMaterial color="#354030" roughness={0.6} metalness={0.8} />
          </mesh>
          {/* Hub centre bolt */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.26, 6]} />
            <meshStandardMaterial color="#5A6A55" roughness={0.5} metalness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ── Azimuth Ring + DEW Weapon Assembly ───────────────────────────
interface WeaponProps {
  azimuth: number
  elevation: number
  mode: WeaponMode
  isEngaging: boolean
}

function WeaponAssembly({ azimuth, elevation, mode, isEngaging }: WeaponProps) {
  const azGroupRef   = useRef<THREE.Group>(null)
  const elGroupRef   = useRef<THREE.Group>(null)
  const arrayMatRef  = useRef<THREE.MeshStandardMaterial>(null)
  const glowRef      = useRef<THREE.PointLight>(null)

  const targetAz = useRef(azimuth)
  const targetEl = useRef(elevation)

  useEffect(() => { targetAz.current = azimuth  }, [azimuth])
  useEffect(() => { targetEl.current = elevation }, [elevation])

  useEffect(() => {
    const col = new THREE.Color(MODE_COLOR[mode])
    if (arrayMatRef.current) {
      arrayMatRef.current.color.set(col)
      arrayMatRef.current.emissive = col
    }
  }, [mode])

  useFrame((_, dt) => {
    // Azimuth rotation
    if (azGroupRef.current) {
      const rad = -(targetAz.current * Math.PI) / 180
      azGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        azGroupRef.current.rotation.y, rad, dt * 3,
      )
    }
    // Elevation tilt of phased array
    if (elGroupRef.current) {
      const rad = (targetEl.current * Math.PI) / 180
      elGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        elGroupRef.current.rotation.x, -rad * 0.9, dt * 3,
      )
    }
    // Array glow pulse when engaging
    if (arrayMatRef.current) {
      arrayMatRef.current.emissiveIntensity = isEngaging
        ? 0.35 + 0.5 * Math.sin(Date.now() * 0.014)
        : 0.12
    }
    if (glowRef.current) {
      glowRef.current.intensity = isEngaging
        ? 1.8 + Math.sin(Date.now() * 0.012) * 1.0
        : 0.25
    }
  })

  const modeCol = MODE_COLOR[mode]

  return (
    <group ref={azGroupRef} position={[0, 0.55, 0]}>
      {/* ── Azimuth bearing ring ── */}
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.52, 0.56, 0.1, 20]} />
        <meshStandardMaterial color="#2A3828" roughness={0.6} metalness={0.8} />
      </mesh>
      {/* Slip-ring details — 3 thin bands */}
      {[-0.02, 0, 0.02].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[0.545, 0.545, 0.018, 20]} />
          <meshStandardMaterial color="#4A5845" roughness={0.5} metalness={0.9} />
        </mesh>
      ))}

      {/* ── Pedestal column ── */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.56, 12]} />
        <meshStandardMaterial color="#253020" roughness={0.75} metalness={0.6} />
      </mesh>
      {/* Column ribbing */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <mesh key={i} position={[0, 0.28, 0]} rotation={[0, (i * Math.PI) / 3, 0]}>
          <boxGeometry args={[0.02, 0.54, 0.4]} />
          <meshStandardMaterial color="#1E2A1C" roughness={0.8} metalness={0.5} />
        </mesh>
      ))}

      {/* ── Elevation yoke (U-frame) — left arm ── */}
      <mesh position={[0, 0.72, -0.52]}>
        <boxGeometry args={[0.12, 0.52, 0.1]} />
        <meshStandardMaterial color="#2E3828" roughness={0.75} metalness={0.6} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0, 0.72, 0.52]}>
        <boxGeometry args={[0.12, 0.52, 0.1]} />
        <meshStandardMaterial color="#2E3828" roughness={0.75} metalness={0.6} />
      </mesh>
      {/* Elevation pivot axles */}
      {[-0.52, 0.52].map((z, i) => (
        <mesh key={i} position={[0, 0.97, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.14, 10]} />
          <meshStandardMaterial color="#4A5845" roughness={0.5} metalness={0.9} />
        </mesh>
      ))}

      {/* ── Elevation group — phased array tilts here ── */}
      <group ref={elGroupRef} position={[0, 0.97, 0]}>

        {/* ── Main Phased Array Panel ── */}
        {/* Backing frame */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.14, 0.82, 1.08]} />
          <meshStandardMaterial color="#1E281C" roughness={0.8} metalness={0.6} />
        </mesh>
        {/* Array face (forward-facing, emitter grid) */}
        <mesh position={[0.075, 0, 0]}>
          <boxGeometry args={[0.02, 0.76, 1.0]} />
          <meshStandardMaterial
            ref={arrayMatRef}
            color={modeCol}
            emissive={modeCol}
            emissiveIntensity={0.12}
            roughness={0.2}
            metalness={0.9}
          />
        </mesh>
        {/* Grid lines across array face — horizontal ribs */}
        {[-0.28, -0.14, 0, 0.14, 0.28].map((y, i) => (
          <mesh key={i} position={[0.088, y, 0]}>
            <boxGeometry args={[0.01, 0.018, 0.98]} />
            <meshStandardMaterial color="#0A1208" roughness={0.7} />
          </mesh>
        ))}
        {/* Grid lines — vertical ribs */}
        {[-0.4, -0.2, 0, 0.2, 0.4].map((z, i) => (
          <mesh key={i} position={[0.088, 0, z]}>
            <boxGeometry args={[0.01, 0.74, 0.018]} />
            <meshStandardMaterial color="#0A1208" roughness={0.7} />
          </mesh>
        ))}
        {/* Emitter element dots — 5×5 grid */}
        {[-0.28, -0.14, 0, 0.14, 0.28].flatMap((y, yi) =>
          [-0.36, -0.18, 0, 0.18, 0.36].map((z, zi) => (
            <mesh key={`${yi}-${zi}`} position={[0.09, y, z]}>
              <cylinderGeometry args={[0.022, 0.022, 0.01, 8]} rotation={[Math.PI/2, 0, 0]} />
              <meshStandardMaterial
                color={modeCol}
                emissive={modeCol}
                emissiveIntensity={isEngaging ? 0.9 : 0.2}
                roughness={0.2}
                metalness={0.9}
              />
            </mesh>
          ))
        )}

        {/* ── Rear capacitor bank ── */}
        <mesh position={[-0.13, 0, 0]}>
          <boxGeometry args={[0.2, 0.72, 0.96]} />
          <meshStandardMaterial color="#1A2218" roughness={0.85} metalness={0.5} />
        </mesh>
        {/* Capacitor cans — 3×4 grid on rear */}
        {[-0.22, -0.07, 0.07, 0.22].flatMap((z, zi) =>
          [-0.22, 0, 0.22].map((y, yi) => (
            <mesh key={`${zi}-${yi}`} position={[-0.245, y, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.05, 0.05, 0.14, 8]} />
              <meshStandardMaterial color="#2A3828" roughness={0.7} metalness={0.8} />
            </mesh>
          ))
        )}
        {/* Waveguide tube along array edge */}
        <mesh position={[0, -0.44, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.18, 8]} />
          <meshStandardMaterial color="#354030" roughness={0.6} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.44, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.18, 8]} />
          <meshStandardMaterial color="#354030" roughness={0.6} metalness={0.8} />
        </mesh>

        {/* Kinetic mode: compact cannon barrel bolted onto array frame */}
        {mode === 'KINETIC' && (
          <group position={[0.12, 0, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.055, 0.07, 1.4, 12]} />
              <meshStandardMaterial color="#2E3828" roughness={0.7} metalness={0.75} />
            </mesh>
            {/* Muzzle brake */}
            <mesh position={[0.74, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.09, 0.07, 0.1, 10]} />
              <meshStandardMaterial color="#FF2020" emissive="#FF2020" emissiveIntensity={isEngaging ? 0.9 : 0.15} roughness={0.4} metalness={0.8} />
            </mesh>
          </group>
        )}

        {/* Engaging beam effect — line from array face */}
        {isEngaging && mode !== 'KINETIC' && (
          <mesh position={[1.8, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.06, 3.5, 8]} />
            <meshStandardMaterial
              color={modeCol}
              emissive={modeCol}
              emissiveIntensity={1.5}
              transparent
              opacity={0.55}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
        )}
      </group>

      {/* EMP glow point light */}
      <pointLight ref={glowRef} position={[1.5, 0.97, 0]} color={modeCol} intensity={0.25} distance={5} decay={2} />

      {/* ── Sensor mast (fixed, off left shoulder of pedestal) ── */}
      <SensorMast />
    </group>
  )
}

function SensorMast() {
  const dishRef = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => { if (dishRef.current) dishRef.current.rotation.y += dt * 1.8 })
  return (
    <group position={[-0.05, 0.56, -0.38]}>
      {/* Mast tube */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.022, 0.028, 0.84, 8]} />
        <meshStandardMaterial color="#354030" roughness={0.8} metalness={0.7} />
      </mesh>
      {/* Camera pod */}
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[0.14, 0.1, 0.1]} />
        <meshStandardMaterial color="#1A2018" roughness={0.85} metalness={0.5} />
      </mesh>
      {/* Camera lens */}
      <mesh position={[0.075, 0.88, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.025, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={0.5} roughness={0.2} />
      </mesh>
      {/* Mini radar dish */}
      <mesh ref={dishRef} position={[0, 1.06, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.018, 14]} />
        <meshStandardMaterial color="#2E3828" roughness={0.6} metalness={0.85} />
      </mesh>
      <mesh position={[0, 1.07, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.01, 14]} />
        <meshStandardMaterial color="#00FF41" emissive="#00FF41" emissiveIntensity={0.25} roughness={0.4} />
      </mesh>
      {/* GPS stub antenna */}
      <mesh position={[0, 1.16, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.1, 6]} />
        <meshStandardMaterial color="#4A5845" roughness={0.6} metalness={0.8} />
      </mesh>
    </group>
  )
}

// ── Threat indicator ──────────────────────────────────────────────
function ThreatIndicator({ bearing }: { bearing: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 2 })
  const rad = (bearing * Math.PI) / 180
  const x = Math.sin(rad) * 2.8
  const z = -Math.cos(rad) * 2.8
  return (
    <mesh ref={ref} position={[x, 0.1, z]}>
      <octahedronGeometry args={[0.12]} />
      <meshStandardMaterial color="#FF2020" emissive="#FF2020" emissiveIntensity={0.7} />
    </mesh>
  )
}

// ── Scene root ────────────────────────────────────────────────────
interface SceneProps {
  azimuth: number
  elevation: number
  mode: WeaponMode
  isEngaging: boolean
  threatBearings: number[]
}

function Scene({ azimuth, elevation, mode, isEngaging, threatBearings }: SceneProps) {
  return (
    <>
      <ambientLight intensity={1.8} color="#8899AA" />
      <directionalLight position={[4, 6, 4]} intensity={2.5} color="#FFFFFF" castShadow={false} />
      <directionalLight position={[-4, 4, -3]} intensity={1.2} color="#AAC8FF" />
      <pointLight position={[0, 5, 0]} intensity={2.0} color="#FFFFFF" />
      <pointLight position={[2, 2, 3]} intensity={1.0} color="#F5A623" />
      <pointLight position={[-2, 2, -2]} intensity={0.8} color="#00D4FF" />

      <Ground />
      <Platform />
      <WeaponAssembly azimuth={azimuth} elevation={elevation} mode={mode} isEngaging={isEngaging} />

      {threatBearings.map((b, i) => (
        <ThreatIndicator key={i} bearing={b} />
      ))}
    </>
  )
}

// ── Export ────────────────────────────────────────────────────────
interface TurretView3DProps {
  azimuth: number
  elevation: number
  mode: WeaponMode
  isEngaging: boolean
  threatBearings: number[]
  fill?: boolean
}

export default function TurretView3D({ fill = false, ...props }: TurretView3DProps) {
  return (
    <div style={{ height: fill ? '100%' : 220, width: '100%', background: '#000', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 6, left: 10, fontSize: 10,
        color: '#555', letterSpacing: '0.12em', zIndex: 1, pointerEvents: 'none',
      }}>
        EMP-RCWS · 3D VIEW · DRAG TO ROTATE
      </div>
      <Canvas
        camera={{ position: [3.5, 2.8, 3.5], fov: 38, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#000' }}
      >
        <Scene {...props} />
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={false}
        />
      </Canvas>
    </div>
  )
}
