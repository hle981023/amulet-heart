import { useFrame } from '@react-three/fiber'
import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  Color,
  InstancedMesh,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three'

import type { Emission } from './effectSchedule'
import { createHeartGeometry } from './heartGeometry'

const POOL_SIZE = 96
const BASE_LIFETIME = 1.1
const DRAG = 1.6
const RELEASE_FADE = 0.3

type Particle = {
  active: boolean
  age: number
  life: number
  scale: number
  spin: number
  position: Vector3
  velocity: Vector3
}

export type HeartEmitterHandle = Readonly<{
  spawn(kind: Emission, origin: Vector3): void
}>

type HeartEmitterProps = Readonly<{
  /** Caps simultaneously live particles so lower quality allocates fewer. */
  activeCap?: number
}>

/**
 * Pooled additive heart projectiles. `spawn` activates a free slot; a shared
 * instanced mesh renders every live particle, so a long-held pose never
 * allocates geometry per frame.
 */
export const HeartEmitter = forwardRef<HeartEmitterHandle, HeartEmitterProps>(
  function HeartEmitter({ activeCap = POOL_SIZE }, ref) {
    const meshRef = useRef<InstancedMesh>(null)
    const geometry = useMemo(() => createHeartGeometry(0.18), [])
    const material = useMemo(
      () =>
        new MeshBasicMaterial({
          color: new Color('#ff5c9e'),
          transparent: true,
          opacity: 1,
          blending: AdditiveBlending,
          depthWrite: false,
        }),
      [],
    )
    const dummy = useMemo(() => new Object3D(), [])
    const capRef = useRef(activeCap)
    capRef.current = Math.min(activeCap, POOL_SIZE)
    const particles = useMemo<Particle[]>(
      () =>
        Array.from({ length: POOL_SIZE }, () => ({
          active: false,
          age: 0,
          life: BASE_LIFETIME,
          scale: 1,
          spin: 0,
          position: new Vector3(),
          velocity: new Vector3(),
        })),
      [],
    )

    useImperativeHandle(
      ref,
      () => ({
        spawn(kind, origin) {
          let slot: Particle | undefined
          for (let index = 0; index < capRef.current; index += 1) {
            if (!particles[index].active) {
              slot = particles[index]
              break
            }
          }
          if (!slot) return

          const strong = kind === 'strong'
          const speed = strong ? 9 : 6
          slot.active = true
          slot.age = 0
          slot.life = strong ? BASE_LIFETIME * 1.2 : BASE_LIFETIME
          slot.scale = strong ? 2.4 : 1
          slot.spin = (Math.random() - 0.5) * 4
          slot.position.copy(origin)
          slot.velocity.set(
            (Math.random() - 0.5) * (strong ? 3 : 2),
            speed,
            0,
          )
        },
      }),
      [particles],
    )

    useFrame((_, delta) => {
      const mesh = meshRef.current
      if (!mesh) return

      let count = 0
      for (const particle of particles) {
        if (!particle.active) continue
        particle.age += delta
        if (particle.age >= particle.life) {
          particle.active = false
          continue
        }

        particle.velocity.multiplyScalar(Math.max(0, 1 - DRAG * delta))
        particle.position.addScaledVector(particle.velocity, delta)

        const remaining = particle.life - particle.age
        const fade = remaining < RELEASE_FADE ? remaining / RELEASE_FADE : 1
        dummy.position.copy(particle.position)
        dummy.rotation.z = particle.age * particle.spin
        dummy.scale.setScalar(particle.scale * (0.55 + 0.45 * fade))
        dummy.updateMatrix()
        mesh.setMatrixAt(count, dummy.matrix)
        count += 1
      }

      mesh.count = count
      mesh.instanceMatrix.needsUpdate = true
    })

    return (
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, POOL_SIZE]}
        frustumCulled={false}
      />
    )
  },
)
