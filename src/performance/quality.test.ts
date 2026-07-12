import { describe, expect, it } from 'vitest'

import { nextQuality, QUALITY } from './quality'

describe('nextQuality', () => {
  it('reduces measured scene quality as frame rate falls', () => {
    expect(nextQuality('high', 24)).toBe('medium')
    expect(nextQuality('medium', 19)).toBe('low')
    expect(QUALITY.low.particlePool).toBeLessThan(QUALITY.high.particlePool)
  })

  it('defines only measurable scene controls and changes each one across the ladder', () => {
    expect(Object.keys(QUALITY.high).sort()).toEqual(['dpr', 'glowIntensity', 'lighting', 'particlePool'])
    expect(QUALITY.high.dpr).toBeGreaterThan(QUALITY.low.dpr)
    expect(QUALITY.high.glowIntensity).toBeGreaterThan(QUALITY.low.glowIntensity)
    expect(QUALITY.high.lighting).toBe(true)
    expect(QUALITY.low.lighting).toBe(false)
  })

  it('holds steady inside the stable band', () => {
    expect(nextQuality('high', 30)).toBe('high')
    expect(nextQuality('medium', 24)).toBe('medium')
    expect(nextQuality('low', 30)).toBe('low')
  })

  it('recovers a single level once FPS is high', () => {
    expect(nextQuality('low', 40)).toBe('medium')
    expect(nextQuality('medium', 40)).toBe('high')
  })
})
