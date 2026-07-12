import { OrthographicCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'

import { EffectController } from '../effects/EffectController'
import type { GestureSnapshot } from '../gestures/types'
import { Artifact } from './Artifact'

export type QualityLevel = 'high' | 'medium' | 'low'

type ExperienceCanvasProps = Readonly<{
  snapshot: GestureSnapshot
  quality?: QualityLevel
}>

const FUSING_KINDS: ReadonlySet<GestureSnapshot['stableKind']> = new Set([
  'fusing',
  'armed',
])

/**
 * Transparent React Three Fiber layer that floats the rotating artifacts over
 * the mirrored camera preview. Artifacts appear wherever the classifier reports
 * a summoning hand, so the scene never depends on MediaPipe internals.
 */
export function ExperienceCanvas({ snapshot, quality }: ExperienceCanvasProps) {
  const fusing = FUSING_KINDS.has(snapshot.stableKind)

  return (
    <Canvas className="experience-canvas" gl={{ alpha: true, antialias: true }}>
      <OrthographicCamera
        makeDefault
        position={[0, 0, 20]}
        zoom={40}
        near={0.1}
        far={100}
      />
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 8]} intensity={1.15} />
      <directionalLight position={[-5, 2, -4]} intensity={0.5} color="#7cf5d2" />
      <Suspense fallback={null}>
        {snapshot.leftIndex ? (
          <Artifact kind="egg" point={snapshot.leftIndex} fusing={fusing} />
        ) : null}
        {snapshot.rightIndex ? (
          <Artifact kind="lock" point={snapshot.rightIndex} fusing={fusing} />
        ) : null}
      </Suspense>
      <EffectController snapshot={snapshot} quality={quality} />
    </Canvas>
  )
}
