import type { GestureSnapshot, Vec3 } from '../gestures/types'
import type { QualityLevel } from '../performance/quality'

type DebugOverlayProps = Readonly<{
  snapshot: GestureSnapshot
  quality: QualityLevel
}>

const POINTS: ReadonlyArray<[key: keyof GestureSnapshot, color: string]> = [
  ['leftIndex', '#7cf5d2'],
  ['rightIndex', '#ffd166'],
  ['effectOrigin', '#ff5c9e'],
]

/**
 * Opt-in `?debug=1` heads-up display: the stable state plus dots at the tracked
 * landmark points, mirrored to match the preview.
 */
export function DebugOverlay({ snapshot, quality }: DebugOverlayProps) {
  return (
    <div className="debug-overlay" aria-hidden="true">
      <svg className="debug-overlay__points" viewBox="0 0 100 100" preserveAspectRatio="none">
        {POINTS.map(([key, color]) => {
          const point = snapshot[key] as Vec3 | undefined
          if (!point) return null
          return (
            <circle
              key={key}
              cx={point.x * 100}
              cy={point.y * 100}
              r={1.4}
              fill={color}
            />
          )
        })}
      </svg>
      <dl className="debug-overlay__hud">
        <div>
          <dt>stable</dt>
          <dd>{snapshot.stableKind}</dd>
        </div>
        <div>
          <dt>raw</dt>
          <dd>{snapshot.kind}</dd>
        </div>
        <div>
          <dt>conf</dt>
          <dd>{snapshot.confidence.toFixed(2)}</dd>
        </div>
        <div>
          <dt>quality</dt>
          <dd>{quality}</dd>
        </div>
      </dl>
    </div>
  )
}
