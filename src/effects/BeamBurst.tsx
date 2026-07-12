import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Mesh, MeshBasicMaterial } from 'three'

import type { EffectField } from './EffectController'

const ENTRY_MS = 0.25
const HELD_GLOW = 0.28

/**
 * Vertical light column that punches in over 250ms on entry, then settles to a
 * softer sustained glow while the pose is held.
 */
export function BeamBurst({ field }: { field: EffectField }) {
  const meshRef = useRef<Mesh>(null)
  const ageRef = useRef(0)
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color: '#bdf3ff',
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return

    if (field.firing) ageRef.current += delta
    else ageRef.current = 0

    mesh.visible = field.firing
    mesh.position.copy(field.origin)
    mesh.position.y += 1.5

    const entry = Math.min(ageRef.current / ENTRY_MS, 1)
    const punch = entry < 1 ? entry * (1 - entry) * 4 : 0
    material.opacity = field.firing ? Math.max(punch, HELD_GLOW) : 0
    mesh.scale.set(1, 3 + entry * 4, 1)
  })

  return (
    <mesh ref={meshRef} visible={false}>
      <planeGeometry args={[0.45, 3]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
