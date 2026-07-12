import { ExtrudeGeometry, Shape } from 'three'

/** Symmetric heart silhouette used by both projectiles and band ornaments. */
export function heartShape(size = 1): Shape {
  const shape = new Shape()
  shape.moveTo(0, -0.7 * size)
  shape.bezierCurveTo(-1.2 * size, -0.05 * size, -0.75 * size, 0.9 * size, 0, 0.35 * size)
  shape.bezierCurveTo(0.75 * size, 0.9 * size, 1.2 * size, -0.05 * size, 0, -0.7 * size)
  return shape
}

/** Beveled, centered extruded heart geometry ready for instancing. */
export function createHeartGeometry(size = 1): ExtrudeGeometry {
  const geometry = new ExtrudeGeometry(heartShape(size), {
    depth: 0.35 * size,
    bevelEnabled: true,
    bevelThickness: 0.08 * size,
    bevelSize: 0.06 * size,
    bevelSegments: 2,
    steps: 1,
  })
  geometry.center()
  return geometry
}
