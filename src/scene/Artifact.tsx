import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Group, MathUtils } from 'three'

import type { Vec3 } from '../gestures/types'
import { ARTIFACTS } from '../models/artifactManifest'
import { SCENE_SCALE, SCENE_VIEWPORT, screenToWorld } from './screenToWorld'

const IDLE_SPIN = 0.8
const FUSING_SPIN = 4.5
const POSITION_DAMP = 8

type ArtifactProps = Readonly<{
  kind: keyof typeof ARTIFACTS
  point: Vec3
  fusing: boolean
}>

/**
 * Loads a named GLB root, anchors it to a normalized hand point with damped
 * motion, and spins it continuously — faster while the artifacts fuse.
 */
export function Artifact({ kind, point, fusing }: ArtifactProps) {
  const config = ARTIFACTS[kind]
  const { scene } = useGLTF(config.url)
  const clone = useMemo(() => scene.clone(true), [scene])
  const group = useRef<Group>(null)

  useFrame((_, delta) => {
    const node = group.current
    if (!node) return

    const [x, y, z] = screenToWorld(point, SCENE_VIEWPORT)
    node.position.x = MathUtils.damp(node.position.x, x, POSITION_DAMP, delta)
    node.position.y = MathUtils.damp(node.position.y, y, POSITION_DAMP, delta)
    node.position.z = MathUtils.damp(node.position.z, z, POSITION_DAMP, delta)
    node.rotation.y += delta * (fusing ? FUSING_SPIN : IDLE_SPIN)
  })

  return (
    <group ref={group} scale={config.scale * SCENE_SCALE}>
      <primitive object={clone} />
    </group>
  )
}

useGLTF.preload(ARTIFACTS.egg.url)
useGLTF.preload(ARTIFACTS.lock.url)
