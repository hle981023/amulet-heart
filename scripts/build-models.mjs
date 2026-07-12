import { mkdir, writeFile } from 'node:fs/promises'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { materials } from './modeling/materials.mjs'
import {
  circularPlacement,
  dropShape,
  eggGeometry,
  facetedHeartGeometry,
  radialGemFacets,
  roundedExtrusion,
  torusHandle,
} from './modeling/shapes.mjs'

globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = result
      this.onloadend?.({ target: this })
    })
  }

  readAsDataURL(blob) {
    blob.arrayBuffer().then((result) => {
      this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`
      this.onloadend?.({ target: this })
    })
  }
}

function assignCheckerFacets(geometry) {
  const triangles = geometry.getAttribute('position').count / 3
  geometry.clearGroups()
  for (let triangle = 0; triangle < triangles; triangle += 1) {
    const band = Math.floor(triangle / 72)
    geometry.addGroup(triangle * 3, 3, (triangle + band) % 2)
  }
}

function makeEgg() {
  const root = new THREE.Group()
  root.name = 'AmuletHeartRoot'

  const bodyGeometry = eggGeometry()
  assignCheckerFacets(bodyGeometry)
  const body = new THREE.Mesh(bodyGeometry, [materials.blush, materials.rose])
  body.name = 'EggBody'
  root.add(body)

  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.365, 1.365, 0.4, 48, 1, false), materials.black)
  band.name = 'BlackBand'
  root.add(band)

  const hearts = new THREE.Group()
  hearts.name = 'BandHearts'
  const heartGeometry = facetedHeartGeometry(0.23, 0.12)
  circularPlacement(12, 1.385, ({ index, angle, x, z }) => {
    const heart = new THREE.Mesh(heartGeometry, materials.palePink)
    heart.name = `RaisedHeart_${String(index + 1).padStart(2, '0')}`
    heart.position.set(x, 0.09, z)
    heart.rotation.set(0, angle, 0)
    hearts.add(heart)
  })
  root.add(hearts)

  const drops = new THREE.Group()
  drops.name = 'BandDrops'
  const dropGeometry = new THREE.ExtrudeGeometry(dropShape(0.21), { depth: 0.1, bevelEnabled: true, bevelSegments: 1, bevelSize: 0.025, bevelThickness: 0.025, curveSegments: 4 })
  circularPlacement(12, 1.32, ({ index, angle, x, z }) => {
    for (const y of [-0.43, 0.5]) {
      const drop = new THREE.Mesh(dropGeometry, materials.black)
      drop.name = `${y < 0 ? 'Lower' : 'Upper'}Drop_${String(index + 1).padStart(2, '0')}`
      drop.position.set(x, y, z)
      drop.rotation.set(0, angle, y > 0 ? Math.PI : 0)
      drops.add(drop)
    }
  }, Math.PI / 12)
  root.add(drops)
  return root
}

function addGem(group, x, y, rotation, size = 0.47) {
  const geometry = radialGemFacets(facetedHeartGeometry(size, 0.2))
  const gem = new THREE.Mesh(geometry, materials.pearlPink)
  gem.name = `PearlHeartGem_${group.children.length + 1}`
  gem.position.set(x, y, 0.57)
  gem.rotation.z = rotation
  group.add(gem)
}

function makeLock() {
  const root = new THREE.Group()
  root.name = 'HumptyLockRoot'

  const bodyGeometry = roundedExtrusion(3.1, 2.45, 0.72, 0.55, 0.16)
  bodyGeometry.translate(0, -1.25, -0.36)
  const body = new THREE.Mesh(bodyGeometry, materials.gold)
  body.name = 'GoldBody'
  root.add(body)

  const handle = new THREE.Mesh(torusHandle(), materials.gold)
  handle.name = 'Handle'
  handle.position.set(0, 0.15, -0.08)
  root.add(handle)

  const backGeometry = roundedExtrusion(2.82, 2.2, 0.08, 0.43, 0.06)
  backGeometry.translate(0, -1.25, -0.58)
  const back = new THREE.Mesh(backGeometry, materials.gold)
  back.name = 'PlainGoldBack'
  root.add(back)

  const gems = new THREE.Group()
  gems.name = 'HeartGems'
  addGem(gems, -0.92, -0.72, -0.22)
  addGem(gems, 0.92, -0.72, 0.22)
  addGem(gems, -0.61, 0.23, -0.1, 0.4)
  addGem(gems, 0.61, 0.23, 0.1, 0.4)
  root.add(gems)

  const ornament = new THREE.Group()
  ornament.name = 'CentralGoldOrnament'
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.12, 10, 32), materials.darkGold)
  halo.position.set(0, -0.56, 0.69)
  ornament.add(halo)
  const crown = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 1), materials.gold)
  crown.scale.set(1, 1.22, 0.42)
  crown.position.set(0, 0.18, 0.68)
  ornament.add(crown)
  root.add(ornament)

  const keyhole = new THREE.Group()
  keyhole.name = 'Keyhole'
  const keyCircle = new THREE.Mesh(new THREE.CircleGeometry(0.13, 24), materials.black)
  keyCircle.position.set(0, -0.5, 0.825)
  keyhole.add(keyCircle)
  const keyStem = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.34, 3), materials.black)
  keyStem.position.set(0, -0.73, 0.825)
  keyStem.rotation.z = Math.PI
  keyStem.rotation.x = Math.PI / 2
  keyhole.add(keyStem)
  root.add(keyhole)
  return root
}

async function exportModel(object, path) {
  const scene = new THREE.Scene()
  scene.add(object)
  const exporter = new GLTFExporter()
  const result = await exporter.parseAsync(scene, { binary: true, onlyVisible: true })
  await writeFile(path, Buffer.from(result))
}

await mkdir('public/models', { recursive: true })
await exportModel(makeEgg(), 'public/models/amulet-heart.glb')
await exportModel(makeLock(), 'public/models/humpty-lock.glb')

