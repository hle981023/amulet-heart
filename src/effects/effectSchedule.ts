import type { GestureSnapshot } from '../gestures/types'

export type Emission = 'small' | 'strong'

export type EffectSchedule = Readonly<{
  /** True only on the frame a firing pose is (re)entered. */
  beamBurst: boolean
  beam: Emission | null
  flash: boolean
  trailBursts: number
  sparkleBursts: number
  fragmentBursts: number
  /** True only on the frame a strong heart is (re)entered. */
  shockwave: boolean
  /** Projectiles to spawn this frame. */
  spawn: readonly Emission[]
  lastSmallMs: number
  lastStrongMs: number
}>

export const SMALL_INTERVAL_MS = 250
export const STRONG_INTERVAL_MS = 900

export const createEffectSchedule = (): EffectSchedule => ({
  beamBurst: false,
  beam: null,
  flash: false,
  trailBursts: 0,
  sparkleBursts: 0,
  fragmentBursts: 0,
  shockwave: false,
  spawn: [],
  lastSmallMs: Number.NEGATIVE_INFINITY,
  lastStrongMs: Number.NEGATIVE_INFINITY,
})

/**
 * Pure per-frame emission timing. Small hearts stream while a finger heart is
 * held; strong hearts pulse while a big heart is held. Entry-only beam and
 * shockwave flags fire once per pose entry, and nothing spawns while releasing.
 */
export const advanceEffectSchedule = (
  previous: EffectSchedule,
  snapshot: GestureSnapshot,
  nowMs: number,
): EffectSchedule => {
  const kind = snapshot.stableKind
  const spawn: Emission[] = []
  let { lastSmallMs, lastStrongMs } = previous
  let beamBurst = false
  let shockwave = false
  let beam: Emission | null = null
  let flash = false
  let trailBursts = 0
  let sparkleBursts = 0
  let fragmentBursts = 0

  if (kind === 'finger-heart') {
    if (snapshot.changed || nowMs - lastSmallMs >= SMALL_INTERVAL_MS) {
      spawn.push('small')
      lastSmallMs = nowMs
    }
    if (snapshot.changed) {
      beamBurst = true
      beam = 'small'
      trailBursts = 1
      sparkleBursts = 1
    }
  } else if (kind === 'big-heart') {
    if (snapshot.changed || nowMs - lastStrongMs >= STRONG_INTERVAL_MS) {
      spawn.push('strong')
      lastStrongMs = nowMs
    }
    if (snapshot.changed) {
      beamBurst = true
      beam = 'strong'
      flash = true
      trailBursts = 2
      sparkleBursts = 2
      fragmentBursts = 1
      shockwave = true
    }
  }

  return { beamBurst, beam, flash, trailBursts, sparkleBursts, fragmentBursts, shockwave, spawn, lastSmallMs, lastStrongMs }
}
