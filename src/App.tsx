import { useCallback, useMemo, useRef, useState } from 'react'

import { classifyHands } from './gestures/classify'
import { createGestureMachine } from './gestures/machine'
import type { GestureSnapshot, HandSample } from './gestures/types'
import { useAdaptiveQuality } from './performance/useAdaptiveQuality'
import { ExperienceCanvas } from './scene/ExperienceCanvas'
import { CameraStatus } from './ui/CameraStatus'
import { DebugOverlay } from './ui/DebugOverlay'
import { useCamera } from './vision/useCamera'
import { useHandTracking } from './vision/useHandTracking'

const IDLE_SNAPSHOT: GestureSnapshot = {
  kind: 'idle',
  confidence: 0,
  stableKind: 'idle',
  enteredAtMs: 0,
  changed: false,
  fusionProgress: 0,
  releaseProgress: 0,
}

const now = () =>
  typeof performance !== 'undefined' ? performance.now() : Date.now()

const debugEnabled = () =>
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('debug') === '1'

export function App() {
  const camera = useCamera()
  const machineRef = useRef(createGestureMachine())
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [snapshot, setSnapshot] = useState<GestureSnapshot>(IDLE_SNAPSHOT)
  const [sourceSize, setSourceSize] = useState({ width: 16, height: 9 })
  const debug = useMemo(debugEnabled, [])

  const active = camera.status === 'active'
  const quality = useAdaptiveQuality(active)

  const attachVideo = useCallback(
    (node: HTMLVideoElement | null) => {
      camera.videoRef.current = node
      setVideoEl(node)
    },
    [camera.videoRef],
  )

  const handleHands = useCallback((hands: readonly HandSample[]) => {
    const observation = classifyHands(hands as HandSample[])
    setSnapshot(machineRef.current.update(observation, now()))
  }, [])

  const tracker = useHandTracking(videoEl, active, handleHands)

  return (
    <main className={`app-shell${active ? ' app-shell--live' : ''}`}>
      <video
        ref={attachVideo}
        className="camera-feed"
        muted
        playsInline
        aria-hidden="true"
        onLoadedMetadata={(event) => {
          const video = event.currentTarget
          if (video.videoWidth && video.videoHeight) setSourceSize({ width: video.videoWidth, height: video.videoHeight })
        }}
      />

      {active ? (
        <ExperienceCanvas snapshot={snapshot} quality={quality} sourceSize={sourceSize} />
      ) : null}

      {active && debug ? (
        <DebugOverlay snapshot={snapshot} quality={quality} />
      ) : null}

      <CameraStatus
        status={camera.status}
        gesture={snapshot.stableKind}
        onStart={() => void camera.start()}
        onRetry={() => void camera.retry()}
        trackerStatus={tracker.status}
        trackerError={tracker.error}
        onTrackerRetry={tracker.retry}
      />
    </main>
  )
}
