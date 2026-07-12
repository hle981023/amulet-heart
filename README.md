# Guardian Heart

A desktop webcam experience that summons two fully 3D magical artifacts from
hand gestures and fires procedural negative-heart effects from two-hand heart
poses. MediaPipe tracks hands, pure gesture modules turn samples into stable
semantic states, and React Three Fiber renders the artifacts and effects.

> **Privacy:** webcam frames and hand landmarks are processed entirely in your
> browser and are never uploaded.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 11+
- A desktop webcam
- **Chrome** or **Edge** on desktop (primary supported browsers)

## Setup

```bash
pnpm install
pnpm models:build   # generates public/models/*.glb artifact assets
pnpm dev            # http://localhost:5173
```

Open the app, click **카메라 시작**, and allow camera access when prompted.

## Gestures

| Gesture | Effect |
| --- | --- |
| Point one index finger on the **left** of the screen | Summon the amulet egg |
| Point one index finger on the **right** of the screen | Summon the humpty lock |
| Both index fingers | Ready both artifacts |
| **Finger heart** (small two-hand heart) | Stream small negative hearts (~4/sec) with a beam burst |
| **Big heart** (large two-hand heart) | Fire strong hearts every ~900ms with a shockwave |

Artifacts fade over 300ms when a pose is released, and a new pose must be held
for 150ms before it commits.

## Debug mode

Append `?debug=1` to the URL (e.g. `http://localhost:5173/?debug=1`) to overlay
the tracked landmark points, the current stable gesture state, and the active
adaptive-quality level.

## Verification

```bash
pnpm models:validate   # confirm GLB named nodes and size limits
pnpm test:run          # unit and component tests (Vitest)
pnpm typecheck         # TypeScript project references
pnpm build             # production build
pnpm exec playwright install chromium
pnpm e2e               # browser smoke tests (Playwright)
```

## Architecture

- `src/gestures/` — pure landmark classification and the 150ms/300ms state machine
- `src/vision/` — camera lifecycle and the MediaPipe hand-tracking adapter
- `src/scene/` — camera-aligned orthographic scene and GLB artifacts
- `src/effects/` — pure emission scheduling and procedural beam/heart/shockwave
- `src/performance/` — adaptive quality policy
- `src/ui/` — status, recovery, and debug overlays
- `scripts/` — Three.js model generation and validation
