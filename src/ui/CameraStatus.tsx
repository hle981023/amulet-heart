import type { GestureKind } from '../gestures/types'
import type { CameraStatus as CameraStatusValue } from '../vision/useCamera'
import type { TrackerStatus } from '../vision/useHandTracking'

type CameraStatusProps = Readonly<{
  status: CameraStatusValue
  gesture: GestureKind
  onStart: () => void
  onRetry: () => void
  trackerStatus: TrackerStatus
  trackerError?: string
  onTrackerRetry: () => void
}>

const GESTURE_COPY: Partial<Record<GestureKind, string>> = {
  idle: '손을 카메라 안에 보여주세요',
  'egg-ready': '소품을 합쳐보세요',
  'lock-ready': '소품을 합쳐보세요',
  'both-ready': '소품을 합쳐보세요',
  fusing: '소품을 합쳐보세요',
  armed: '소품을 합쳐보세요',
  'finger-heart': 'FINGER HEART',
  'big-heart': 'BIG HEART',
}

const FIRE_GESTURES: ReadonlySet<GestureKind> = new Set([
  'finger-heart',
  'big-heart',
])

const ERROR_COPY: Partial<Record<CameraStatusValue, string>> = {
  denied: '이 사이트에는 카메라 권한이 필요합니다. 브라우저에서 권한을 허용한 뒤 다시 연결하세요.',
  unavailable: '카메라를 찾을 수 없습니다. 장치를 확인한 뒤 다시 연결하세요.',
  error: '카메라를 시작하지 못했습니다. 다시 연결해 주세요.',
}

/**
 * Overlays permission, loading, gesture, and recovery messaging above the scene.
 * Camera images never leave the browser, so copy stays privacy-forward.
 */
export function CameraStatus({
  status,
  gesture,
  onStart,
  onRetry,
  trackerStatus,
  trackerError,
  onTrackerRetry,
}: CameraStatusProps) {
  if (status === 'active') {
    if (trackerStatus === 'loading' || trackerStatus === 'idle') {
      return <div className="gesture-banner" role="status">손 인식 모델을 불러오는 중…</div>
    }
    if (trackerStatus === 'error') {
      return (
        <section className="status-card">
          <p className="status-card__error" role="alert">
            손 인식 모델을 시작하지 못했습니다. {trackerError ?? ''}
          </p>
          <button type="button" onClick={onTrackerRetry}>손 인식 다시 시도</button>
        </section>
      )
    }
    const copy = GESTURE_COPY[gesture]
    if (!copy) return null
    const fire = FIRE_GESTURES.has(gesture)
    return (
      <div
        className={`gesture-banner${fire ? ' gesture-banner--fire' : ''}`}
        role="status"
      >
        {copy}
      </div>
    )
  }

  if (status === 'requesting') {
    return (
      <section className="status-card">
        <p className="status-card__hint" role="status">
          카메라를 연결하는 중…
        </p>
      </section>
    )
  }

  if (status === 'denied' || status === 'unavailable' || status === 'error') {
    return (
      <section className="status-card">
        <p className="status-card__error" role="alert">
          {ERROR_COPY[status]}
        </p>
        <button type="button" onClick={onRetry}>
          카메라 다시 연결
        </button>
      </section>
    )
  }

  return (
    <section className="start-card">
      <p className="eyebrow">MediaPipe × Three.js</p>
      <h1>Guardian Heart</h1>
      <p>카메라 영상은 이 브라우저 안에서만 처리됩니다.</p>
      <button type="button" onClick={onStart}>
        카메라 시작
      </button>
    </section>
  )
}
