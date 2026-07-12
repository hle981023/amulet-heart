import { describe, expect, it } from 'vitest'

import { nextQuality, QUALITY } from './quality'

describe('nextQuality', () => {
  it('reduces bloom before removing model fidelity', () => {
    expect(nextQuality('high', 24)).toBe('medium')
    expect(nextQuality('medium', 19)).toBe('low')
    expect(QUALITY.low.modelDetail).toBe(1)
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
