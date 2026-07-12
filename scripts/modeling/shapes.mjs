import * as THREE from 'three'

export function heartShape(size = 1) {
  const s = new THREE.Shape()
  s.moveTo(0, -0.7 * size)
  s.bezierCurveTo(-1.2 * size, -0.05 * size, -0.75 * size, 0.9 * size, 0, 0.35 * size)
  s.bezierCurveTo(0.75 * size, 0.9 * size, 1.2 * size, -0.05 * size, 0, -0.7 * size)
  return s
}

export function dropShape(size = 1) {
  const s = new THREE.Shape()
  s.moveTo(0, -0.82 * size)
  s.lineTo(-0.48 * size, 0.2 * size)
  s.quadraticCurveTo(0, 0.62 * size, 0.48 * size, 0.2 * size)
  s.closePath()
  return s
}

export function roundedRectShape(width, height, radius) {
  const x = -width / 2
  const y = -height / 2
  const s = new THREE.Shape()
  s.moveTo(x + radius, y)
  s.lineTo(x + width - radius, y)
  s.quadraticCurveTo(x + width, y, x + width, y + radius)
  s.lineTo(x + width, y + height - radius)
  s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  s.lineTo(x + radius, y + height)
  s.quadraticCurveTo(x, y + height, x, y + height - radius)
  s.lineTo(x, y + radius)
  s.quadraticCurveTo(x, y, x + radius, y)
  return s
}

export function roundedExtrusion(width, height, depth, radius, bevel = 0.12) {
  return new THREE.ExtrudeGeometry(roundedRectShape(width, height, radius), {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 10,
  })
}

export function eggGeometry() {
  const points = []
  const steps = 30
  for (let i = 0; i <= steps; i += 1) {
    const y = -1.75 + (3.5 * i) / steps
    const t = (y + 1.75) / 3.5
    const round = Math.sqrt(Math.max(0, 1 - ((y - 0.03) / 1.79) ** 2))
    const taper = 1.02 - 0.25 * Math.max(0, t - 0.42)
    points.push(new THREE.Vector2(1.34 * round * taper, y))
  }
  const geometry = new THREE.LatheGeometry(points, 36)
  geometry.rotateY(Math.PI / 36)
  return geometry.toNonIndexed()
}

export function facetedHeartGeometry(size, depth = 0.12) {
  const geometry = new THREE.ExtrudeGeometry(heartShape(size), {
    depth,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: depth * 0.42,
    bevelThickness: depth * 0.32,
    curveSegments: 4,
  })
  geometry.computeVertexNormals()
  return geometry
}

export function torusHandle() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.18, 0, 0),
    new THREE.Vector3(-1.42, 0.65, 0),
    new THREE.Vector3(-1.12, 1.58, 0),
    new THREE.Vector3(0, 2.02, 0),
    new THREE.Vector3(1.12, 1.58, 0),
    new THREE.Vector3(1.42, 0.65, 0),
    new THREE.Vector3(1.18, 0, 0),
  ], false, 'centripetal')
  return new THREE.TubeGeometry(curve, 56, 0.25, 10, false)
}

export function radialGemFacets(geometry) {
  const position = geometry.getAttribute('position')
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i)
    const y = position.getY(i)
    const z = position.getZ(i)
    if (z > 0.08) position.setZ(i, z + 0.055 * Math.cos(Math.atan2(y, x) * 5))
  }
  position.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

export function circularPlacement(count, radius, callback, phase = 0) {
  return Array.from({ length: count }, (_, index) => {
    const angle = phase + (index / count) * Math.PI * 2
    return callback({ index, angle, x: Math.sin(angle) * radius, z: Math.cos(angle) * radius })
  })
}

