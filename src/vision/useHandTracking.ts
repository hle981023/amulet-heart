import { useEffect, useRef } from 'react'

import type { HandSample } from '../gestures/types'
import { createHandTracker } from './handTracker'

export function useHandTracking(
  video: HTMLVideoElement | null,
  enabled: boolean,
  onHands: (hands: readonly HandSample[]) => void,
): void {
  const onHandsRef = useRef(onHands)
  onHandsRef.current = onHands

  useEffect(() => {
    if (!video || !enabled) return

    let cancelled = false
    let videoCallbackId: number | undefined
    let animationCallbackId: number | undefined
    let lastVideoTime = -1

    void createHandTracker().then((tracker) => {
      if (cancelled) {
        tracker.close()
        return
      }

      const infer = (timestampMs: number) => {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime
          onHandsRef.current(tracker.detect(video, timestampMs))
        }
      }

      if ('requestVideoFrameCallback' in video) {
        const onVideoFrame: VideoFrameRequestCallback = (now) => {
          if (cancelled) return
          infer(now)
          videoCallbackId = video.requestVideoFrameCallback(onVideoFrame)
        }
        videoCallbackId = video.requestVideoFrameCallback(onVideoFrame)
      } else {
        const onAnimationFrame: FrameRequestCallback = (now) => {
          if (cancelled) return
          infer(now)
          animationCallbackId = requestAnimationFrame(onAnimationFrame)
        }
        animationCallbackId = requestAnimationFrame(onAnimationFrame)
      }

      cleanupTracker = () => tracker.close()
    }).catch(() => {
      // Camera UI remains usable when model initialization is unavailable.
    })

    let cleanupTracker = () => {}
    return () => {
      cancelled = true
      if (videoCallbackId !== undefined) {
        video.cancelVideoFrameCallback(videoCallbackId)
      }
      if (animationCallbackId !== undefined) {
        cancelAnimationFrame(animationCallbackId)
      }
      cleanupTracker()
    }
  }, [video, enabled])
}
