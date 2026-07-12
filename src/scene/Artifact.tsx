import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Group, MathUtils } from 'three'

import type { Vec3 } from '../gestures/types'
import { ARTIFACTS } from '../models/artifactManifest'
import { projectCoverPoint, SCENE_SCALE, screenToWorld, type SceneViewport } from './screenToWorld'

const IDLE_SPIN = 0.8
const FUSING_SPIN = 4.5
const POSITION_DAMP = 8

type ArtifactProps = Readonly<{
  kind: keyof typeof ARTIFACTS
  point: Vec3
  fusing: boolean
  target?: Vec3
  fusionProgress: number
  releaseProgress: number
  glowIntensity: number
  sourceSize: SceneViewport
}>

/**
 * Loads a named GLB root, anchors it to a normalized hand point with damped
 * motion, and spins it continuously — faster while the artifacts fuse.
 */
export function Artifact({ kind, point, target, fusing, fusionProgress, releaseProgress, glowIntensity, sourceSize }: ArtifactProps) {
  const config = ARTIFACTS[kind]
  const { scene } = useGLTF(config.url)
  const clone = useMemo(() => scene.clone(true), [scene])
  const group = useRef<Group>(null)
  const { size, viewport } = useThree()

  useFrame(({ clock }, delta) => {
    const node = group.current
    if (!node) return

    const blend = Math.min(0.72, fusionProgress * 0.72)
    const tracked = target ? {
      x: point.x + (target.x - point.x) * blend,
      y: point.y + (target.y - point.y) * blend,
      z: point.z + (target.z - point.z) * blend,
    } : point
    const projected = projectCoverPoint(tracked, sourceSize, size)
    const [x, y, z] = screenToWorld(projected, viewport)
    const tremble = fusing ? Math.sin(clock.getElapsedTime() * 42) * fusionProgress * 0.025 : 0
    node.position.x = MathUtils.damp(node.position.x, x + tremble, POSITION_DAMP, delta)
    node.position.y = MathUtils.damp(node.position.y, y, POSITION_DAMP, delta)
    node.position.z = MathUtils.damp(node.position.z, z, POSITION_DAMP, delta)
    node.rotation.y += delta * MathUtils.lerp(IDLE_SPIN, FUSING_SPIN, fusionProgress)
    node.scale.setScalar(config.scale * SCENE_SCALE * Math.max(0.001, 1 - releaseProgress))
  })

  return (
    <group ref={group} scale={config.scale * SCENE_SCALE}>
      <primitive object={clone} />
      <pointLight color="#bdf3ff" intensity={fusionProgress * glowIntensity * 2.5} distance={2.4} />
    </group>
  )
}

useGLTF.preload(ARTIFACTS.egg.url)
useGLTF.preload(ARTIFACTS.lock.url)
