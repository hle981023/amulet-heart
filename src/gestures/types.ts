export type Vec3 = Readonly<{ x: number; y: number; z: number }>

export type Handedness = 'Left' | 'Right'

export type HandSample = Readonly<{
  handedness: Handedness
  landmarks: readonly Vec3[]
  score: number
}>

export type GestureKind =
  | 'idle'
  | 'egg-ready'
  | 'lock-ready'
  | 'both-ready'
  | 'fusing'
  | 'armed'
  | 'finger-heart'
  | 'big-heart'
  | 'releasing'

export type GestureObservation = Readonly<{
  kind: Exclude<GestureKind, 'releasing'>
  leftIndex?: Vec3
  rightIndex?: Vec3
  effectOrigin?: Vec3
  confidence: number
}>

export type GestureSnapshot = GestureObservation &
  Readonly<{
    stableKind: GestureKind
    enteredAtMs: number
    changed: boolean
  }>

