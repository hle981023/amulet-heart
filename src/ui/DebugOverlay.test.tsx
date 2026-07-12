import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { bothIndexes } from '../../tests/fixtures/hands'
import { DebugOverlay } from './DebugOverlay'

describe('DebugOverlay', () => {
  it('renders all 21 landmarks for each hand and the stable effect origin', () => {
    const { container } = render(<DebugOverlay quality="high" snapshot={{
      kind: 'both-ready', stableKind: 'both-ready', confidence: 1, enteredAtMs: 0, changed: true,
      fusionProgress: 0, releaseProgress: 0, hands: bothIndexes(), effectOrigin: { x: 0.5, y: 0.5, z: 0 },
    }} />)
    expect(container.querySelectorAll('[data-debug-landmark]')).toHaveLength(42)
    expect(container.querySelector('[data-debug-origin]')).toBeInTheDocument()
  })
})
