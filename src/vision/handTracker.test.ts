import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createFromOptions, forVisionTasks } = vi.hoisted(() => ({
  createFromOptions: vi.fn(),
  forVisionTasks: vi.fn(),
}))

vi.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: { forVisionTasks },
  HandLandmarker: { createFromOptions },
}))

import { createHandTracker } from './handTracker'

describe('createHandTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    forVisionTasks.mockResolvedValue({ wasm: true })
  })

  it('converts MediaPipe results to immutable HandSample values', async () => {
    const close = vi.fn()
    const detectForVideo = vi.fn().mockReturnValue({
      landmarks: [[{ x: 0.1, y: 0.2, z: -0.3, visibility: 0.8 }]],
      handedness: [[{
        categoryName: 'Left',
        displayName: 'Left',
        index: 0,
        score: 0.93,
      }]],
      handednesses: [],
      worldLandmarks: [],
    })
    createFromOptions.mockResolvedValue({ close, detectForVideo })

    const tracker = await createHandTracker()
    const hands = tracker.detect({} as HTMLVideoElement, 123)

    expect(hands).toEqual([{
      handedness: 'Left',
      landmarks: [{ x: 0.1, y: 0.2, z: -0.3 }],
      score: 0.93,
    }])
    expect(Object.isFrozen(hands)).toBe(true)
    expect(Object.isFrozen(hands[0])).toBe(true)
    expect(Object.isFrozen(hands[0]?.landmarks)).toBe(true)
    expect(Object.isFrozen(hands[0]?.landmarks[0])).toBe(true)
  })

  it('falls back to CPU once when GPU initialization fails', async () => {
    const landmarker = { close: vi.fn(), detectForVideo: vi.fn() }
    createFromOptions
      .mockRejectedValueOnce(new Error('GPU unavailable'))
      .mockResolvedValueOnce(landmarker)

    await createHandTracker()

    expect(forVisionTasks).toHaveBeenCalledWith('/mediapipe/wasm')
    expect(createFromOptions).toHaveBeenCalledTimes(2)
    expect(createFromOptions.mock.calls.map(([, options]) => options)).toEqual([
      expect.objectContaining({
        baseOptions: expect.objectContaining({ delegate: 'GPU' }),
        runningMode: 'VIDEO',
        numHands: 2,
      }),
      expect.objectContaining({
        baseOptions: expect.objectContaining({ delegate: 'CPU' }),
        runningMode: 'VIDEO',
        numHands: 2,
      }),
    ])
  })
})
