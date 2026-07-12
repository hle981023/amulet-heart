import type { HandSample, Handedness, Vec3 } from '../../src/gestures/types'

const point = (x: number, y: number, z = 0): Vec3 => ({ x, y, z })

const hand = (
  handedness: Handedness,
  centerX: number,
  tips: Partial<Record<4 | 8 | 12 | 16 | 20, Vec3>>,
): HandSample => {
  const landmarks = Array.from({ length: 21 }, () => point(centerX, -0.6))
  landmarks[0] = point(centerX, 0)
  landmarks[9] = point(centerX, -1)

  for (const index of [4, 8, 12, 16, 20] as const) {
    landmarks[index] = tips[index] ?? point(centerX, -0.6)
  }

  return { handedness, landmarks, score: 0.99 }
}

export const leftIndexOnly = (): HandSample =>
  hand('Left', -1, { 8: point(-1, -2.4) })

export const rightIndexOnly = (): HandSample =>
  hand('Right', 1, { 8: point(1, -2.4) })

export const bothIndexes = (): HandSample[] => [leftIndexOnly(), rightIndexOnly()]

export const fingerHeart = (): HandSample[] => [
  hand('Left', -0.35, {
    4: point(-0.08, -1.7),
    8: point(-0.18, -1.82),
  }),
  hand('Right', 0.35, {
    4: point(0.08, -1.7),
    8: point(0.18, -1.82),
  }),
]

export const bigHeart = (): HandSample[] => [
  hand('Left', -1, {
    4: point(-0.12, -1),
    8: point(-0.12, -3),
  }),
  hand('Right', 1, {
    4: point(0.12, -1),
    8: point(0.12, -3),
  }),
]

export const noHands = (): HandSample[] => []

