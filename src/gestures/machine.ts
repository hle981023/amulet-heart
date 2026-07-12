import type {
  GestureKind,
  GestureObservation,
  GestureSnapshot,
} from './types'

const ENTER_DELAY_MS = 150
export const OCCLUSION_GRACE_MS = 150
export const RELEASE_DURATION_MS = 300
export const FUSION_DURATION_MS = 600

export type GestureMachine = Readonly<{
  update: (observation: GestureObservation, nowMs: number) => GestureSnapshot
  reset: () => void
}>

export const createGestureMachine = (): GestureMachine => {
  let candidateKind: GestureObservation['kind'] | undefined
  let candidateSinceMs = 0
  let stableKind: GestureKind = 'idle'
  let enteredAtMs = 0
  let releaseSinceMs: number | undefined
  let fusionSinceMs: number | undefined
  let armed = false
  let lastVisibleMs: number | undefined
  let lastCommitted: GestureObservation | undefined

  const reset = () => {
    candidateKind = undefined
    candidateSinceMs = 0
    stableKind = 'idle'
    enteredAtMs = 0
    releaseSinceMs = undefined
    fusionSinceMs = undefined
    armed = false
    lastVisibleMs = undefined
    lastCommitted = undefined
  }

  const update = (
    observation: GestureObservation,
    nowMs: number,
  ): GestureSnapshot => {
    let changed = false

    let fusionProgress = fusionSinceMs === undefined
      ? armed ? 1 : 0
      : Math.min(1, Math.max(0, (nowMs - fusionSinceMs) / FUSION_DURATION_MS))
    let releaseProgress = 0

    if (observation.kind === 'idle') {
      candidateKind = undefined

      if (lastVisibleMs !== undefined && nowMs - lastVisibleMs <= OCCLUSION_GRACE_MS) {
        return {
          ...(lastCommitted ?? observation),
          kind: 'idle',
          confidence: 0,
          stableKind,
          enteredAtMs,
          changed: false,
          fusionProgress,
          releaseProgress: 0,
        }
      }

      if (stableKind !== 'idle' && stableKind !== 'releasing') {
        stableKind = 'releasing'
        releaseSinceMs = (lastVisibleMs ?? nowMs) + OCCLUSION_GRACE_MS
        enteredAtMs = releaseSinceMs
        changed = true
      }
      if (stableKind === 'releasing' && releaseSinceMs !== undefined) {
        releaseProgress = Math.min(1, (nowMs - releaseSinceMs) / RELEASE_DURATION_MS)
      }
      if (stableKind === 'releasing' && releaseProgress >= 1) {
        stableKind = 'idle'
        releaseSinceMs = undefined
        enteredAtMs = nowMs
        changed = true
        armed = false
        fusionSinceMs = undefined
        lastCommitted = undefined
        lastVisibleMs = undefined
      }
    } else {
      lastVisibleMs = nowMs
      releaseSinceMs = undefined

      const isAttack = observation.kind === 'finger-heart' || observation.kind === 'big-heart'
      if ((isAttack || observation.kind === 'armed') && !armed) {
        return {
          ...(lastCommitted ?? { kind: 'idle' as const, confidence: 0 }),
          kind: observation.kind,
          stableKind,
          enteredAtMs,
          changed: false,
          fusionProgress,
          releaseProgress: 0,
        }
      }

      lastCommitted = observation

      if (isAttack && armed) {
        changed = stableKind !== observation.kind
        stableKind = observation.kind
        if (changed) enteredAtMs = nowMs
      } else if (observation.kind === 'fusing' && stableKind === 'both-ready') {
        stableKind = 'fusing'
        fusionSinceMs = nowMs
        fusionProgress = 0
        enteredAtMs = nowMs
        changed = true
      } else if (observation.kind === 'fusing' && stableKind === 'fusing') {
        fusionProgress = Math.min(1, (nowMs - (fusionSinceMs ?? nowMs)) / FUSION_DURATION_MS)
        if (fusionProgress >= 1) {
          armed = true
          stableKind = 'armed'
          enteredAtMs = nowMs
          changed = true
        }
      } else if (observation.kind === 'fusing' && stableKind === 'armed') {
        fusionProgress = 1
      } else {
        const candidate = observation.kind === 'fusing' ? 'both-ready' : observation.kind
        if (candidateKind !== candidate) {
          candidateKind = candidate
          candidateSinceMs = nowMs
        } else if (stableKind !== candidate && nowMs - candidateSinceMs >= ENTER_DELAY_MS) {
          stableKind = candidate
          enteredAtMs = nowMs
          changed = true
        }
      }
    }

    return {
      ...(observation.kind === 'idle' && lastCommitted ? lastCommitted : observation),
      kind: observation.kind,
      stableKind,
      enteredAtMs,
      changed,
      fusionProgress,
      releaseProgress,
    }
  }

  return { update, reset }
}
