import { describe, expect, it } from 'vitest'

import { screenToWorld } from './screenToWorld'

describe('screenToWorld', () => {
  it('maps normalized mirrored video coordinates into scene coordinates', () => {
    expect(screenToWorld({ x: 0, y: 0, z: 0 }, { width: 16, height: 9 })).toEqual([
      -8, 4.5, 0,
    ])
    expect(screenToWorld({ x: 1, y: 1, z: 0 }, { width: 16, height: 9 })).toEqual([
      8, -4.5, 0,
    ])
  })

  it('centers the normalized midpoint on the scene origin', () => {
    expect(
      screenToWorld({ x: 0.5, y: 0.5, z: 0 }, { width: 16, height: 9 }),
    ).toEqual([0, 0, 0])
  })

  it('keeps nearer hands in front of farther hands', () => {
    const [, , near] = screenToWorld({ x: 0.5, y: 0.5, z: -0.2 }, { width: 10, height: 10 })
    const [, , far] = screenToWorld({ x: 0.5, y: 0.5, z: 0.2 }, { width: 10, height: 10 })
    expect(near).toBeGreaterThan(far)
  })
})
