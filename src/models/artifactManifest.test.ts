import { describe, expect, it } from 'vitest'

import { createArtifactManifest } from './artifactManifest'

describe('createArtifactManifest', () => {
  it('uses the Vite base path for both GLB assets', () => {
    expect(createArtifactManifest('/guardian-heart/')).toMatchObject({
      egg: { url: '/guardian-heart/models/amulet-heart.glb' },
      lock: { url: '/guardian-heart/models/humpty-lock.glb' },
    })
  })
})
