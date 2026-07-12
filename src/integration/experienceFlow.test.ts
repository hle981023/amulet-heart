import { describe, expect, it } from 'vitest'

import { advanceEffectSchedule, createEffectSchedule } from '../effects/effectSchedule'
import { classifyHands } from '../gestures/classify'
import { createGestureMachine } from '../gestures/machine'
import { projectCoverPoint } from '../scene/screenToWorld'
import { bigHeart, bothIndexes, fusionHands } from '../../tests/fixtures/hands'

describe('deterministic successful experience flow', () => {
  it('maps mirrored hands, fuses, arms, fires strong effects, and releases', () => {
    const machine = createGestureMachine()
    machine.update(classifyHands(bothIndexes()), 0)
    expect(machine.update(classifyHands(bothIndexes()), 150).stableKind).toBe('both-ready')
    expect(machine.update(classifyHands(fusionHands()), 151).stableKind).toBe('fusing')
    expect(machine.update(classifyHands(fusionHands()), 751).stableKind).toBe('armed')
    const attack = machine.update(classifyHands(bigHeart()), 752)
    expect(attack.stableKind).toBe('big-heart')
    expect(advanceEffectSchedule(createEffectSchedule(), attack, 752)).toMatchObject({
      beam: 'strong', flash: true, shockwave: true, fragmentBursts: 1,
    })
    expect(projectCoverPoint(attack.effectOrigin!, { width: 16, height: 9 }, { width: 9, height: 16 }).x).toBeCloseTo(0.5)
    machine.update({ kind: 'idle', confidence: 0 }, 902)
    expect(machine.update({ kind: 'idle', confidence: 0 }, 903).stableKind).toBe('releasing')
    expect(machine.update({ kind: 'idle', confidence: 0 }, 1053).releaseProgress).toBeCloseTo(0.5)
  })
})
