import { describe, expect, it } from 'vitest'
import { createGestureMachine } from './machine'
import type { GestureObservation } from './types'

const observation = (
  kind: GestureObservation['kind'],
): GestureObservation => ({ kind, confidence: kind === 'idle' ? 0 : 1 })

describe('createGestureMachine', () => {
  it('requires 150ms before entering and fades through releasing for 300ms', () => {
    const machine = createGestureMachine()
    expect(machine.update(observation('egg-ready'), 0).stableKind).toBe('idle')
    expect(machine.update(observation('egg-ready'), 149).stableKind).toBe('idle')
    expect(machine.update(observation('egg-ready'), 150).stableKind).toBe(
      'egg-ready',
    )
    expect(machine.update(observation('idle'), 151).stableKind).toBe('egg-ready')
    expect(machine.update(observation('idle'), 301).stableKind).toBe('releasing')
    expect(machine.update(observation('idle'), 599).stableKind).toBe('releasing')
    expect(machine.update(observation('idle'), 600).stableKind).toBe('idle')
  })

  it('reports stable transitions once with their entry timestamp', () => {
    const machine = createGestureMachine()

    expect(machine.update(observation('both-ready'), 10)).toMatchObject({
      stableKind: 'idle',
      enteredAtMs: 0,
      changed: false,
    })
    expect(machine.update(observation('both-ready'), 160)).toMatchObject({
      stableKind: 'both-ready',
      enteredAtMs: 160,
      changed: true,
    })
    expect(machine.update(observation('both-ready'), 161)).toMatchObject({
      stableKind: 'both-ready',
      enteredAtMs: 160,
      changed: false,
    })
  })

  it('restarts stabilization when the candidate changes', () => {
    const machine = createGestureMachine()

    machine.update(observation('egg-ready'), 0)
    expect(machine.update(observation('lock-ready'), 149).stableKind).toBe('idle')
    expect(machine.update(observation('lock-ready'), 298).stableKind).toBe('idle')
    expect(machine.update(observation('lock-ready'), 299).stableKind).toBe('lock-ready')
  })

  it('reset clears committed and candidate state', () => {
    const machine = createGestureMachine()
    machine.update(observation('armed'), 0)
    machine.update(observation('armed'), 150)

    machine.reset()

    expect(machine.update(observation('armed'), 1_000)).toMatchObject({
      stableKind: 'idle',
      enteredAtMs: 0,
      changed: false,
    })
  })

  it('requires both-ready then timed fusion before latching armed and accepting attacks', () => {
    const machine = createGestureMachine()
    expect(machine.update(observation('both-ready'), 0).stableKind).toBe('idle')
    expect(machine.update(observation('both-ready'), 150).stableKind).toBe('both-ready')
    expect(machine.update(observation('fusing'), 151)).toMatchObject({ stableKind: 'fusing', fusionProgress: 0 })
    expect(machine.update(observation('fusing'), 750)).toMatchObject({ stableKind: 'fusing' })
    expect(machine.update(observation('fusing'), 751)).toMatchObject({ stableKind: 'armed', fusionProgress: 1 })
    expect(machine.update(observation('finger-heart'), 752).stableKind).toBe('finger-heart')
  })

  it('rejects direct heart attacks until the armed latch exists', () => {
    const machine = createGestureMachine()
    machine.update(observation('finger-heart'), 0)
    expect(machine.update(observation('finger-heart'), 500).stableKind).toBe('idle')
    machine.update(observation('armed'), 501)
    expect(machine.update(observation('armed'), 1_000).stableKind).toBe('idle')
  })

  it('holds committed landmarks for 150ms then releases them over 300ms', () => {
    const machine = createGestureMachine()
    const seen = { ...observation('both-ready'), leftIndex: { x: 0.7, y: 0.3, z: 0 } }
    machine.update(seen, 0)
    machine.update(seen, 150)
    expect(machine.update(observation('idle'), 300)).toMatchObject({ stableKind: 'both-ready', leftIndex: seen.leftIndex, releaseProgress: 0 })
    expect(machine.update(observation('idle'), 301)).toMatchObject({ stableKind: 'releasing', leftIndex: seen.leftIndex })
    expect(machine.update(observation('idle'), 451).releaseProgress).toBeCloseTo(0.5)
    expect(machine.update(observation('idle'), 601)).toMatchObject({ stableKind: 'idle', releaseProgress: 1 })
  })
})
