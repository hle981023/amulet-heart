import type { Vec3 } from './types'

export const distance = (a: Vec3, b: Vec3) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

export const midpoint = (a: Vec3, b: Vec3): Vec3 => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  z: (a.z + b.z) / 2,
})

export const palmScale = (landmarks: readonly Vec3[]) =>
  Math.max(distance(landmarks[0], landmarks[9]), 0.001)

export const normalizedDistance = (a: Vec3, b: Vec3, scale: number) =>
  distance(a, b) / scale

