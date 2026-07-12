export type QualityLevel = 'high' | 'medium' | 'low'

export type QualityProfile = Readonly<{
  particlePool: number
  shadowResolution: number
  bloomResolution: number
  /** Model geometry detail is never reduced, so gestures stay accurate. */
  modelDetail: number
}>

/** Ordered from lowest to highest fidelity for level comparisons. */
export const QUALITY_ORDER: readonly QualityLevel[] = ['low', 'medium', 'high']

export const QUALITY: Record<QualityLevel, QualityProfile> = {
  high: { particlePool: 96, shadowResolution: 1024, bloomResolution: 1, modelDetail: 1 },
  medium: { particlePool: 64, shadowResolution: 512, bloomResolution: 0.6, modelDetail: 1 },
  low: { particlePool: 32, shadowResolution: 0, bloomResolution: 0, modelDetail: 1 },
}

const DOWNGRADE_TO_MEDIUM_FPS = 27
const DOWNGRADE_TO_LOW_FPS = 22
const RECOVER_FPS = 34

/**
 * Pure quality policy. Sheds bloom, then shadows, then particles as FPS falls,
 * and recovers a single level once FPS is comfortably high. The caller is
 * responsible for the sustained-time hysteresis around each transition.
 */
export function nextQuality(
  current: QualityLevel,
  averageFps: number,
): QualityLevel {
  if (current === 'high' && averageFps < DOWNGRADE_TO_MEDIUM_FPS) return 'medium'
  if (current === 'medium' && averageFps < DOWNGRADE_TO_LOW_FPS) return 'low'
  if (current === 'low' && averageFps > RECOVER_FPS) return 'medium'
  if (current === 'medium' && averageFps > RECOVER_FPS) return 'high'
  return current
}
