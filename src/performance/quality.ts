export type QualityLevel = 'high' | 'medium' | 'low'

export type QualityProfile = Readonly<{
  particlePool: number
  dpr: number
  lighting: boolean
  glowIntensity: number
}>

/** Ordered from lowest to highest fidelity for level comparisons. */
export const QUALITY_ORDER: readonly QualityLevel[] = ['low', 'medium', 'high']

export const QUALITY: Record<QualityLevel, QualityProfile> = {
  high: { particlePool: 96, dpr: 1.5, lighting: true, glowIntensity: 1 },
  medium: { particlePool: 64, dpr: 1, lighting: true, glowIntensity: 0.7 },
  low: { particlePool: 32, dpr: 0.75, lighting: false, glowIntensity: 0.4 },
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
