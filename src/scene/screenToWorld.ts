export type SceneViewport = Readonly<{ width: number; height: number }>

export type NormalizedPoint = Readonly<{ x: number; y: number; z: number }>

/**
 * The scene renders in an orthographic space whose extents match the mirrored
 * 16:9 camera preview, so normalized landmark coordinates translate directly
 * into world units the artifacts and effects share.
 */
export const SCENE_VIEWPORT: SceneViewport = { width: 16, height: 9 }

/** Enlarges the manifest scale from model units into the 16:9 world. */
export const SCENE_SCALE = 12

const withoutNegativeZero = (value: number) => (value === 0 ? 0 : value)

/**
 * Maps a normalized MediaPipe point into orthographic scene coordinates.
 * Normalized X grows left→right and Y grows top→bottom, so Y is flipped to the
 * scene's upward axis. Smaller (nearer) Z stays in front of larger Z.
 */
export function screenToWorld(
  point: NormalizedPoint,
  viewport: SceneViewport,
): [number, number, number] {
  const x = withoutNegativeZero((point.x - 0.5) * viewport.width)
  const y = withoutNegativeZero((0.5 - point.y) * viewport.height)
  const z = withoutNegativeZero(-point.z * viewport.width)
  return [x, y, z]
}
