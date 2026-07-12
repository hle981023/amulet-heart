import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerOptions,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision'

import type { HandSample, Handedness } from '../gestures/types'

export type HandTracker = Readonly<{
  detect(video: HTMLVideoElement, timestampMs: number): readonly HandSample[]
  close(): void
}>

const LANDMARKER_OPTIONS = {
  runningMode: 'VIDEO',
  numHands: 2,
  minHandDetectionConfidence: 0.55,
  minHandPresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
} as const

function optionsFor(delegate: 'GPU' | 'CPU'): HandLandmarkerOptions {
  return {
    ...LANDMARKER_OPTIONS,
    baseOptions: {
      modelAssetPath: '/mediapipe/hand_landmarker.task',
      delegate,
    },
  }
}

function convertResult(result: HandLandmarkerResult): readonly HandSample[] {
  return Object.freeze(result.landmarks.map((landmarks, index) => {
    const category = result.handedness[index]?.[0]
    const handedness = category?.categoryName as Handedness

    return Object.freeze({
      handedness,
      score: category?.score ?? 0,
      landmarks: Object.freeze(landmarks.map(({ x, y, z }) =>
        Object.freeze({ x, y, z }),
      )),
    })
  }))
}

export async function createHandTracker(): Promise<HandTracker> {
  const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
  let landmarker: HandLandmarker

  try {
    landmarker = await HandLandmarker.createFromOptions(
      vision,
      optionsFor('GPU'),
    )
  } catch {
    landmarker = await HandLandmarker.createFromOptions(
      vision,
      optionsFor('CPU'),
    )
  }

  return Object.freeze({
    detect(video: HTMLVideoElement, timestampMs: number) {
      return convertResult(landmarker.detectForVideo(video, timestampMs))
    },
    close() {
      landmarker.close()
    },
  })
}
