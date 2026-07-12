import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Vector3 } from 'three'

import type { GestureSnapshot } from '../gestures/types'
import { QUALITY, type QualityLevel } from '../performance/quality'
import { SCENE_VIEWPORT, screenToWorld } from '../scene/screenToWorld'
import { BeamBurst } from './BeamBurst'
import { advanceEffectSchedule, createEffectSchedule } from './effectSchedule'
import { HeartEmitter, type HeartEmitterHandle } from './HeartEmitter'
import { Shockwave } from './Shockwave'

/** Mutable per-frame state the effect meshes read without React re-renders. */
export type EffectField = {
  origin: Vector3
  firing: boolean
  shockToken: number
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
}: {
  snapshot: GestureSnapshot
  quality?: QualityLevel
}) {
  const emitterRef = useRef<HeartEmitterHandle>(null)
  const scheduleRef = useRef(createEffectSchedule())
  const enteredRef = useRef(-1)
  const field = useMemo<EffectField>(
    () => ({ origin: new Vector3(), firing: false, shockToken: 0 }),
    [],
  )

  useFrame(({ clock }) => {
    const origin = snapshot.effectOrigin
    if (origin) {
      const [x, y, z] = screenToWorld(origin, SCENE_VIEWPORT)
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
    for (const kind of next.spawn) emitterRef.current?.spawn(kind, field.origin)
    if (next.shockwave) field.shockToken += 1
  })

  return (
    <group>
      <HeartEmitter ref={emitterRef} activeCap={QUALITY[quality].particlePool} />
      <BeamBurst field={field} />
      <Shockwave field={field} />
    </group>
  )
}
