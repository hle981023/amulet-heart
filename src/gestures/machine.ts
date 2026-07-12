import type {
  GestureKind,
  GestureObservation,
  GestureSnapshot,
} from './types'

const ENTER_DELAY_MS = 150
const RELEASE_DURATION_MS = 300

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

  const reset = () => {
    candidateKind = undefined
    candidateSinceMs = 0
    stableKind = 'idle'
    enteredAtMs = 0
    releaseSinceMs = undefined
  }

  const update = (
    observation: GestureObservation,
    nowMs: number,
  ): GestureSnapshot => {
    let changed = false

    if (observation.kind === 'idle') {
      candidateKind = undefined

      if (stableKind !== 'idle' && stableKind !== 'releasing') {
        stableKind = 'releasing'
        releaseSinceMs = nowMs
        enteredAtMs = nowMs
        changed = true
      } else if (
        stableKind === 'releasing' &&
        releaseSinceMs !== undefined &&
        nowMs - releaseSinceMs >= RELEASE_DURATION_MS
      ) {
        stableKind = 'idle'
        releaseSinceMs = undefined
        enteredAtMs = nowMs
        changed = true
      }
    } else if (candidateKind !== observation.kind) {
      candidateKind = observation.kind
      candidateSinceMs = nowMs
    } else if (
      stableKind !== observation.kind &&
      nowMs - candidateSinceMs >= ENTER_DELAY_MS
    ) {
      stableKind = observation.kind
      enteredAtMs = nowMs
      releaseSinceMs = undefined
      changed = true
    }

    return {
      ...observation,
      stableKind,
      enteredAtMs,
      changed,
    }
  }

  return { update, reset }
}
