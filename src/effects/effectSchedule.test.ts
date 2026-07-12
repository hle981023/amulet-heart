import { describe, expect, it } from 'vitest'

import type { GestureKind, GestureSnapshot } from '../gestures/types'
import { advanceEffectSchedule, createEffectSchedule } from './effectSchedule'

const snapshot = (
  stableKind: GestureKind,
  changed: boolean,
): GestureSnapshot => ({
  kind: stableKind === 'releasing' ? 'idle' : stableKind,
  confidence: 1,
  stableKind,
  enteredAtMs: 0,
  changed,
  fusionProgress: stableKind === 'armed' ? 1 : 0,
  releaseProgress: stableKind === 'releasing' ? 0.5 : 0,
})

describe('advanceEffectSchedule', () => {
  it('emits small hearts every 250ms and strong hearts every 900ms', () => {
    let s = createEffectSchedule()

    s = advanceEffectSchedule(s, snapshot('finger-heart', true), 0)
    expect(s.beamBurst).toBe(true)
    expect(s.spawn).toEqual(['small'])

    s = advanceEffectSchedule(s, snapshot('finger-heart', false), 249)
    expect(s.spawn).toEqual([])

    s = advanceEffectSchedule(s, snapshot('finger-heart', false), 250)
    expect(s.spawn).toEqual(['small'])

    s = advanceEffectSchedule(s, snapshot('big-heart', true), 300)
    expect(s.spawn).toEqual(['strong'])
    expect(s.shockwave).toBe(true)
  })

  it('resets entry-only flags once a held pose stops changing', () => {
    let s = createEffectSchedule()
    s = advanceEffectSchedule(s, snapshot('big-heart', true), 0)
    expect(s.beamBurst).toBe(true)
    expect(s.shockwave).toBe(true)

    s = advanceEffectSchedule(s, snapshot('big-heart', false), 100)
    expect(s.beamBurst).toBe(false)
    expect(s.shockwave).toBe(false)
  })

  it('stops spawning immediately while releasing', () => {
    let s = createEffectSchedule()
    s = advanceEffectSchedule(s, snapshot('finger-heart', true), 0)
    s = advanceEffectSchedule(s, snapshot('releasing', true), 400)
    expect(s.spawn).toEqual([])
    expect(s.beamBurst).toBe(false)
  })

  it('distinguishes bounded small and strong signature attack entries', () => {
    const small = advanceEffectSchedule(createEffectSchedule(), snapshot('finger-heart', true), 0)
    expect(small).toMatchObject({ beam: 'small', flash: false, trailBursts: 1, sparkleBursts: 1, fragmentBursts: 0 })
    const strong = advanceEffectSchedule(createEffectSchedule(), snapshot('big-heart', true), 0)
    expect(strong).toMatchObject({ beam: 'strong', flash: true, trailBursts: 2, sparkleBursts: 2, fragmentBursts: 1, shockwave: true })
  })
})
