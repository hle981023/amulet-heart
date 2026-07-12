import { describe, expect, it } from 'vitest'

import { projectCoverPoint, screenToWorld } from './screenToWorld'

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

  it.each([
    ['16:9', { width: 1600, height: 900 }],
    ['wide', { width: 2100, height: 900 }],
    ['tall', { width: 900, height: 1200 }],
  ])('mirrors and cover-crops a 16:9 video into a %s container', (_name, container) => {
    const center = projectCoverPoint({ x: 0.5, y: 0.5, z: 0 }, { width: 1600, height: 900 }, container)
    expect(center).toEqual({ x: 0.5, y: 0.5, z: 0 })
    const rawRight = projectCoverPoint({ x: 0.75, y: 0.5, z: 0 }, { width: 1600, height: 900 }, container)
    expect(rawRight.x).toBeLessThan(0.5)
  })
})
