import { OrthographicCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'

import { EffectController } from '../effects/EffectController'
import type { GestureSnapshot } from '../gestures/types'
import type { QualityLevel } from '../performance/quality'
import { QUALITY } from '../performance/quality'
import { Artifact } from './Artifact'
import type { SceneViewport } from './screenToWorld'

export type { QualityLevel }

type ExperienceCanvasProps = Readonly<{
  snapshot: GestureSnapshot
  quality?: QualityLevel
  sourceSize?: SceneViewport
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
export function ExperienceCanvas({ snapshot, quality = 'high', sourceSize = { width: 16, height: 9 } }: ExperienceCanvasProps) {
  const fusing = FUSING_KINDS.has(snapshot.stableKind)
  const profile = QUALITY[quality]

  return (
    <Canvas className="experience-canvas" dpr={profile.dpr} gl={{ alpha: true, antialias: true }}>
      <OrthographicCamera
        makeDefault
        position={[0, 0, 20]}
        zoom={40}
        near={0.1}
        far={100}
      />
      <ambientLight intensity={profile.lighting ? 0.65 : 0.9} />
      {profile.lighting ? <>
        <directionalLight position={[4, 6, 8]} intensity={1.15} />
        <directionalLight position={[-5, 2, -4]} intensity={0.5} color="#7cf5d2" />
      </> : null}
      <Suspense fallback={null}>
        {snapshot.leftIndex ? (
          <Artifact kind="egg" point={snapshot.leftIndex} target={snapshot.effectOrigin} fusing={fusing} fusionProgress={snapshot.fusionProgress} releaseProgress={snapshot.releaseProgress} glowIntensity={profile.glowIntensity} sourceSize={sourceSize} />
        ) : null}
        {snapshot.rightIndex ? (
          <Artifact kind="lock" point={snapshot.rightIndex} target={snapshot.effectOrigin} fusing={fusing} fusionProgress={snapshot.fusionProgress} releaseProgress={snapshot.releaseProgress} glowIntensity={profile.glowIntensity} sourceSize={sourceSize} />
        ) : null}
      </Suspense>
      <EffectController snapshot={snapshot} quality={quality} sourceSize={sourceSize} />
    </Canvas>
  )
}
