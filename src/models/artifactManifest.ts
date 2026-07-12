export const createArtifactManifest = (baseUrl: string) => {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return {
    egg: { url: `${base}models/amulet-heart.glb`, root: 'AmuletHeartRoot', scale: 0.22 },
    lock: { url: `${base}models/humpty-lock.glb`, root: 'HumptyLockRoot', scale: 0.18 },
  } as const
}

export const ARTIFACTS = createArtifactManifest(import.meta.env.BASE_URL)
