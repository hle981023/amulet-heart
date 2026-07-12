import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createHandTracker, detect, close } = vi.hoisted(() => ({
  createHandTracker: vi.fn(),
  detect: vi.fn(),
  close: vi.fn(),
}))

vi.mock('./handTracker', () => ({ createHandTracker }))

import { useHandTracking } from './useHandTracking'

describe('useHandTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createHandTracker.mockResolvedValue({ detect, close })
  })

  it('uses video frame callbacks, skips duplicate frames, and cleans up', async () => {
    const callbacks = new Map<number, VideoFrameRequestCallback>()
    let callbackId = 0
    const requestVideoFrameCallback = vi.fn((callback: VideoFrameRequestCallback) => {
      callbackId += 1
      callbacks.set(callbackId, callback)
      return callbackId
    })
    const cancelVideoFrameCallback = vi.fn((id: number) => callbacks.delete(id))
    const video = {
      currentTime: 1,
      requestVideoFrameCallback,
      cancelVideoFrameCallback,
    } as unknown as HTMLVideoElement
    const hands = Object.freeze([])
    detect.mockReturnValue(hands)
    const onHands = vi.fn()

    const { unmount } = renderHook(() => useHandTracking(video, true, onHands))
    await act(async () => {})

    const firstCallback = callbacks.get(1)
    expect(firstCallback).toBeDefined()
    act(() => firstCallback?.(100, {} as VideoFrameCallbackMetadata))
    expect(detect).toHaveBeenCalledWith(video, 100)
    expect(onHands).toHaveBeenCalledWith(hands)

    const duplicateCallback = callbacks.get(2)
    act(() => duplicateCallback?.(110, {} as VideoFrameCallbackMetadata))
    expect(detect).toHaveBeenCalledOnce()

    unmount()
    expect(cancelVideoFrameCallback).toHaveBeenCalledWith(3)
    expect(close).toHaveBeenCalledOnce()
  })

  it('falls back to animation frames and cancels them during cleanup', async () => {
    let animationCallback: FrameRequestCallback | undefined
    const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
      animationCallback = callback
      return 41
    })
    const cancelAnimationFrame = vi.fn()
    vi.stubGlobal('requestAnimationFrame', requestAnimationFrame)
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame)
    const video = { currentTime: 1 } as HTMLVideoElement
    detect.mockReturnValue(Object.freeze([]))

    const { unmount } = renderHook(() => useHandTracking(video, true, vi.fn()))
    await act(async () => {})
    act(() => animationCallback?.(100))

    expect(detect).toHaveBeenCalledWith(video, 100)
    unmount()
    expect(cancelAnimationFrame).toHaveBeenCalledWith(41)
  })

  it('handles tracker creation failure without an unhandled rejection', async () => {
    createHandTracker.mockRejectedValueOnce(new Error('model unavailable'))
    const video = {} as HTMLVideoElement
    const onHands = vi.fn()
    const { result } = renderHook(() => useHandTracking(video, true, onHands))
    await act(async () => {})
    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('model unavailable')
  })

  it('recreates the tracker when retry is requested', async () => {
    createHandTracker
      .mockRejectedValueOnce(new Error('first failure'))
      .mockResolvedValueOnce({ detect, close })
    const video = { currentTime: 1 } as HTMLVideoElement
    const { result } = renderHook(() => useHandTracking(video, true, vi.fn()))
    await act(async () => {})
    expect(result.current.status).toBe('error')
    act(() => result.current.retry())
    await act(async () => {})
    expect(createHandTracker).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe('ready')
  })

  it('reports inference errors but continues scheduling future frames', async () => {
    const callbacks = new Map<number, VideoFrameRequestCallback>()
    let id = 0
    const video = {
      currentTime: 1,
      requestVideoFrameCallback: vi.fn((cb: VideoFrameRequestCallback) => { callbacks.set(++id, cb); return id }),
      cancelVideoFrameCallback: vi.fn(),
    } as unknown as HTMLVideoElement
    detect.mockImplementationOnce(() => { throw new Error('inference failed') }).mockReturnValueOnce([])
    const { result } = renderHook(() => useHandTracking(video, true, vi.fn()))
    await act(async () => {})
    act(() => callbacks.get(1)?.(100, {} as VideoFrameCallbackMetadata))
    expect(result.current.status).toBe('error')
    video.currentTime = 2
    act(() => callbacks.get(2)?.(110, {} as VideoFrameCallbackMetadata))
    expect(detect).toHaveBeenCalledTimes(2)
  })
})
