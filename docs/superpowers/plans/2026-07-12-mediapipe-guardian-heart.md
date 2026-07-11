# MediaPipe Guardian Heart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a desktop webcam experience that summons two fully 3D magical artifacts from hand gestures and fires procedural negative-heart effects from small and large two-hand heart poses.

**Architecture:** A React shell owns camera permission and application status, a MediaPipe adapter emits normalized hand samples, and pure gesture/state modules convert samples into stable semantic states. React Three Fiber renders GLB artifacts and procedural effects from those states without depending on MediaPipe internals.

**Tech Stack:** Vite, React, TypeScript, MediaPipe Tasks Vision Hand Landmarker, Three.js, React Three Fiber, Drei, Vitest, React Testing Library, Playwright.

## Global Constraints

- Target Chrome and Edge desktop first.
- Process webcam frames and hand landmarks only in the browser; never upload them.
- Request at most two hands from MediaPipe.
- Mirror the 720p camera preview and target at least 30fps on an ordinary desktop.
- Stabilize a new gesture for 150ms before committing it.
- Fade released artifacts and effects over 300ms.
- Emit small hearts at about four per second and strong hearts every 900ms while held.
- Keep Amu character artwork, recording, saving, and mobile optimization out of the first release.
- End every task with tests, an intentional commit, and a push to `origin/codex/guardian-heart`.

---

## File Structure

```text
package.json                         scripts and dependency boundary
src/App.tsx                          top-level camera, state, scene integration
src/styles.css                       full-screen camera and status UI
src/gestures/types.ts                shared landmark and state types
src/gestures/geometry.ts             normalized distance and angle helpers
src/gestures/classify.ts             stateless hand-pose classification
src/gestures/machine.ts              150ms stabilization and release state machine
src/vision/handTracker.ts            MediaPipe Tasks Vision adapter
src/vision/useCamera.ts              camera permission and MediaStream lifecycle
src/vision/useHandTracking.ts        video-frame scheduling and landmark delivery
src/models/artifactManifest.ts       model URLs, scales, and rotations
src/scene/ExperienceCanvas.tsx       camera-aligned React Three Fiber scene
src/scene/Artifact.tsx               GLB loading, smoothing, and rotation
src/effects/effectSchedule.ts        pure emission timing logic
src/effects/BeamBurst.tsx            vertical light burst
src/effects/HeartEmitter.tsx         procedural heart projectiles and trails
src/effects/Shockwave.tsx            strong-heart radial ring
src/effects/EffectController.tsx     maps semantic gesture state to effects
src/ui/CameraStatus.tsx              permission, loading, and retry messaging
src/performance/quality.ts           adaptive visual quality policy
scripts/build-models.mjs             generates both full 3D GLB artifacts
scripts/validate-models.mjs          validates required GLB nodes and sizes
public/models/*.glb                  generated production model assets
tests/fixtures/hands.ts              deterministic landmark fixtures
tests/e2e/experience.spec.ts         browser smoke and permission-error tests
```

---

### Task 1: Scaffold the Tested Webcam Application Shell

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `App(): JSX.Element`, the root integration surface used by all later tasks.
- Produces: scripts `dev`, `build`, `test`, `test:run`, `typecheck`, and `e2e`.

- [ ] **Step 1: Initialize dependencies and scripts**

Run:

```bash
pnpm init
pnpm add react react-dom three @react-three/fiber @react-three/drei @mediapipe/tasks-vision
pnpm add -D typescript vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/react @types/react-dom @types/three playwright
```

Set these exact scripts in `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b --pretty false",
    "test": "vitest",
    "test:run": "vitest run",
    "e2e": "playwright test",
    "models:build": "node scripts/build-models.mjs",
    "models:validate": "node scripts/validate-models.mjs"
  }
}
```

- [ ] **Step 2: Write the failing shell test**

```tsx
// src/App.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'

describe('App', () => {
  it('starts with a privacy-safe camera prompt', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Guardian Heart' })).toBeInTheDocument()
    expect(screen.getByText('카메라 영상은 이 브라우저 안에서만 처리됩니다.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '카메라 시작' })).toBeEnabled()
  })
})
```

- [ ] **Step 3: Run the test and verify the missing implementation**

Run: `pnpm test:run src/App.test.tsx`

Expected: FAIL because `App` and the test setup do not exist.

- [ ] **Step 4: Implement the smallest accessible shell**

```tsx
// src/App.tsx
export function App() {
  return (
    <main className="app-shell">
      <section className="start-card">
        <p className="eyebrow">MediaPipe × Three.js</p>
        <h1>Guardian Heart</h1>
        <p>카메라 영상은 이 브라우저 안에서만 처리됩니다.</p>
        <button type="button">카메라 시작</button>
      </section>
    </main>
  )
}
```

Configure Vitest with `environment: 'jsdom'`, `setupFiles: ['./src/test/setup.ts']`, and import `@testing-library/jest-dom/vitest` from the setup file. Mount `<App />` from `src/main.tsx`.

- [ ] **Step 5: Verify the shell**

Run: `pnpm test:run src/App.test.tsx && pnpm typecheck && pnpm build`

Expected: one passing test, no TypeScript errors, and a successful Vite production build.

- [ ] **Step 6: Commit and push**

```bash
git add package.json pnpm-lock.yaml vite.config.ts tsconfig.json tsconfig.node.json index.html src
git commit -m "feat: scaffold guardian heart app"
git push -u origin codex/guardian-heart
```

---

### Task 2: Build the Pure Gesture Classifier and Stable State Machine

**Files:**
- Create: `src/gestures/types.ts`
- Create: `src/gestures/geometry.ts`
- Create: `src/gestures/classify.ts`
- Create: `src/gestures/machine.ts`
- Create: `tests/fixtures/hands.ts`
- Test: `src/gestures/classify.test.ts`
- Test: `src/gestures/machine.test.ts`

**Interfaces:**
- Produces: `classifyHands(hands: HandSample[]): GestureObservation`.
- Produces: `createGestureMachine(): GestureMachine` with `update(observation, nowMs)` and `reset()`.
- Produces: `GestureSnapshot` consumed by the 3D scene and effects.

- [ ] **Step 1: Define exact domain types and fixtures**

```ts
// src/gestures/types.ts
export type Vec3 = Readonly<{ x: number; y: number; z: number }>
export type Handedness = 'Left' | 'Right'
export type HandSample = Readonly<{
  handedness: Handedness
  landmarks: readonly Vec3[]
  score: number
}>
export type GestureKind =
  | 'idle' | 'egg-ready' | 'lock-ready' | 'both-ready'
  | 'fusing' | 'armed' | 'finger-heart' | 'big-heart'
  | 'releasing'
export type GestureObservation = Readonly<{
  kind: Exclude<GestureKind, 'releasing'>
  leftIndex?: Vec3
  rightIndex?: Vec3
  effectOrigin?: Vec3
  confidence: number
}>
export type GestureSnapshot = GestureObservation & Readonly<{
  stableKind: GestureKind
  enteredAtMs: number
  changed: boolean
}>
```

Create fixture builders that return 21 landmarks for `leftIndexOnly`, `rightIndexOnly`, `bothIndexes`, `fingerHeart`, `bigHeart`, and `noHands`.

- [ ] **Step 2: Write failing classifier tests**

```ts
it('classifies screen-left and screen-right index summons', () => {
  expect(classifyHands([leftIndexOnly()]).kind).toBe('egg-ready')
  expect(classifyHands([rightIndexOnly()]).kind).toBe('lock-ready')
  expect(classifyHands([leftIndexOnly(), rightIndexOnly()]).kind).toBe('both-ready')
})

it('prefers the large two-hand heart over the compact heart', () => {
  expect(classifyHands(bigHeart()).kind).toBe('big-heart')
  expect(classifyHands(fingerHeart()).kind).toBe('finger-heart')
})
```

- [ ] **Step 3: Run classifier tests and verify failure**

Run: `pnpm test:run src/gestures/classify.test.ts`

Expected: FAIL because `classifyHands` is not defined.

- [ ] **Step 4: Implement normalized geometry and classification**

```ts
// src/gestures/geometry.ts
import type { Vec3 } from './types'
export const distance = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
export const midpoint = (a: Vec3, b: Vec3): Vec3 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 })
export const palmScale = (landmarks: readonly Vec3[]) => Math.max(distance(landmarks[0], landmarks[9]), 0.001)
export const normalizedDistance = (a: Vec3, b: Vec3, scale: number) => distance(a, b) / scale
```

In `classify.ts`, use MediaPipe landmark indexes `4` (thumb tip), `8` (index tip), `12`, `16`, `20`, `0` (wrist), and `9` (middle MCP). Sort visible hands by `landmarks[8].x` so screen-left always owns the egg and screen-right owns the lock. Check large-heart symmetry before compact-heart proximity, then index-only summons. Return `confidence: 0` and `kind: 'idle'` when no rule passes.

- [ ] **Step 5: Write failing stabilization tests**

```ts
it('requires 150ms before entering and fades through releasing for 300ms', () => {
  const machine = createGestureMachine()
  expect(machine.update(observation('finger-heart'), 0).stableKind).toBe('idle')
  expect(machine.update(observation('finger-heart'), 149).stableKind).toBe('idle')
  expect(machine.update(observation('finger-heart'), 150).stableKind).toBe('finger-heart')
  expect(machine.update(observation('idle'), 151).stableKind).toBe('releasing')
  expect(machine.update(observation('idle'), 450).stableKind).toBe('releasing')
  expect(machine.update(observation('idle'), 451).stableKind).toBe('idle')
})
```

- [ ] **Step 6: Implement and verify the state machine**

Implement a candidate kind with `candidateSinceMs`, a committed `stableKind`, and `releaseSinceMs`. Only commit non-idle candidates after 150ms. Enter `releasing` immediately when an active pose becomes idle, and return to idle after 300ms.

Run: `pnpm test:run src/gestures && pnpm typecheck`

Expected: all gesture and state-machine tests pass.

- [ ] **Step 7: Commit and push**

```bash
git add src/gestures tests/fixtures
git commit -m "feat: add stable hand gesture engine"
git push origin codex/guardian-heart
```

---

### Task 3: Generate and Validate the Full 3D Artifact Models

**Files:**
- Create: `scripts/modeling/shapes.mjs`
- Create: `scripts/modeling/materials.mjs`
- Create: `scripts/build-models.mjs`
- Create: `scripts/validate-models.mjs`
- Create: `public/models/amulet-heart.glb`
- Create: `public/models/humpty-lock.glb`
- Create: `src/models/artifactManifest.ts`

**Interfaces:**
- Produces GLB nodes `AmuletHeartRoot`, `EggBody`, `BlackBand`, `BandHearts`, `BandDrops`.
- Produces GLB nodes `HumptyLockRoot`, `GoldBody`, `Handle`, `HeartGems`, `Keyhole`, `PlainGoldBack`.
- Produces `ARTIFACTS.egg` and `ARTIFACTS.lock` model metadata.

- [ ] **Step 1: Write the failing model validator**

```js
// scripts/validate-models.mjs
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
```

- [ ] **Step 2: Run the validator and verify missing assets**

Run: `pnpm models:validate`

Expected: FAIL with `ENOENT` for `public/models/amulet-heart.glb`.

- [ ] **Step 3: Build reusable Three.js modeling helpers**

Create helpers for an extruded heart shape, rounded extruded rectangle, lathed egg profile, torus handle, radial gem facets, and circular placement. Use named `Mesh` and `Group` objects and PBR materials only, so the GLB has no external texture dependencies.

```js
export function heartShape(size = 1) {
  const s = new THREE.Shape()
  s.moveTo(0, -0.7 * size)
  s.bezierCurveTo(-1.2 * size, -0.05 * size, -0.75 * size, 0.9 * size, 0, 0.35 * size)
  s.bezierCurveTo(0.75 * size, 0.9 * size, 1.2 * size, -0.05 * size, 0, -0.7 * size)
  return s
}
```

- [ ] **Step 4: Generate both artifact scenes and export binary GLB files**

The egg uses a lathed closed body, a separate black equatorial band, repeated raised pink hearts, and repeated black drop ornaments. Continue every element through the back with no visible seam.

The lock uses a rounded gold body, a torus-like handle, four beveled heart gems with iridescent physical materials, a gold center ornament, a black keyhole, and a named flat gold back plate without decoration. Add front details only on positive Z.

Export with `GLTFExporter.parseAsync(scene, { binary: true, onlyVisible: true })` and write the resulting `ArrayBuffer` to `public/models`.

- [ ] **Step 5: Validate assets and inspect sizes**

Run: `pnpm models:build && pnpm models:validate && ls -lh public/models`

Expected: both validators pass; each GLB is below 2.5MB.

- [ ] **Step 6: Add model metadata**

```ts
// src/models/artifactManifest.ts
export const ARTIFACTS = {
  egg: { url: '/models/amulet-heart.glb', root: 'AmuletHeartRoot', scale: 0.22 },
  lock: { url: '/models/humpty-lock.glb', root: 'HumptyLockRoot', scale: 0.18 },
} as const
```

- [ ] **Step 7: Commit and push**

```bash
git add scripts public/models src/models package.json pnpm-lock.yaml
git commit -m "feat: generate magical artifact models"
git push origin codex/guardian-heart
```

---

### Task 4: Add Camera Permission and MediaPipe Hand Tracking

**Files:**
- Create: `src/vision/handTracker.ts`
- Create: `src/vision/useCamera.ts`
- Create: `src/vision/useHandTracking.ts`
- Test: `src/vision/useCamera.test.tsx`
- Test: `src/vision/handTracker.test.ts`

**Interfaces:**
- Produces: `createHandTracker(): Promise<HandTracker>`.
- Produces: `useCamera(): { videoRef, status, error, start, retry, stop }`.
- Produces: `useHandTracking(video, enabled, onHands)`.
- Consumes: `HandSample` from Task 2.

- [ ] **Step 1: Write camera lifecycle tests**

```tsx
it('reports denied permission and retries', async () => {
  const getUserMedia = vi.fn()
    .mockRejectedValueOnce(new DOMException('denied', 'NotAllowedError'))
    .mockResolvedValueOnce(new MediaStream())
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
  const { result } = renderHook(() => useCamera())
  await act(() => result.current.start())
  expect(result.current.status).toBe('denied')
  await act(() => result.current.retry())
  expect(getUserMedia).toHaveBeenCalledTimes(2)
})
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm test:run src/vision`

Expected: FAIL because camera and tracker modules do not exist.

- [ ] **Step 3: Implement camera lifecycle**

Request `{ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }, audio: false }`. Attach the stream to the video ref, call `play()`, stop every track on cleanup, and map `NotAllowedError`, `NotFoundError`, and generic errors to distinct statuses.

- [ ] **Step 4: Implement the MediaPipe adapter**

```ts
const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
const landmarker = await HandLandmarker.createFromOptions(vision, {
  baseOptions: { modelAssetPath: '/mediapipe/hand_landmarker.task', delegate: 'GPU' },
  runningMode: 'VIDEO', numHands: 2,
  minHandDetectionConfidence: 0.55,
  minHandPresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
})
```

Convert every result to immutable `HandSample` values, preserving MediaPipe handedness and scores. If GPU initialization fails, retry once with CPU delegation.

- [ ] **Step 5: Schedule video inference without duplicate frames**

Prefer `HTMLVideoElement.requestVideoFrameCallback`; fall back to `requestAnimationFrame`. Skip inference when `video.currentTime` has not changed, and cancel callbacks during cleanup.

- [ ] **Step 6: Verify vision modules**

Run: `pnpm test:run src/vision && pnpm typecheck`

Expected: camera lifecycle and result-conversion tests pass.

- [ ] **Step 7: Commit and push**

```bash
git add src/vision
git commit -m "feat: add private webcam hand tracking"
git push origin codex/guardian-heart
```

---

### Task 5: Render Camera-Aligned 3D Artifacts

**Files:**
- Create: `src/scene/ExperienceCanvas.tsx`
- Create: `src/scene/Artifact.tsx`
- Create: `src/scene/screenToWorld.ts`
- Test: `src/scene/screenToWorld.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: `GestureSnapshot`, `ARTIFACTS`.
- Produces: `ExperienceCanvas({ snapshot, quality })` layered over the mirrored video.
- Produces: `screenToWorld(point, viewport): [number, number, number]`.

- [ ] **Step 1: Write coordinate conversion tests**

```ts
it('maps normalized mirrored video coordinates into scene coordinates', () => {
  expect(screenToWorld({ x: 0, y: 0, z: 0 }, { width: 16, height: 9 })).toEqual([-8, 4.5, 0])
  expect(screenToWorld({ x: 1, y: 1, z: 0 }, { width: 16, height: 9 })).toEqual([8, -4.5, 0])
})
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm test:run src/scene/screenToWorld.test.ts`

Expected: FAIL because `screenToWorld` does not exist.

- [ ] **Step 3: Implement deterministic mapping and smoothing**

Map normalized X/Y into an orthographic scene with identical video aspect fitting. In `Artifact`, damp position and tilt with `MathUtils.damp`, rotate around Y continuously at `0.8` radians per second, and raise it to `4.5` radians per second while fusing.

- [ ] **Step 4: Load and render named GLB roots**

```tsx
function Artifact({ kind, point, fusing }: ArtifactProps) {
  const config = ARTIFACTS[kind]
  const { scene } = useGLTF(config.url)
  const clone = useMemo(() => scene.clone(true), [scene])
  useFrame((_, delta) => {
    if (!group.current) return
    group.current.rotation.y += delta * (fusing ? 4.5 : 0.8)
  })
  return <group ref={group} scale={config.scale}><primitive object={clone} /></group>
}
```

Use an orthographic camera, ambient light, a soft key light, and a rim light. Keep the canvas transparent over the mirrored `<video>`.

- [ ] **Step 5: Verify scene integration**

Run: `pnpm test:run src/scene && pnpm typecheck && pnpm build`

Expected: conversion tests pass and the GLB imports build successfully.

- [ ] **Step 6: Commit and push**

```bash
git add src/scene src/App.tsx src/styles.css
git commit -m "feat: anchor rotating artifacts to hands"
git push origin codex/guardian-heart
```

---

### Task 6: Add Procedural Beam, Heart, Trail, and Shockwave Effects

**Files:**
- Create: `src/effects/effectSchedule.ts`
- Create: `src/effects/BeamBurst.tsx`
- Create: `src/effects/HeartEmitter.tsx`
- Create: `src/effects/Shockwave.tsx`
- Create: `src/effects/EffectController.tsx`
- Test: `src/effects/effectSchedule.test.ts`

**Interfaces:**
- Produces: `advanceEffectSchedule(previous, snapshot, nowMs): EffectSchedule`.
- Produces: `EffectController({ snapshot, quality })`.
- Consumes: `GestureSnapshot` from Task 2 and scene coordinates from Task 5.

- [ ] **Step 1: Write emission timing tests**

```ts
it('emits small hearts every 250ms and strong hearts every 900ms', () => {
  let s = createEffectSchedule()
  s = advanceEffectSchedule(s, snapshot('finger-heart', true), 0)
  expect(s.beamBurst).toBe(true)
  expect(s.spawn).toEqual(['small'])
  s = advanceEffectSchedule(s, snapshot('finger-heart', false), 249)
  expect(s.spawn).toEqual([])
  s = advanceEffectSchedule(s, snapshot('finger-heart', false), 250)
  expect(s.spawn).toEqual(['small'])
  s = advanceEffectSchedule(s, snapshot('big-heart', true), 300)
  expect(s.spawn).toEqual(['strong'])
  expect(s.shockwave).toBe(true)
})
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm test:run src/effects/effectSchedule.test.ts`

Expected: FAIL because scheduling functions do not exist.

- [ ] **Step 3: Implement pure schedules and pooled particles**

Track last small and strong spawn times, reset entry-only beam and shockwave flags when `snapshot.changed` is false, and stop new spawns immediately in `releasing`. Use fixed-size object pools so a long-held pose does not allocate every frame.

- [ ] **Step 4: Implement the visual effect components**

- `BeamBurst`: a narrow vertical plane with additive gradient material, 250ms entry envelope, and a weaker held glow.
- `HeartEmitter`: extruded heart geometry with emissive pink material, white center, additive sprite trail, forward velocity, drag, and 300ms release fade.
- `Shockwave`: a ring geometry that grows from zero to the configured radius while opacity falls to zero.
- Strong hearts use 2.4× scale, 1.5× velocity, wider bloom, and spawn small heart and star fragments.

- [ ] **Step 5: Verify effects**

Run: `pnpm test:run src/effects && pnpm typecheck && pnpm build`

Expected: timing tests pass, TypeScript passes, and shaders compile in the production build.

- [ ] **Step 6: Commit and push**

```bash
git add src/effects
git commit -m "feat: add procedural negative heart attacks"
git push origin codex/guardian-heart
```

---

### Task 7: Integrate Status UI, Error Recovery, and Adaptive Quality

**Files:**
- Create: `src/ui/CameraStatus.tsx`
- Create: `src/performance/quality.ts`
- Test: `src/ui/CameraStatus.test.tsx`
- Test: `src/performance/quality.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `CameraStatus({ status, gesture, onStart, onRetry })`.
- Produces: `nextQuality(current, averageFps): QualityLevel`.
- Consumes all earlier camera, gesture, scene, and effect interfaces.

- [ ] **Step 1: Write UI and quality-policy tests**

```tsx
it('offers recovery after camera denial', async () => {
  const retry = vi.fn()
  render(<CameraStatus status="denied" gesture="idle" onStart={vi.fn()} onRetry={retry} />)
  await userEvent.click(screen.getByRole('button', { name: '카메라 다시 연결' }))
  expect(retry).toHaveBeenCalledOnce()
})
```

```ts
it('reduces bloom before removing model fidelity', () => {
  expect(nextQuality('high', 24)).toBe('medium')
  expect(nextQuality('medium', 19)).toBe('low')
  expect(QUALITY.low.modelDetail).toBe(1)
})
```

- [ ] **Step 2: Run and verify failure**

Run: `pnpm test:run src/ui src/performance`

Expected: FAIL because both modules are missing.

- [ ] **Step 3: Implement status copy and recovery**

Map statuses to exact Korean copy: `카메라를 연결하는 중…`, `손을 카메라 안에 보여주세요`, `소품을 합쳐보세요`, `FINGER HEART`, and `BIG HEART`. For denied permission, explain that the site needs camera permission and show only the retry button.

- [ ] **Step 4: Implement adaptive quality**

Measure an exponential moving average of render FPS. Drop from high to medium below 27fps for two seconds, and medium to low below 22fps. Recover one level only after five seconds above 34fps. Lower particle pool size, shadow resolution, and bloom resolution in that order; keep model geometry and gesture inference active.

- [ ] **Step 5: Integrate the production App**

`App` starts the camera from a user click, initializes MediaPipe, feeds hands through `classifyHands` and the state machine, renders the mirrored video under `ExperienceCanvas`, and overlays `CameraStatus`. Keep an opt-in `?debug=1` overlay that draws landmarks and the current stable state.

- [ ] **Step 6: Verify integration**

Run: `pnpm test:run && pnpm typecheck && pnpm build`

Expected: all unit/component tests pass and the production build succeeds.

- [ ] **Step 7: Commit and push**

```bash
git add src/App.tsx src/styles.css src/ui src/performance
git commit -m "feat: integrate gesture experience and recovery UI"
git push origin codex/guardian-heart
```

---

### Task 8: Add Browser Smoke Tests, Documentation, and Final Verification

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/experience.spec.ts`
- Modify: `README.md`
- Modify: `.gitignore`

**Interfaces:**
- Produces: repeatable local verification and end-user setup instructions.
- Consumes: the completed application from Tasks 1–7.

- [ ] **Step 1: Add deterministic browser smoke tests**

```ts
test('shows privacy notice before requesting camera', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Guardian Heart' })).toBeVisible()
  await expect(page.getByText('카메라 영상은 이 브라우저 안에서만 처리됩니다.')).toBeVisible()
})

test('shows retry UI when camera permission is denied', async ({ page, context }) => {
  await context.clearPermissions()
  await page.goto('/')
  await page.getByRole('button', { name: '카메라 시작' }).click()
  await expect(page.getByRole('button', { name: '카메라 다시 연결' })).toBeVisible()
})
```

- [ ] **Step 2: Run the browser tests and fix only demonstrated failures**

Run: `pnpm exec playwright install chromium && pnpm e2e`

Expected: both smoke tests pass in Chromium.

- [ ] **Step 3: Document local use and gesture instructions**

README must include prerequisites, `pnpm install`, `pnpm models:build`, `pnpm dev`, camera privacy, supported browsers, small-heart and big-heart gestures, debug mode, and all verification commands.

- [ ] **Step 4: Perform the complete automated verification**

Run:

```bash
pnpm models:validate
pnpm test:run
pnpm typecheck
pnpm build
pnpm e2e
```

Expected: model validation, unit tests, type checking, production build, and browser smoke tests all pass.

- [ ] **Step 5: Perform manual webcam checks**

Verify in Chrome and Edge at 720p: left/right summon mapping, full 360-degree model rotation, smooth fusion, 250ms beam entry, four small hearts per second, 900ms strong hearts, 300ms release, temporary occlusion, hand overlap, dark lighting, and adaptive quality. Record any reproducible failure as a focused follow-up test before changing code.

- [ ] **Step 6: Commit and push**

```bash
git add playwright.config.ts tests/e2e README.md .gitignore
git commit -m "test: verify guardian heart experience"
git push origin codex/guardian-heart
```

---

## Final Release Checklist

- [ ] `git status -sb` shows `codex/guardian-heart...origin/codex/guardian-heart` with no worktree changes.
- [ ] Every task commit is present on `origin/codex/guardian-heart`.
- [ ] Model GLBs contain the required named nodes and stay under size limits.
- [ ] All automated verification commands pass from a clean install.
- [ ] Chrome and Edge manual webcam checks pass without uploading any camera data.
