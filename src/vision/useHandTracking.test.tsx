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
})
