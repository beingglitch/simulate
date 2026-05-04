  // 3D EMP-RCWS — Multi-Mission Counter-UAS Platform
  // 4 distinct subsystems permanently mounted on HEMTT tactical vehicle:
  //   DETECTOR SUITE · EMP EMITTER · RF JAMMER · KINETIC CANNON
  import { useRef, useEffect } from 'react'
  import { Canvas, useFrame } from '@react-three/fiber'
  import { OrbitControls } from '@react-three/drei'
  import * as THREE from 'three'
  import type { WeaponMode } from '../../types'

  const EMP_COL = '#F5A623'
  const RF_COL  = '#00D4FF'
  const KIN_COL = '#FF2020'
  const DET_COL = '#00FF41'

  // ── Ground ─────────────────────────────────────────────────────────
  function Ground() {
    return (
      <>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <circleGeometry args={[10, 64]} />
          <meshStandardMaterial color="#080D06" />
        </mesh>
        <gridHelper args={[20, 28, '#10160D', '#090E08']} position={[0, -0.015, 0]} />
        {[1.4, 3.2, 5.8].map((r, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <ringGeometry args={[r - 0.025, r + 0.025, 80]} />
            <meshBasicMaterial
              color={i === 0 ? '#FF2020' : i === 1 ? '#F5A623' : '#00D4FF'}
              transparent opacity={i === 0 ? 0.5 : i === 1 ? 0.35 : 0.2}
            />
          </mesh>
        ))}
        {[45, 135, 225, 315].map((deg, i) => {
          const r = (deg * Math.PI) / 180
          return (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}
              position={[Math.sin(r) * 1.3, -0.008, -Math.cos(r) * 1.3]}>
              <ringGeometry args={[0.07, 0.11, 4]} />
              <meshBasicMaterial color="#F5A623" transparent opacity={0.4} />
            </mesh>
          )
        })}
        <RadarSweep />
      </>
    )
  }

  function RadarSweep() {
    const ref = useRef<THREE.Mesh>(null)
    useFrame((_, dt) => { if (ref.current) ref.current.rotation.z -= dt * 0.72 })
    return (
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <ringGeometry args={[0, 5.8, 64, 1, 0, 0.75]} />
        <meshBasicMaterial color="#00FF41" transparent opacity={0.11} side={THREE.DoubleSide} />
      </mesh>
    )
  }

  // ── HEMTT / FMTV tactical truck ────────────────────────────────────
  function Platform() {
    return (
      <group>
        {/* Chassis rails */}
        {([-0.52, 0.52] as number[]).map((z, i) => (
          <mesh key={i} position={[0, 0.12, z]}>
            <boxGeometry args={[3.3, 0.09, 0.11]} />
            <meshStandardMaterial color="#1A2418" roughness={0.9} metalness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[3.1, 0.12, 1.28]} />
          <meshStandardMaterial color="#1E2A1C" roughness={0.88} metalness={0.45} />
        </mesh>
        {/* Armored cab */}
        <mesh position={[1.1, 0.29, 0]}>
          <boxGeometry args={[1.0, 0.3, 1.26]} />
          <meshStandardMaterial color="#263222" roughness={0.85} metalness={0.45} />
        </mesh>
        <mesh position={[1.05, 0.56, 0]}>
          <boxGeometry args={[0.82, 0.38, 1.12]} />
          <meshStandardMaterial color="#1E2A1C" roughness={0.85} metalness={0.45} />
        </mesh>
        {/* Windshield */}
        <mesh position={[1.43, 0.56, 0]}>
          <boxGeometry args={[0.045, 0.28, 0.92]} />
          <meshStandardMaterial color="#1A2A3A" roughness={0.05} metalness={0.85} transparent opacity={0.62} />
        </mesh>
        {/* Front bumper */}
        <mesh position={[1.6, 0.22, 0]}>
          <boxGeometry args={[0.07, 0.24, 1.22]} />
          <meshStandardMaterial color="#2A3626" roughness={0.7} metalness={0.7} />
        </mesh>
        {/* Cab status light */}
        <mesh position={[1.04, 0.77, 0]}>
          <boxGeometry args={[0.52, 0.036, 0.055]} />
          <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={0.5} roughness={0.3} />
        </mesh>
        {/* Cab antenna */}
        <mesh position={[0.9, 0.84, 0.4]}>
          <cylinderGeometry args={[0.009, 0.009, 0.24, 6]} />
          <meshStandardMaterial color="#4A5845" roughness={0.6} metalness={0.8} />
        </mesh>
        {/* Weapon bed */}
        <mesh position={[-0.45, 0.28, 0]}>
          <boxGeometry args={[1.85, 0.22, 1.26]} />
          <meshStandardMaterial color="#263222" roughness={0.85} metalness={0.45} />
        </mesh>
        {([-0.58, 0.58] as number[]).map((z, i) => (
          <mesh key={i} position={[-0.45, 0.41, z]}>
            <boxGeometry args={[1.75, 0.035, 0.04]} />
            <meshStandardMaterial color="#344030" roughness={0.7} metalness={0.8} />
          </mesh>
        ))}
        {/* Side armor slats */}
        {([-1, 1] as number[]).map((s, i) => (
          <group key={i}>
            <mesh position={[0.1, 0.3, s * 0.73]}>
              <boxGeometry args={[2.8, 0.3, 0.055]} />
              <meshStandardMaterial color="#212C1E" roughness={0.88} metalness={0.48} />
            </mesh>
            {[-1.05, -0.55, -0.05, 0.45, 0.95].map((x, j) => (
              <mesh key={j} position={[x, 0.36, s * 0.76]}>
                <boxGeometry args={[0.42, 0.18, 0.03]} />
                <meshStandardMaterial color="#1C2818" roughness={0.9} metalness={0.42} />
              </mesh>
            ))}
          </group>
        ))}
        {/* APU housing + exhaust */}
        <mesh position={[-1.38, 0.33, 0]}>
          <boxGeometry args={[0.52, 0.3, 1.18]} />
          <meshStandardMaterial color="#1C2618" roughness={0.8} metalness={0.5} />
        </mesh>
        {[-0.42, -0.28, -0.14, 0, 0.14, 0.28, 0.42].map((z, i) => (
          <mesh key={i} position={[-1.66, 0.37, z]}>
            <boxGeometry args={[0.022, 0.19, 0.06]} />
            <meshStandardMaterial color="#293825" roughness={0.62} metalness={0.72} />
          </mesh>
        ))}
        <mesh position={[-1.48, 0.7, -0.44]}>
          <cylinderGeometry args={[0.033, 0.039, 0.65, 8]} />
          <meshStandardMaterial color="#2A2820" roughness={0.88} metalness={0.72} />
        </mesh>
        <mesh position={[-1.48, 1.04, -0.44]}>
          <cylinderGeometry args={[0.043, 0.033, 0.06, 8]} />
          <meshStandardMaterial color="#1A1810" roughness={0.8} metalness={0.8} />
        </mesh>
        {/* 6 wheels */}
        {([
          [ 0.92, 0.17,  0.78], [ 0.92, 0.17, -0.78],
          [ 0.02, 0.17,  0.78], [ 0.02, 0.17, -0.78],
          [-0.88, 0.17,  0.78], [-0.88, 0.17, -0.78],
        ] as [number,number,number][]).map(([x,y,z], i) => (
          <group key={i} position={[x, y, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.26, 0.26, 0.22, 14]} />
              <meshStandardMaterial color="#181916" roughness={0.96} metalness={0.1} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.14, 0.14, 0.24, 8]} />
              <meshStandardMaterial color="#2C3828" roughness={0.62} metalness={0.82} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.04, 0.04, 0.26, 6]} />
              <meshStandardMaterial color="#4A5845" roughness={0.5} metalness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
    )
  }

  // ── Shared FX ──────────────────────────────────────────────────────
  function ElectricArcs({ color }: { color: string }) {
    const refs = useRef<(THREE.Mesh | null)[]>([])
    useFrame(() => {
      refs.current.forEach((m, i) => {
        if (!m) return
        const t = Date.now() * 0.001
        m.rotation.x = Math.sin(t * 7 + i * 1.2) * 0.6
        m.rotation.z = Math.cos(t * 5 + i * 0.9) * 0.5
        ;(m.material as THREE.MeshStandardMaterial).opacity =
          0.15 + Math.abs(Math.sin(t * 11 + i * 2.1)) * 0.55
      })
    })
    return (
      <group position={[0.11, 0, 0]}>
        {[...Array(8)].map((_, i) => (
          <mesh key={i} ref={el => { refs.current[i] = el }}
            position={[0, (i - 3.5) * 0.11, ((i % 3) - 1) * 0.2]}>
            <boxGeometry args={[0.2, 0.007, 0.007]} />
            <meshStandardMaterial color={color} emissive={color}
              emissiveIntensity={2.5} transparent opacity={0.5} roughness={0} metalness={1} />
          </mesh>
        ))}
      </group>
    )
  }

  function PulseRings({ color }: { color: string }) {
    const r1 = useRef<THREE.Mesh>(null), r2 = useRef<THREE.Mesh>(null), r3 = useRef<THREE.Mesh>(null)
    const rings = [r1, r2, r3]
    useFrame(() => {
      rings.forEach((ref, i) => {
        if (!ref.current) return
        const t = ((Date.now() * 0.001 * 0.9 + i * 0.33) % 1)
        const s = 0.5 + t * 2.5
        ref.current.scale.set(s, s, 1)
        ;(ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.5
      })
    })
    return (
      <group position={[0.13, 0, 0]}>
        {rings.map((ref, i) => (
          <mesh key={i} ref={ref}>
            <ringGeometry args={[0.3, 0.33, 32]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    )
  }

  // ─────────────────────────────────────────────────────────────────
  // SYSTEM 1 — DETECTOR SUITE
  // Tall multi-sensor mast: tracking radar + FLIR ball + ESM blades
  // Always active / always scanning. Located at rear of bed.
  // ─────────────────────────────────────────────────────────────────
  function DetectorSuite({ position }: { position: [number,number,number] }) {
    const dishRef = useRef<THREE.Mesh>(null)
    const dish2Ref = useRef<THREE.Mesh>(null)
    const flirRef = useRef<THREE.Group>(null)
    const blinkRef = useRef<THREE.Mesh>(null)

    useFrame((_, dt) => {
      if (dishRef.current)  dishRef.current.rotation.y  += dt * 2.2
      if (dish2Ref.current) dish2Ref.current.rotation.y -= dt * 0.9
      if (flirRef.current)  flirRef.current.rotation.y  += dt * 0.18
      if (blinkRef.current) {
        ;(blinkRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
          0.5 + 0.5 * Math.abs(Math.sin(Date.now() * 0.004))
      }
    })

    return (
      <group position={position}>
        {/* Base equipment box */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.22, 0.2, 0.22]} />
          <meshStandardMaterial color="#1E2A1C" roughness={0.8} metalness={0.6} />
        </mesh>
        {/* Main mast */}
        <mesh position={[0, 0.78, 0]}>
          <cylinderGeometry args={[0.022, 0.03, 1.35, 8]} />
          <meshStandardMaterial color="#2E3C2A" roughness={0.78} metalness={0.78} />
        </mesh>
        {/* Mid collar + bracket */}
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.06, 8]} />
          <meshStandardMaterial color="#3A4A36" roughness={0.68} metalness={0.85} />
        </mesh>
        <mesh position={[0.1, 0.72, 0]}>
          <boxGeometry args={[0.18, 0.05, 0.06]} />
          <meshStandardMaterial color="#2A3A28" roughness={0.72} metalness={0.75} />
        </mesh>

        {/* IFF transponder pod */}
        <mesh position={[0.12, 0.55, 0]}>
          <boxGeometry args={[0.16, 0.08, 0.1]} />
          <meshStandardMaterial color="#1A2218" roughness={0.82} metalness={0.6} />
        </mesh>

        {/* ESM / RWR blade antennas */}
        {[0, Math.PI/2, Math.PI, Math.PI*3/2].map((rot, i) => (
          <mesh key={i} position={[Math.sin(rot)*0.09, 0.9, Math.cos(rot)*0.09]}>
            <boxGeometry args={[0.015, 0.1, 0.007]} />
            <meshStandardMaterial color="#384832" roughness={0.72} metalness={0.82} />
          </mesh>
        ))}

        {/* Lower tracking radar (fast spin) */}
        <mesh ref={dishRef} position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.022, 16]} />
          <meshStandardMaterial color="#2A3624" roughness={0.52} metalness={0.9} />
        </mesh>
        <mesh position={[0, 1.013, 0]}>
          <cylinderGeometry args={[0.135, 0.135, 0.012, 16]} />
          <meshStandardMaterial color={DET_COL} emissive={DET_COL} emissiveIntensity={0.35} roughness={0.4} />
        </mesh>

        {/* Upper phased-array sensor (slow reverse spin) */}
        <mesh ref={dish2Ref} position={[0, 1.22, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.018, 12]} />
          <meshStandardMaterial color="#253020" roughness={0.55} metalness={0.88} />
        </mesh>
        <mesh position={[0, 1.23, 0]}>
          <cylinderGeometry args={[0.085, 0.085, 0.01, 12]} />
          <meshStandardMaterial color={RF_COL} emissive={RF_COL} emissiveIntensity={0.28} roughness={0.4} />
        </mesh>

        {/* FLIR / EO ball turret */}
        <group ref={flirRef} position={[0, 1.38, 0]}>
          <mesh>
            <sphereGeometry args={[0.095, 14, 14]} />
            <meshStandardMaterial color="#151A14" roughness={0.2} metalness={0.9} />
          </mesh>
          <mesh position={[0.09, 0, 0]} rotation={[0, Math.PI/2, 0]}>
            <cylinderGeometry args={[0.038, 0.038, 0.018, 12]} />
            <meshStandardMaterial color={RF_COL} emissive={RF_COL} emissiveIntensity={0.45} roughness={0.08} />
          </mesh>
          <mesh position={[0.084, 0, 0]} rotation={[0, Math.PI/2, 0]}>
            <cylinderGeometry args={[0.046, 0.046, 0.01, 12]} />
            <meshStandardMaterial color="#2A3828" roughness={0.55} metalness={0.88} />
          </mesh>
        </group>

        {/* GPS / SATCOM top stub */}
        <mesh position={[0, 1.52, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.24, 6]} />
          <meshStandardMaterial color="#4A5845" roughness={0.6} metalness={0.8} />
        </mesh>

        {/* Status blink */}
        <mesh ref={blinkRef} position={[0.034, 0.62, 0]}>
          <sphereGeometry args={[0.012, 6, 6]} />
          <meshStandardMaterial color={DET_COL} emissive={DET_COL} emissiveIntensity={0.8} />
        </mesh>

        {/* "DETECT" label panel */}
        <mesh position={[0.13, 0.22, 0]}>
          <boxGeometry args={[0.02, 0.08, 0.16]} />
          <meshStandardMaterial color={DET_COL} emissive={DET_COL} emissiveIntensity={0.25} roughness={0.4} />
        </mesh>
      </group>
    )
  }

  // ─────────────────────────────────────────────────────────────────
  // SYSTEM 2 — EMP EMITTER  (DIRECTED_EMP mode)
  // Wide phased-array panel on elevation yoke + capacitor bank.
  // ─────────────────────────────────────────────────────────────────
  interface ActiveProps {
    azimuth: number
    elevation: number
    active: boolean
    isEngaging: boolean
    position: [number,number,number]
  }

  function EMPEmitter({ azimuth, elevation, active, isEngaging, position }: ActiveProps) {
    const azRef      = useRef<THREE.Group>(null)
    const elRef      = useRef<THREE.Group>(null)
    const matRef     = useRef<THREE.MeshStandardMaterial>(null)
    const glowRef    = useRef<THREE.PointLight>(null)
    const capGlowRef = useRef<THREE.MeshStandardMaterial>(null)
    const sweepRef   = useRef<THREE.Mesh>(null)
    const chargeProgress = useRef(0)
    const tAz = useRef(azimuth), tEl = useRef(elevation)

    useEffect(() => { tAz.current = azimuth  }, [azimuth])
    useEffect(() => { tEl.current = elevation }, [elevation])

    useFrame((_, dt) => {
      const t = Date.now() * 0.001
      const hasTarget = Math.abs(tAz.current) > 2

      // Azimuth: idle scan when active + no target; track when target present
      if (azRef.current && active) {
        if (!isEngaging && !hasTarget) {
          // Slow left-right surveillance scan ±25°
          const scan = Math.sin(t * 0.28) * 0.44
          azRef.current.rotation.y = THREE.MathUtils.lerp(azRef.current.rotation.y, scan, dt * 0.9)
        } else {
          const rad = -(tAz.current * Math.PI) / 180
          azRef.current.rotation.y = THREE.MathUtils.lerp(azRef.current.rotation.y, rad, dt * 3)
        }
      }
      // Elevation
      if (elRef.current && active) {
        const rad = (tEl.current * Math.PI) / 180
        elRef.current.rotation.x = THREE.MathUtils.lerp(elRef.current.rotation.x, -rad * 0.9, dt * 3)
      }
      // Array face emissive
      if (matRef.current) {
        matRef.current.emissiveIntensity = active
          ? isEngaging
            ? 0.55 + 0.45 * Math.abs(Math.sin(t * 16))
            : 0.08 + 0.05 * Math.sin(t * 0.8)
          : 0.02
      }
      // Capacitor bank pulse: slow idle charge glow, rapid when engaging
      if (capGlowRef.current) {
        capGlowRef.current.emissiveIntensity = active
          ? isEngaging
            ? 0.18 + 0.22 * Math.abs(Math.sin(t * 14))
            : 0.04 + 0.04 * Math.abs(Math.sin(t * 1.2))
          : 0
        capGlowRef.current.opacity = active ? (isEngaging ? 0.22 : 0.06) : 0
      }
      // Charge sweep: animates up the array face when engaging starts
      if (sweepRef.current) {
        if (isEngaging) {
          chargeProgress.current = Math.min(chargeProgress.current + dt * 1.4, 1)
        } else {
          chargeProgress.current = Math.max(chargeProgress.current - dt * 3, 0)
        }
        const p = chargeProgress.current
        sweepRef.current.position.y = -0.5 + p * 1.0
        sweepRef.current.visible = active && p > 0
        ;(sweepRef.current.material as THREE.MeshBasicMaterial).opacity = isEngaging
          ? 0.55 * Math.abs(Math.sin(p * Math.PI))
          : p * 0.3
      }
      // Glow light
      if (glowRef.current) {
        glowRef.current.intensity = isEngaging
          ? 2.8 + Math.sin(t * 13) * 1.3
          : active ? 0.2 + 0.1 * Math.sin(t * 2) : 0
      }
    })

    const col = active ? EMP_COL : '#3A2E18'

    return (
      <group position={position}>
        <group ref={azRef}>
          {/* Azimuth bearing ring */}
          <mesh>
            <cylinderGeometry args={[0.52, 0.58, 0.09, 22]} />
            <meshStandardMaterial color="#2A3828" roughness={0.6} metalness={0.82} />
          </mesh>
          {[...Array(10)].map((_, i) => {
            const a = (i/10)*Math.PI*2
            return (
              <mesh key={i} position={[Math.cos(a)*0.54, 0.06, Math.sin(a)*0.54]}>
                <cylinderGeometry args={[0.014, 0.014, 0.04, 6]} />
                <meshStandardMaterial color="#4A5845" roughness={0.5} metalness={0.92} />
              </mesh>
            )
          })}
          {/* Pedestal column */}
          <mesh position={[0, 0.38, 0]}>
            <boxGeometry args={[0.28, 0.76, 0.28]} />
            <meshStandardMaterial color="#222E20" roughness={0.75} metalness={0.65} />
          </mesh>
          {/* Corner gussets */}
          {([-1,1] as number[]).flatMap(sx =>
            ([-1,1] as number[]).map((sz, j) => (
              <mesh key={`${sx}${j}`} position={[sx*0.155, 0.38, sz*0.155]} rotation={[0, Math.PI/4, 0]}>
                <boxGeometry args={[0.04, 0.72, 0.04]} />
                <meshStandardMaterial color="#324030" roughness={0.72} metalness={0.78} />
              </mesh>
            ))
          )}
          {/* Yoke arms */}
          {([-0.68, 0.68] as number[]).map((z, i) => (
            <group key={i}>
              <mesh position={[0, 0.82, z]}>
                <boxGeometry args={[0.13, 0.68, 0.11]} />
                <meshStandardMaterial color="#2E3828" roughness={0.75} metalness={0.65} />
              </mesh>
              <mesh position={[0, 1.14, z]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.062, 0.062, 0.15, 10]} />
                <meshStandardMaterial color="#4C5A48" roughness={0.48} metalness={0.92} />
              </mesh>
            </group>
          ))}
          {/* Hydraulic cylinders */}
          {([-0.32, 0.32] as number[]).map((z, i) => (
            <group key={i}>
              <mesh position={[-0.1, 0.88, z]} rotation={[0, 0, -0.45]}>
                <cylinderGeometry args={[0.024, 0.024, 0.34, 8]} />
                <meshStandardMaterial color="#3A4A35" roughness={0.62} metalness={0.82} />
              </mesh>
              <mesh position={[0.06, 1.02, z]} rotation={[0, 0, -0.45]}>
                <cylinderGeometry args={[0.016, 0.016, 0.22, 8]} />
                <meshStandardMaterial color="#6A8060" roughness={0.35} metalness={0.95} />
              </mesh>
            </group>
          ))}
          {/* Glow light */}
          <pointLight ref={glowRef} position={[1.8, 1.14, 0]} color={EMP_COL} intensity={0} distance={7} decay={2} />

          {/* Elevation group */}
          <group ref={elRef} position={[0, 1.14, 0]}>
            {/* Backing frame */}
            <mesh>
              <boxGeometry args={[0.18, 1.05, 1.48]} />
              <meshStandardMaterial color="#192318" roughness={0.82} metalness={0.65} />
            </mesh>
            {/* Cooling fins top/bottom */}
            {([-0.54, 0.54] as number[]).flatMap((y, yi) =>
              [-0.56, -0.28, 0, 0.28, 0.56].map((z, zi) => (
                <mesh key={`f${yi}${zi}`} position={[0, y, z]}>
                  <boxGeometry args={[0.35, 0.042, 0.07]} />
                  <meshStandardMaterial color="#2C3C28" roughness={0.62} metalness={0.72} />
                </mesh>
              ))
            )}
            {/* Side waveguide manifold */}
            <mesh position={[0, 0, 0.79]}>
              <boxGeometry args={[0.15, 1.0, 0.1]} />
              <meshStandardMaterial color="#1C2C18" roughness={0.82} metalness={0.65} />
            </mesh>
            {[-0.36, -0.18, 0, 0.18, 0.36].map((y, i) => (
              <mesh key={i} position={[0.02, y, 0.85]}>
                <boxGeometry args={[0.09, 0.04, 0.045]} />
                <meshStandardMaterial color="#324E2A" roughness={0.62} metalness={0.82} />
              </mesh>
            ))}
            {/* Array face */}
            <mesh position={[0.1, 0, 0]}>
              <boxGeometry args={[0.026, 1.0, 1.4]} />
              <meshStandardMaterial ref={matRef} color={col} emissive={col}
                emissiveIntensity={0.025} roughness={0.12} metalness={0.96} />
            </mesh>
            {/* Grid dividers */}
            {[-0.36, -0.12, 0.12, 0.36].map((y, i) => (
              <mesh key={`gy${i}`} position={[0.114, y, 0]}>
                <boxGeometry args={[0.012, 0.022, 1.37]} />
                <meshStandardMaterial color="#060C05" roughness={0.88} />
              </mesh>
            ))}
            {[-0.56, -0.28, 0, 0.28, 0.56].map((z, i) => (
              <mesh key={`gz${i}`} position={[0.114, 0, z]}>
                <boxGeometry args={[0.012, 0.98, 0.022]} />
                <meshStandardMaterial color="#060C05" roughness={0.88} />
              </mesh>
            ))}
            {/* Horn emitter modules 4×5 */}
            {([-0.33, -0.11, 0.11, 0.33] as number[]).flatMap((y, yi) =>
              ([-0.52, -0.26, 0, 0.26, 0.52] as number[]).map((z, zi) => (
                <group key={`h${yi}${zi}`} position={[0.115, y, z]}>
                  <mesh>
                    <boxGeometry args={[0.045, 0.088, 0.13]} />
                    <meshStandardMaterial color="#0A1209" roughness={0.76} metalness={0.62} />
                  </mesh>
                  <mesh position={[0.036, 0, 0]}>
                    <boxGeometry args={[0.012, 0.066, 0.1]} />
                    <meshStandardMaterial color={col} emissive={col}
                      emissiveIntensity={isEngaging && active ? 1.5 : active ? 0.22 : 0.04}
                      roughness={0.08} metalness={0.96} />
                  </mesh>
                </group>
              ))
            )}
            {/* Charge sweep line — sweeps up array face during engagement */}
            <mesh ref={sweepRef} position={[0.105, -0.5, 0]} visible={false}>
              <boxGeometry args={[0.03, 0.06, 1.38]} />
              <meshBasicMaterial color={EMP_COL} transparent opacity={0} />
            </mesh>

            {/* Rear capacitor bank */}
            <mesh position={[-0.19, 0, 0]}>
              <boxGeometry args={[0.26, 0.98, 1.4]} />
              <meshStandardMaterial color="#141C12" roughness={0.9} metalness={0.52} />
            </mesh>
            {/* Capacitor glow overlay — pulses with charge state */}
            <mesh position={[-0.19, 0, 0]}>
              <boxGeometry args={[0.27, 0.99, 1.41]} />
              <meshStandardMaterial
                ref={capGlowRef}
                color={EMP_COL} emissive={EMP_COL}
                emissiveIntensity={0} transparent opacity={0}
                roughness={0.1} side={THREE.FrontSide}
              />
            </mesh>
            {([-0.24, -0.08, 0.08, 0.24] as number[]).flatMap((z, zi) =>
              ([-0.32, -0.16, 0, 0.16, 0.32] as number[]).map((y, yi) => (
                <mesh key={`c${zi}${yi}`} position={[-0.32, y, z]} rotation={[0, 0, Math.PI/2]}>
                  <cylinderGeometry args={[0.048, 0.048, 0.13, 8]} />
                  <meshStandardMaterial color="#253022" roughness={0.7} metalness={0.88} />
                </mesh>
              ))
            )}
            {/* FX */}
            {active && isEngaging && <ElectricArcs color={EMP_COL} />}
            {active && isEngaging && <PulseRings color={EMP_COL} />}
            {active && isEngaging && (
              <>
                <mesh position={[2.0, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                  <cylinderGeometry args={[0.012, 0.038, 4.0, 8]} />
                  <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={3.5}
                    transparent opacity={0.92} roughness={0} metalness={1} />
                </mesh>
                <mesh position={[2.0, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                  <cylinderGeometry args={[0.05, 0.18, 4.0, 12]} />
                  <meshStandardMaterial color={EMP_COL} emissive={EMP_COL} emissiveIntensity={1.8}
                    transparent opacity={0.25} roughness={0.08} side={THREE.FrontSide} />
                </mesh>
              </>
            )}
          </group>
        </group>
      </group>
    )
  }

  // ─────────────────────────────────────────────────────────────────
  // SYSTEM 3 — RF JAMMER  (RF_JAM mode)
  // 4-horn waveguide jamming array on compact azimuth mount.
  // Looks nothing like the EMP array — no elevation, different silhouette.
  // ─────────────────────────────────────────────────────────────────
  interface RFJammerProps {
    azimuth: number
    active: boolean
    isEngaging: boolean
    position: [number,number,number]
  }

  function RFJammer({ azimuth, active, isEngaging, position }: RFJammerProps) {
    const azRef   = useRef<THREE.Group>(null)
    const tAz     = useRef(azimuth)
    const glowRef = useRef<THREE.PointLight>(null)

    useEffect(() => { tAz.current = azimuth }, [azimuth])

    useFrame((_, dt) => {
      if (azRef.current && active) {
        const rad = -(tAz.current * Math.PI) / 180
        azRef.current.rotation.y = THREE.MathUtils.lerp(azRef.current.rotation.y, rad, dt * 3)
      }
      if (glowRef.current) {
        glowRef.current.intensity = isEngaging && active
          ? 1.6 + Math.sin(Date.now() * 0.018) * 0.7
          : 0
      }
    })

    const col = active ? RF_COL : '#0A1E24'

    return (
      <group position={position}>
        {/* Azimuth ring (smaller than EMP) */}
        <mesh>
          <cylinderGeometry args={[0.28, 0.32, 0.08, 18]} />
          <meshStandardMaterial color="#2A3828" roughness={0.65} metalness={0.82} />
        </mesh>
        <group ref={azRef}>
          {/* Short body column */}
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.22, 0.28, 0.22]} />
            <meshStandardMaterial color="#1E2A1C" roughness={0.8} metalness={0.6} />
          </mesh>
          {/* Main transmitter housing */}
          <mesh position={[0.05, 0.42, 0]}>
            <boxGeometry args={[0.3, 0.32, 0.5]} />
            <meshStandardMaterial color="#1C2818" roughness={0.82} metalness={0.58} />
          </mesh>
          {/* Rear cooling fins on housing */}
          {[-0.18, -0.06, 0.06, 0.18].map((z, i) => (
            <mesh key={i} position={[-0.12, 0.42, z]}>
              <boxGeometry args={[0.04, 0.28, 0.04]} />
              <meshStandardMaterial color="#2A3828" roughness={0.62} metalness={0.72} />
            </mesh>
          ))}
          {/* Status LED strip on housing */}
          <mesh position={[0.21, 0.55, 0]}>
            <boxGeometry args={[0.02, 0.04, 0.44]} />
            <meshStandardMaterial color={col} emissive={col}
              emissiveIntensity={active ? 0.55 : 0.05} roughness={0.3} />
          </mesh>
          {/* Power cable from housing top */}
          <mesh position={[0, 0.6, -0.2]} rotation={[Math.PI/6, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.18, 6]} />
            <meshStandardMaterial color="#1A2018" roughness={0.85} metalness={0.5} />
          </mesh>

          {/* 4 waveguide horn antennas — 2×2 grid, pointing +X */}
          {([[-0.14, 0.14], [-0.14, -0.14], [0.14, 0.14], [0.14, -0.14]] as [number,number][]).map(([y, z], i) => (
            <group key={i} position={[0.2, 0.42 + y, z]}>
              {/* Horn body */}
              <mesh>
                <boxGeometry args={[0.22, 0.16, 0.19]} />
                <meshStandardMaterial color="#162018" roughness={0.8} metalness={0.62} />
              </mesh>
              {/* Taper shroud (outer flare) */}
              <mesh position={[0.14, 0, 0]}>
                <boxGeometry args={[0.06, 0.2, 0.24]} />
                <meshStandardMaterial color="#1A2A1E" roughness={0.78} metalness={0.6} />
              </mesh>
              {/* Aperture face */}
              <mesh position={[0.18, 0, 0]}>
                <boxGeometry args={[0.012, 0.15, 0.19]} />
                <meshStandardMaterial color={col} emissive={col}
                  emissiveIntensity={isEngaging && active ? 1.8 : active ? 0.35 : 0.04}
                  roughness={0.06} metalness={0.96} />
              </mesh>
              {/* Waveguide collar ring */}
              <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.1, 0.1, 0.022, 12]} />
                <meshStandardMaterial color="#2E3E2A" roughness={0.62} metalness={0.78} />
              </mesh>
            </group>
          ))}

          {/* Jammer beam (wide-angle, no inner core) */}
          {active && isEngaging && (
            <>
              <mesh position={[1.0, 0.42, 0]} rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.06, 0.28, 2.0, 10]} />
                <meshStandardMaterial color={RF_COL} emissive={RF_COL} emissiveIntensity={1.2}
                  transparent opacity={0.22} roughness={0.08} side={THREE.FrontSide} />
              </mesh>
              {/* Pulse rings */}
              <group position={[0.3, 0.42, 0]}>
                <PulseRings color={RF_COL} />
              </group>
            </>
          )}
          <pointLight ref={glowRef} position={[1.0, 0.42, 0]} color={RF_COL} intensity={0} distance={5} decay={2} />
        </group>
      </group>
    )
  }

  // ─────────────────────────────────────────────────────────────────
  // SYSTEM 4 — KINETIC CANNON  (KINETIC mode)
  // Compact 3-barrel rotary autocannon on independent azimuth/elevation
  // turret. Completely different silhouette from EMP array.
  // ─────────────────────────────────────────────────────────────────
  function KineticCannon({ azimuth, elevation, active, isEngaging, position }: ActiveProps) {
    const azRef      = useRef<THREE.Group>(null)
    const elRef      = useRef<THREE.Group>(null)
    const barrelRef  = useRef<THREE.Group>(null)
    const muzzleRef  = useRef<THREE.PointLight>(null)
    const tAz = useRef(azimuth), tEl = useRef(elevation)

    useEffect(() => { tAz.current = azimuth  }, [azimuth])
    useEffect(() => { tEl.current = elevation }, [elevation])

    useFrame((_, dt) => {
      if (azRef.current && active) {
        const rad = -(tAz.current * Math.PI) / 180
        azRef.current.rotation.y = THREE.MathUtils.lerp(azRef.current.rotation.y, rad, dt * 3)
      }
      if (elRef.current && active) {
        const rad = (tEl.current * Math.PI) / 180
        elRef.current.rotation.x = THREE.MathUtils.lerp(elRef.current.rotation.x, -rad * 0.9, dt * 3)
      }
      if (barrelRef.current && isEngaging && active) {
        barrelRef.current.rotation.x += dt * 18
      }
      if (muzzleRef.current) {
        muzzleRef.current.intensity = isEngaging && active
          ? 1.2 + Math.abs(Math.sin(Date.now() * 0.03)) * 2.5
          : 0
      }
    })

    return (
      <group position={position}>
        {/* Azimuth bearing ring (compact) */}
        <mesh>
          <cylinderGeometry args={[0.3, 0.34, 0.08, 20]} />
          <meshStandardMaterial color="#2A3828" roughness={0.62} metalness={0.82} />
        </mesh>
        {[...Array(8)].map((_, i) => {
          const a = (i/8)*Math.PI*2
          return (
            <mesh key={i} position={[Math.cos(a)*0.31, 0.06, Math.sin(a)*0.31]}>
              <cylinderGeometry args={[0.013, 0.013, 0.04, 6]} />
              <meshStandardMaterial color="#4A5845" roughness={0.5} metalness={0.9} />
            </mesh>
          )
        })}
        <group ref={azRef}>
          {/* Short angular turret body */}
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[0.32, 0.24, 0.32]} />
            <meshStandardMaterial color="#263022" roughness={0.8} metalness={0.58} />
          </mesh>
          {/* Turret top slant */}
          <mesh position={[0.06, 0.34, 0]}>
            <boxGeometry args={[0.2, 0.1, 0.28]} />
            <meshStandardMaterial color="#1E2A1C" roughness={0.82} metalness={0.55} />
          </mesh>
          {/* Ammo box on left side */}
          <mesh position={[-0.05, 0.14, -0.28]}>
            <boxGeometry args={[0.24, 0.2, 0.18]} />
            <meshStandardMaterial color="#1A2418" roughness={0.85} metalness={0.52} />
          </mesh>
          {/* Ammo feed chute */}
          <mesh position={[0, 0.22, -0.22]} rotation={[Math.PI/8, 0, 0]}>
            <boxGeometry args={[0.06, 0.18, 0.06]} />
            <meshStandardMaterial color="#243020" roughness={0.82} metalness={0.58} />
          </mesh>
          {/* Elevation fork (yoke) */}
          {([-0.14, 0.14] as number[]).map((z, i) => (
            <group key={i}>
              <mesh position={[0.1, 0.36, z]}>
                <boxGeometry args={[0.08, 0.28, 0.07]} />
                <meshStandardMaterial color="#2E3828" roughness={0.75} metalness={0.65} />
              </mesh>
              <mesh position={[0.14, 0.48, z]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.1, 10]} />
                <meshStandardMaterial color="#4C5A48" roughness={0.48} metalness={0.9} />
              </mesh>
            </group>
          ))}
          {/* Elevation group */}
          <group ref={elRef} position={[0.14, 0.48, 0]}>
            {/* Gun mount housing */}
            <mesh position={[0.15, 0, 0]}>
              <boxGeometry args={[0.28, 0.18, 0.28]} />
              <meshStandardMaterial color="#222E20" roughness={0.8} metalness={0.6} />
            </mesh>
            {/* Cooling jacket around barrels */}
            <mesh position={[0.42, 0, 0]} rotation={[0, 0, Math.PI/2]}>
              <cylinderGeometry args={[0.085, 0.085, 0.4, 8]} />
              <meshStandardMaterial color="#1E2A1C" roughness={0.78} metalness={0.68} />
            </mesh>
            {/* Jacket cooling holes */}
            {[0, Math.PI/2, Math.PI, Math.PI*3/2].map((a, i) => (
              <mesh key={i} position={[0.42, Math.sin(a)*0.082, Math.cos(a)*0.082]} rotation={[a, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.018, 0.018, 0.38, 6]} />
                <meshStandardMaterial color="#0C1209" roughness={0.9} metalness={0.5} />
              </mesh>
            ))}

            {/* 3-barrel rotary assembly */}
            <group ref={barrelRef} position={[0.3, 0, 0]}>
              {/* Central rotor hub */}
              <mesh rotation={[0, 0, Math.PI/2]}>
                <cylinderGeometry args={[0.032, 0.032, 0.75, 10]} />
                <meshStandardMaterial color="#1A1A18" roughness={0.62} metalness={0.9} />
              </mesh>
              {/* 3 barrels radially at 120° */}
              {[0, 2.094, 4.189].map((a, i) => (
                <group key={i} position={[0, Math.sin(a)*0.065, Math.cos(a)*0.065]}>
                  <mesh rotation={[0, 0, Math.PI/2]}>
                    <cylinderGeometry args={[0.016, 0.02, 0.85, 8]} />
                    <meshStandardMaterial color="#28302A" roughness={0.7} metalness={0.82} />
                  </mesh>
                  {/* Muzzle tip */}
                  <mesh position={[0.44, 0, 0]} rotation={[0, 0, Math.PI/2]}>
                    <cylinderGeometry args={[0.022, 0.016, 0.06, 8]} />
                    <meshStandardMaterial
                      color={active ? KIN_COL : '#282A28'}
                      emissive={active ? KIN_COL : '#000'}
                      emissiveIntensity={isEngaging && active ? 1.2 : 0.1}
                      roughness={0.4} metalness={0.82}
                    />
                  </mesh>
                </group>
              ))}
            </group>

            {/* Gunsight on top */}
            <mesh position={[0.26, 0.12, 0]}>
              <boxGeometry args={[0.18, 0.06, 0.05]} />
              <meshStandardMaterial color="#182018" roughness={0.82} metalness={0.62} />
            </mesh>
            <mesh position={[0.3, 0.16, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
              <meshStandardMaterial color="#00D4FF" emissive="#00D4FF" emissiveIntensity={0.4} roughness={0.2} />
            </mesh>

            {/* Muzzle flash light */}
            <pointLight ref={muzzleRef} position={[0.75, 0, 0]} color={KIN_COL}
              intensity={0} distance={3.5} decay={2} />

            {/* Muzzle flash sphere when engaging */}
            {active && isEngaging && (
              <mesh position={[0.76, 0, 0]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color={KIN_COL} emissive={KIN_COL}
                  emissiveIntensity={2.0} transparent opacity={0.7} />
              </mesh>
            )}
          </group>
        </group>
      </group>
    )
  }

  // ── Threat marker ──────────────────────────────────────────────────
  function ThreatIndicator({ bearing }: { bearing: number }) {
    const ref = useRef<THREE.Mesh>(null)
    useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 2.2 })
    const rad = (bearing * Math.PI) / 180
    return (
      <mesh ref={ref} position={[Math.sin(rad) * 3.0, 0.1, -Math.cos(rad) * 3.0]}>
        <octahedronGeometry args={[0.12]} />
        <meshStandardMaterial color="#FF2020" emissive="#FF2020" emissiveIntensity={0.75} />
      </mesh>
    )
  }

  // ── Scene ──────────────────────────────────────────────────────────
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
        <ambientLight intensity={1.5} color="#8899AA" />
        <directionalLight position={[5, 7, 4]} intensity={2.8} color="#FFFFFF" />
        <directionalLight position={[-4, 4, -3]} intensity={1.1} color="#AABCFF" />
        <pointLight position={[0, 6, 0]} intensity={1.6} color="#FFFFFF" />
        <pointLight position={[3, 2, 3]} intensity={0.8} color="#F5A623" />
        <pointLight position={[-3, 2, -2]} intensity={0.6} color="#00D4FF" />

        <Ground />
        <Platform />

        {/* ── 4 distinct weapon subsystems ── */}
        {/* Rear bed: Detector Mast (always on) */}
        <DetectorSuite position={[-1.08, 0.39, 0]} />

        {/* Centre bed: EMP Emitter */}
        <EMPEmitter
          azimuth={mode === 'DIRECTED_EMP' ? azimuth : 0}
          elevation={mode === 'DIRECTED_EMP' ? elevation : 0}
          active={mode === 'DIRECTED_EMP'}
          isEngaging={isEngaging && mode === 'DIRECTED_EMP'}
          position={[-0.3, 0.39, 0]}
        />

        {/* Front-right bed: RF Jammer */}
        <RFJammer
          azimuth={mode === 'RF_JAM' ? azimuth : 0}
          active={mode === 'RF_JAM'}
          isEngaging={isEngaging && mode === 'RF_JAM'}
          position={[0.2, 0.39, -0.3]}
        />

        {/* Front-left bed: Kinetic Cannon */}
        <KineticCannon
          azimuth={mode === 'KINETIC' ? azimuth : 0}
          elevation={mode === 'KINETIC' ? elevation : 0}
          active={mode === 'KINETIC'}
          isEngaging={isEngaging && mode === 'KINETIC'}
          position={[0.2, 0.39, 0.3]}
        />

        {threatBearings.map((b, i) => <ThreatIndicator key={i} bearing={b} />)}
      </>
    )
  }

  // ── Export ─────────────────────────────────────────────────────────
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
          color: '#334', letterSpacing: '0.12em', zIndex: 1, pointerEvents: 'none',
        }}>
          EMP-RCWS · MULTI-MISSION · DETECT / EMP / JAM / KINETIC
        </div>
        <Canvas
          camera={{ position: [4.2, 3.2, 3.8], fov: 38, near: 0.1, far: 120 }}
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
