import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Vector3 } from 'three'

import type { GestureSnapshot } from '../gestures/types'
import { QUALITY, type QualityLevel } from '../performance/quality'
import { projectCoverPoint, screenToWorld, type SceneViewport } from '../scene/screenToWorld'
import { BeamBurst } from './BeamBurst'
import { advanceEffectSchedule, createEffectSchedule } from './effectSchedule'
import { HeartEmitter, type HeartEmitterHandle } from './HeartEmitter'
import { Shockwave } from './Shockwave'
import { ScreenFlash, SignatureParticles } from './SignatureParticles'

/** Mutable per-frame state the effect meshes read without React re-renders. */
export type EffectField = {
  origin: Vector3
  firing: boolean
  shockToken: number
  sparkleToken: number
  flashToken: number
  attackKind: 'small' | 'strong' | null
  releaseOpacity: number
  glowIntensity: number
}

const FIRING_KINDS: ReadonlySet<GestureSnapshot['stableKind']> = new Set([
  'finger-heart',
  'big-heart',
])

const nowMsFrom = (elapsedSeconds: number) => elapsedSeconds * 1000

/**
 * Maps the stable gesture snapshot into procedural attacks. It advances the
 * pure emission schedule once per pose entry (not once per render frame), spawns
 * pooled hearts, and shares an `EffectField` with the beam and shockwave meshes.
 */
export function EffectController({
  snapshot,
  quality = 'high',
  sourceSize,
}: {
  snapshot: GestureSnapshot
  quality?: QualityLevel
  sourceSize?: SceneViewport
}) {
  const emitterRef = useRef<HeartEmitterHandle>(null)
  const scheduleRef = useRef(createEffectSchedule())
  const enteredRef = useRef(-1)
  const field = useMemo<EffectField>(
    () => ({ origin: new Vector3(), firing: false, shockToken: 0, sparkleToken: 0, flashToken: 0, attackKind: null, releaseOpacity: 1, glowIntensity: QUALITY[quality].glowIntensity }),
    [],
  )

  const { size, viewport } = useThree()

  useFrame(({ clock }) => {
    const origin = snapshot.effectOrigin
    if (origin) {
      const projected = projectCoverPoint(origin, sourceSize ?? { width: 16, height: 9 }, size)
      const [x, y, z] = screenToWorld(projected, viewport)
      field.origin.set(x, y, z)
    }

    // Collapse repeated render frames of the same pose entry into one "changed".
    const isEntry = snapshot.enteredAtMs !== enteredRef.current
    enteredRef.current = snapshot.enteredAtMs
    const framed = isEntry ? snapshot : { ...snapshot, changed: false }

    const next = advanceEffectSchedule(
      scheduleRef.current,
      framed,
      nowMsFrom(clock.getElapsedTime()),
    )
    scheduleRef.current = next

    field.firing = FIRING_KINDS.has(snapshot.stableKind)
    field.attackKind = snapshot.stableKind === 'big-heart' ? 'strong' : snapshot.stableKind === 'finger-heart' ? 'small' : null
    field.releaseOpacity = 1 - snapshot.releaseProgress
    field.glowIntensity = QUALITY[quality].glowIntensity
    for (const kind of next.spawn) emitterRef.current?.spawn(kind, field.origin)
    if (next.shockwave) field.shockToken += 1
    if (next.sparkleBursts) field.sparkleToken += 1
    if (next.flash) field.flashToken += 1
  })

  return (
    <group>
      <HeartEmitter ref={emitterRef} activeCap={QUALITY[quality].particlePool} field={field} />
      <BeamBurst field={field} />
      <Shockwave field={field} />
      <SignatureParticles field={field} activeCap={QUALITY[quality].particlePool} />
      <ScreenFlash field={field} />
    </group>
  )
}
