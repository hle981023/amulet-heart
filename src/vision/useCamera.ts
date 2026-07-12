import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'unavailable'
  | 'error'

export type CameraController = Readonly<{
  videoRef: React.RefObject<HTMLVideoElement | null>
  status: CameraStatus
  error: Error | null
  start(): Promise<void>
  retry(): Promise<void>
  stop(): void
}>

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
  },
  audio: false,
}

function statusFor(error: unknown): CameraStatus {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'denied'
  }
  if (error instanceof DOMException && error.name === 'NotFoundError') {
    return 'unavailable'
  }
  return 'error'
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

export function useCamera(): CameraController {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<Error | null>(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    if (mountedRef.current) {
      setStatus('idle')
      setError(null)
    }
  }, [])

  const start = useCallback(async () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStatus('requesting')
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS)
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('active')
    } catch (cause) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (mountedRef.current) {
        setError(asError(cause))
        setStatus(statusFor(cause))
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  return {
    videoRef,
    status,
    error,
    start,
    retry: start,
    stop,
  }
}
