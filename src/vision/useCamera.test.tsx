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

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
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

  it('stops a stream that resolves after stop invalidates its request', async () => {
    const pending = deferred<MediaStream>()
    const { stream, stop } = createStream()
    const getUserMedia = vi.fn().mockReturnValue(pending.promise)
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    const { result } = renderHook(() => useCamera())

    let startPromise!: Promise<void>
    act(() => {
      startPromise = result.current.start()
    })
    act(() => result.current.stop())
    await act(async () => {
      pending.resolve(stream)
      await startPromise
    })

    expect(stop).toHaveBeenCalledOnce()
    expect(result.current.status).toBe('idle')
  })

  it('ignores an older request failure after a newer request succeeds', async () => {
    const first = deferred<MediaStream>()
    const second = deferred<MediaStream>()
    const { stream: activeStream, stop: stopActiveStream } = createStream()
    const getUserMedia = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
    const { result } = renderHook(() => useCamera())

    let firstStart!: Promise<void>
    let secondStart!: Promise<void>
    act(() => {
      firstStart = result.current.start()
      secondStart = result.current.start()
    })
    await act(async () => {
      second.resolve(activeStream)
      await secondStart
    })
    await act(async () => {
      first.reject(new DOMException('denied', 'NotAllowedError'))
      await firstStart
    })

    expect(result.current.status).toBe('active')
    expect(result.current.error).toBeNull()
    expect(stopActiveStream).not.toHaveBeenCalled()
  })
})
