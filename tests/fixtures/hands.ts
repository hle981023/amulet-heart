import type { HandSample, Handedness, Vec3 } from '../../src/gestures/types'

const point = (x: number, y: number, z = 0): Vec3 => ({ x, y, z })

const hand = (
  handedness: Handedness,
  centerX: number,
  tips: Partial<Record<4 | 8 | 12 | 16 | 20, Vec3>>,
): HandSample => {
  const landmarks = Array.from({ length: 21 }, () => point(centerX, 0.62))
  landmarks[0] = point(centerX, 0.72)
  landmarks[9] = point(centerX, 0.52)

  for (const index of [4, 8, 12, 16, 20] as const) {
    landmarks[index] = tips[index] ?? point(centerX, 0.62)
  }

  return { handedness, landmarks, score: 0.99 }
}

export const leftIndexOnly = (): HandSample =>
  hand('Left', 0.75, { 8: point(0.75, 0.24) })

export const rightIndexOnly = (): HandSample =>
  hand('Right', 0.25, { 8: point(0.25, 0.24) })

export const bothIndexes = (): HandSample[] => [leftIndexOnly(), rightIndexOnly()]

export const fingerHeart = (): HandSample[] => [
  hand('Left', 0.57, {
    4: point(0.51, 0.38),
    8: point(0.53, 0.356),
  }),
  hand('Right', 0.43, {
    4: point(0.49, 0.38),
    8: point(0.47, 0.356),
  }),
]

export const bigHeart = (): HandSample[] => [
  hand('Left', 0.7, {
    4: point(0.512, 0.52),
    8: point(0.512, 0.12),
  }),
  hand('Right', 0.3, {
    4: point(0.488, 0.52),
    8: point(0.488, 0.12),
  }),
]

export const fusionHands = (): HandSample[] => [
  hand('Left', 0.58, { 8: point(0.53, 0.24) }),
  hand('Right', 0.42, { 8: point(0.47, 0.24) }),
]

export const noHands = (): HandSample[] => []
