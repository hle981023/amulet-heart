import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CameraStatus } from './CameraStatus'

describe('CameraStatus', () => {
  it('starts with a privacy-safe camera prompt', () => {
    render(
      <CameraStatus
        status="idle"
        gesture="idle"
        onStart={vi.fn()}
        onRetry={vi.fn()}
      />,
    )
    expect(
      screen.getByRole('heading', { name: 'Guardian Heart' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '카메라 시작' })).toBeEnabled()
  })

  it('offers recovery after camera denial', async () => {
    const retry = vi.fn()
    render(
      <CameraStatus
        status="denied"
        gesture="idle"
        onStart={vi.fn()}
        onRetry={retry}
      />,
    )
    await userEvent.click(
      screen.getByRole('button', { name: '카메라 다시 연결' }),
    )
    expect(retry).toHaveBeenCalledOnce()
  })

  it('announces the active fire gesture', () => {
    render(
      <CameraStatus
        status="active"
        gesture="big-heart"
        onStart={vi.fn()}
        onRetry={vi.fn()}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('BIG HEART')
  })
})
