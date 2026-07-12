import { useEffect, useState } from 'react'

import { nextQuality, QUALITY_ORDER, type QualityLevel } from './quality'

const DOWNGRADE_HOLD_MS = 2000
const UPGRADE_HOLD_MS = 5000
const EMA_WEIGHT = 0.1

/**
 * Measures a smoothed frame rate and applies {@link nextQuality} with sustained
 * hysteresis: a downgrade needs two seconds below target, a recovery five
 * seconds above it. Only runs while `enabled`, and re-renders solely on change.
 */
export function useAdaptiveQuality(enabled: boolean): QualityLevel {
  const [quality, setQuality] = useState<QualityLevel>('high')

  useEffect(() => {
    if (!enabled || typeof requestAnimationFrame === 'undefined') return

    let frame = 0
    let last = performance.now()
    let ema = 60
    let current: QualityLevel = 'high'
    let pendingSince = 0
    let pendingLevel: QualityLevel | null = null
    setQuality('high')

    const loop = (time: number) => {
      const delta = time - last
      last = time
      if (delta > 0) ema = ema * (1 - EMA_WEIGHT) + (1000 / delta) * EMA_WEIGHT

      const candidate = nextQuality(current, ema)
      if (candidate === current) {
        pendingLevel = null
        pendingSince = 0
      } else {
        if (candidate !== pendingLevel) {
          pendingLevel = candidate
          pendingSince = time
        }
        const downgrade =
          QUALITY_ORDER.indexOf(candidate) < QUALITY_ORDER.indexOf(current)
        const hold = downgrade ? DOWNGRADE_HOLD_MS : UPGRADE_HOLD_MS
        if (time - pendingSince >= hold) {
          current = candidate
          pendingLevel = null
          pendingSince = 0
          setQuality(candidate)
        }
      }

      frame = requestAnimationFrame(loop)
    }

    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [enabled])

  return quality
}
