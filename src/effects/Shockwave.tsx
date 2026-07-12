import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Mesh, MeshBasicMaterial } from 'three'

import type { EffectField } from './EffectController'

const DURATION = 0.6
const MAX_SCALE = 4.5

/**
 * Radial ring that expands and fades once each time the strong-heart token
 * advances, marking a big-heart burst.
 */
export function Shockwave({ field }: { field: EffectField }) {
  const meshRef = useRef<Mesh>(null)
  const ageRef = useRef(Infinity)
  const tokenRef = useRef(field.shockToken)
  const material = useMemo(
    () =>
      new MeshBasicMaterial({
        color: '#ff8fc7',
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

    if (field.shockToken !== tokenRef.current) {
      tokenRef.current = field.shockToken
      ageRef.current = 0
      mesh.position.copy(field.origin)
    }

    ageRef.current += delta
    const t = ageRef.current / DURATION
    if (t >= 1) {
      mesh.visible = false
      return
    }

    mesh.visible = true
    mesh.scale.setScalar(0.2 + t * MAX_SCALE)
    material.opacity = (1 - t) * 0.8
  })

  return (
    <mesh ref={meshRef} visible={false}>
      <ringGeometry args={[0.78, 1, 56]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
