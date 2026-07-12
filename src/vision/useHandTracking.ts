import { useCallback, useEffect, useRef, useState } from 'react'

import type { HandSample } from '../gestures/types'
import { createHandTracker } from './handTracker'

export function useHandTracking(
  video: HTMLVideoElement | null,
  enabled: boolean,
  onHands: (hands: readonly HandSample[]) => void,
): HandTrackingState {
  const onHandsRef = useRef(onHands)
  onHandsRef.current = onHands
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<Omit<HandTrackingState, 'retry'>>({ status: 'idle' })
  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  useEffect(() => {
    if (!video || !enabled) {
      setState({ status: 'idle' })
      return
    }

    let cancelled = false
    let videoCallbackId: number | undefined
    let animationCallbackId: number | undefined
    let lastVideoTime = -1

    setState({ status: 'loading' })
    void createHandTracker().then((tracker) => {
      if (cancelled) {
        tracker.close()
        return
      }

      const infer = (timestampMs: number) => {
        if (video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime
          try {
            onHandsRef.current(tracker.detect(video, timestampMs))
            setState((current) => current.status === 'error' ? { status: 'ready' } : current)
          } catch (error) {
            setState({ status: 'error', error: messageOf(error) })
          }
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
      setState({ status: 'ready' })
    }).catch((error: unknown) => {
      if (!cancelled) setState({ status: 'error', error: messageOf(error) })
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
  }, [video, enabled, attempt])

  return { ...state, retry }
}

export type TrackerStatus = 'idle' | 'loading' | 'ready' | 'error'

export type HandTrackingState = Readonly<{
  status: TrackerStatus
  error?: string
  retry: () => void
}>

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : '알 수 없는 오류'
