import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useCamera } from './useCamera'

function createStream() {
  const stop = vi.fn()
  return {
    stream: { getTracks: () => [{ stop }] } as unknown as MediaStream,
    stop,
  }
}

describe('useCamera', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reports denied permission and retries', async () => {
    const { stream } = createStream()
    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'))
      .mockResolvedValueOnce(stream)
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })

    const { result } = renderHook(() => useCamera())
    await act(() => result.current.start())
    expect(result.current.status).toBe('denied')

    await act(() => result.current.retry())
    expect(getUserMedia).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe('active')
  })

  it('requests the private video constraints and stops every track', async () => {
    const { stream, stop } = createStream()
    const getUserMedia = vi.fn().mockResolvedValue(stream)
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })

    const { result, unmount } = renderHook(() => useCamera())
    await act(() => result.current.start())

    expect(getUserMedia).toHaveBeenCalledWith({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    })

    unmount()
    expect(stop).toHaveBeenCalledOnce()
  })

  it.each([
    ['NotFoundError', 'unavailable'],
    ['AbortError', 'error'],
  ] as const)('maps %s to %s', async (name, expectedStatus) => {
    const getUserMedia = vi
      .fn()
      .mockRejectedValue(new DOMException('camera failure', name))
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })

    const { result } = renderHook(() => useCamera())
    await act(() => result.current.start())

    expect(result.current.status).toBe(expectedStatus)
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
