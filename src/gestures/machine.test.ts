import { describe, expect, it } from 'vitest'
import { createGestureMachine } from './machine'
import type { GestureObservation } from './types'

const observation = (
  kind: GestureObservation['kind'],
): GestureObservation => ({ kind, confidence: kind === 'idle' ? 0 : 1 })

describe('createGestureMachine', () => {
  it('requires 150ms before entering and fades through releasing for 300ms', () => {
    const machine = createGestureMachine()
    expect(machine.update(observation('finger-heart'), 0).stableKind).toBe('idle')
    expect(machine.update(observation('finger-heart'), 149).stableKind).toBe('idle')
    expect(machine.update(observation('finger-heart'), 150).stableKind).toBe(
      'finger-heart',
    )
    expect(machine.update(observation('idle'), 151).stableKind).toBe('releasing')
    expect(machine.update(observation('idle'), 450).stableKind).toBe('releasing')
    expect(machine.update(observation('idle'), 451).stableKind).toBe('idle')
  })

  it('reports stable transitions once with their entry timestamp', () => {
    const machine = createGestureMachine()

    expect(machine.update(observation('big-heart'), 10)).toMatchObject({
      stableKind: 'idle',
      enteredAtMs: 0,
      changed: false,
    })
    expect(machine.update(observation('big-heart'), 160)).toMatchObject({
      stableKind: 'big-heart',
      enteredAtMs: 160,
      changed: true,
    })
    expect(machine.update(observation('big-heart'), 161)).toMatchObject({
      stableKind: 'big-heart',
      enteredAtMs: 160,
      changed: false,
    })
  })

  it('restarts stabilization when the candidate changes', () => {
    const machine = createGestureMachine()

    machine.update(observation('finger-heart'), 0)
    expect(machine.update(observation('big-heart'), 149).stableKind).toBe('idle')
    expect(machine.update(observation('big-heart'), 298).stableKind).toBe('idle')
    expect(machine.update(observation('big-heart'), 299).stableKind).toBe('big-heart')
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
})
