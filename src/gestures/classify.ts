import { midpoint, normalizedDistance, palmScale } from './geometry'
import type { GestureObservation, HandSample, Vec3 } from './types'

const THUMB_TIP = 4
const INDEX_TIP = 8
const OTHER_FINGERTIPS = [12, 16, 20] as const

const confidenceOf = (hands: readonly HandSample[]) =>
  Math.min(...hands.map((hand) => hand.score))

const centerOf = (points: readonly Vec3[]): Vec3 => ({
  x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
  y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  z: points.reduce((sum, point) => sum + point.z, 0) / points.length,
})

const isIndexOnly = (hand: HandSample) => {
  const scale = palmScale(hand.landmarks)
  const wrist = hand.landmarks[0]

  return (
    normalizedDistance(hand.landmarks[INDEX_TIP], wrist, scale) > 1.6 &&
    OTHER_FINGERTIPS.every(
      (index) => normalizedDistance(hand.landmarks[index], wrist, scale) < 1.25,
    )
  )
}

const heartObservation = (
  kind: 'finger-heart' | 'big-heart',
  left: HandSample,
  right: HandSample,
): GestureObservation => {
  const leftIndex = left.landmarks[INDEX_TIP]
  const rightIndex = right.landmarks[INDEX_TIP]

  return {
    kind,
    leftIndex,
    rightIndex,
    effectOrigin: midpoint(leftIndex, rightIndex),
    confidence: confidenceOf([left, right]),
  }
}

export const classifyHands = (hands: HandSample[]): GestureObservation => {
  const visible = hands
    .filter((hand) => hand.landmarks.length >= 21)
    .sort((a, b) => a.landmarks[INDEX_TIP].x - b.landmarks[INDEX_TIP].x)

  if (visible.length >= 2) {
    const [left, right] = visible
    const scale = (palmScale(left.landmarks) + palmScale(right.landmarks)) / 2
    const leftThumb = left.landmarks[THUMB_TIP]
    const rightThumb = right.landmarks[THUMB_TIP]
    const leftIndex = left.landmarks[INDEX_TIP]
    const rightIndex = right.landmarks[INDEX_TIP]
    const thumbGap = normalizedDistance(leftThumb, rightThumb, scale)
    const indexGap = normalizedDistance(leftIndex, rightIndex, scale)
    const leftSpan = normalizedDistance(leftThumb, leftIndex, scale)
    const rightSpan = normalizedDistance(rightThumb, rightIndex, scale)

    const isLargeHeart =
      thumbGap < 0.55 &&
      indexGap < 0.55 &&
      leftSpan > 1.2 &&
      rightSpan > 1.2 &&
      Math.abs(leftSpan - rightSpan) < 0.5

    if (isLargeHeart) return heartObservation('big-heart', left, right)

    const isCompactHeart =
      leftSpan < 0.4 &&
      rightSpan < 0.4 &&
      normalizedDistance(
        midpoint(leftThumb, leftIndex),
        midpoint(rightThumb, rightIndex),
        scale,
      ) < 0.75

    if (isCompactHeart) return heartObservation('finger-heart', left, right)
  }

  const summons = visible.filter(isIndexOnly)

  if (summons.length >= 2) {
    const left = summons[0]
    const right = summons[summons.length - 1]
    const leftIndex = left.landmarks[INDEX_TIP]
    const rightIndex = right.landmarks[INDEX_TIP]

    return {
      kind: 'both-ready',
      leftIndex,
      rightIndex,
      effectOrigin: midpoint(leftIndex, rightIndex),
      confidence: confidenceOf([left, right]),
    }
  }

  if (summons.length === 1) {
    const hand = summons[0]
    const index = hand.landmarks[INDEX_TIP]
    const isScreenLeft = index.x < 0.5

    return {
      kind: isScreenLeft ? 'egg-ready' : 'lock-ready',
      ...(isScreenLeft ? { leftIndex: index } : { rightIndex: index }),
      effectOrigin: centerOf([index]),
      confidence: hand.score,
    }
  }

  return { kind: 'idle', confidence: 0 }
}
