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
  const requestGenerationRef = useRef(0)
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<Error | null>(null)

  const stop = useCallback(() => {
    requestGenerationRef.current += 1
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    if (mountedRef.current) {
      setStatus('idle')
      setError(null)
    }
  }, [])

  const start = useCallback(async () => {
    const requestGeneration = requestGenerationRef.current + 1
    requestGenerationRef.current = requestGeneration
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('requesting')
    setError(null)

    let acquiredStream: MediaStream | null = null
    try {
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS)
      acquiredStream = stream
      if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      if (!mountedRef.current || requestGeneration !== requestGenerationRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        if (streamRef.current === stream) streamRef.current = null
        if (videoRef.current?.srcObject === stream) videoRef.current.srcObject = null
        return
      }
      setStatus('active')
    } catch (cause) {
      acquiredStream?.getTracks().forEach((track) => track.stop())
      if (streamRef.current === acquiredStream) streamRef.current = null
      if (videoRef.current?.srcObject === acquiredStream) {
        videoRef.current.srcObject = null
      }
      if (mountedRef.current && requestGeneration === requestGenerationRef.current) {
        setError(asError(cause))
        setStatus(statusFor(cause))
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      requestGenerationRef.current += 1
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
