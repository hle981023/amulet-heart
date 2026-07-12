import { readFile } from 'node:fs/promises'
import { eggGeometry } from './modeling/shapes.mjs'

const failures = []

function auditEggPoles() {
  const geometry = eggGeometry()
  const positions = geometry.getAttribute('position')
  let minY = Infinity
  let maxY = -Infinity

  for (let index = 0; index < positions.count; index += 1) {
    minY = Math.min(minY, positions.getY(index))
    maxY = Math.max(maxY, positions.getY(index))
  }

  const radii = {}
  for (const [label, poleY] of [['bottom', minY], ['top', maxY]]) {
    let maxRadius = 0
    for (let index = 0; index < positions.count; index += 1) {
      if (Math.abs(positions.getY(index) - poleY) > 1e-6) continue
      maxRadius = Math.max(maxRadius, Math.hypot(positions.getX(index), positions.getZ(index)))
    }
    radii[label] = maxRadius
    if (maxRadius > 1e-5) failures.push(`EggBody ${label} pole is open (radius ${maxRadius.toFixed(6)})`)
  }
  return radii
}

async function auditEggPrimitiveCount() {
  const bytes = await readFile('public/models/amulet-heart.glb')
  const jsonLength = bytes.readUInt32LE(12)
  const gltf = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8').replaceAll('\0', '').trim())
  const eggNode = gltf.nodes.find((node) => node.name === 'EggBody')
  const primitives = eggNode?.mesh === undefined ? [] : gltf.meshes[eggNode.mesh]?.primitives ?? []
  if (primitives.length > 4) failures.push(`EggBody has ${primitives.length} GLB primitives (maximum 4)`)
  return primitives.length
}

const poleRadii = auditEggPoles()
const primitiveCount = await auditEggPrimitiveCount()

if (failures.length) throw new Error(`Model audit failed:\n- ${failures.join('\n- ')}`)
console.log(`Model audit passed: EggBody pole radii bottom=${poleRadii.bottom.toFixed(6)}, top=${poleRadii.top.toFixed(6)}; GLB primitives=${primitiveCount}`)
