import { readFile } from 'node:fs/promises'

const required = {
  'public/models/amulet-heart.glb': ['AmuletHeartRoot', 'EggBody', 'BlackBand', 'BandHearts', 'BandDrops'],
  'public/models/humpty-lock.glb': ['HumptyLockRoot', 'GoldBody', 'Handle', 'HeartGems', 'Keyhole', 'PlainGoldBack'],
}

for (const [path, names] of Object.entries(required)) {
  const bytes = await readFile(path)
  if (bytes.toString('utf8', 0, 4) !== 'glTF') throw new Error(`${path} is not a GLB`)
  const text = bytes.toString('utf8')
  for (const name of names) if (!text.includes(name)) throw new Error(`${path} missing ${name}`)
  if (bytes.byteLength > 2_500_000) throw new Error(`${path} exceeds 2.5MB`)
}
