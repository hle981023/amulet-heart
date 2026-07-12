import { describe, expect, it } from 'vitest'
import {
  bigHeart,
  fingerHeart,
  leftIndexOnly,
  noHands,
  rightIndexOnly,
} from '../../tests/fixtures/hands'
import { classifyHands } from './classify'

describe('classifyHands', () => {
  it('classifies screen-left and screen-right index summons', () => {
    expect(classifyHands([leftIndexOnly()]).kind).toBe('egg-ready')
    expect(classifyHands([rightIndexOnly()]).kind).toBe('lock-ready')
    expect(classifyHands([leftIndexOnly(), rightIndexOnly()]).kind).toBe('both-ready')
  })

  it('prefers the large two-hand heart over the compact heart', () => {
    expect(classifyHands(bigHeart()).kind).toBe('big-heart')
    expect(classifyHands(fingerHeart()).kind).toBe('finger-heart')
  })

  it('returns an idle zero-confidence observation when no rule matches', () => {
    expect(classifyHands(noHands())).toEqual({ kind: 'idle', confidence: 0 })
  })

  it('assigns summons by screen position rather than handedness metadata', () => {
    const left = { ...leftIndexOnly(), handedness: 'Right' as const }
    const right = { ...rightIndexOnly(), handedness: 'Left' as const }

    expect(classifyHands([right, left]).kind).toBe('both-ready')
    expect(classifyHands([left]).kind).toBe('egg-ready')
    expect(classifyHands([right]).kind).toBe('lock-ready')
  })
})
