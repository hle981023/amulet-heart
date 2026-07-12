import { useCallback, useRef, useState } from 'react'

import { classifyHands } from './gestures/classify'
import { createGestureMachine } from './gestures/machine'
import type { GestureSnapshot, HandSample } from './gestures/types'
import { ExperienceCanvas } from './scene/ExperienceCanvas'
import { useCamera } from './vision/useCamera'
import { useHandTracking } from './vision/useHandTracking'

const IDLE_SNAPSHOT: GestureSnapshot = {
  kind: 'idle',
  confidence: 0,
  stableKind: 'idle',
  enteredAtMs: 0,
  changed: false,
}

const now = () =>
  typeof performance !== 'undefined' ? performance.now() : Date.now()

export function App() {
  const camera = useCamera()
  const machineRef = useRef(createGestureMachine())
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null)
  const [snapshot, setSnapshot] = useState<GestureSnapshot>(IDLE_SNAPSHOT)

  const active = camera.status === 'active'

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

  useHandTracking(videoEl, active, handleHands)

  return (
    <main className={`app-shell${active ? ' app-shell--live' : ''}`}>
      <video
        ref={attachVideo}
        className="camera-feed"
        muted
        playsInline
        aria-hidden="true"
      />

      {active ? <ExperienceCanvas snapshot={snapshot} /> : null}

      {!active ? (
        <section className="start-card">
          <p className="eyebrow">MediaPipe × Three.js</p>
          <h1>Guardian Heart</h1>
          <p>카메라 영상은 이 브라우저 안에서만 처리됩니다.</p>
          <button type="button" onClick={() => void camera.start()}>
            카메라 시작
          </button>
        </section>
      ) : null}
    </main>
  )
}
