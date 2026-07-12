import { render, screen, within } from '@testing-library/react'
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
        trackerStatus="idle"
        onTrackerRetry={vi.fn()}
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
        trackerStatus="idle"
        onTrackerRetry={vi.fn()}
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
        trackerStatus="ready"
        onTrackerRetry={vi.fn()}
      />,
    )
    expect(screen.getByRole('status')).toHaveTextContent('BIG HEART')
  })

  it('shows accurate tracker loading and retry UI while the camera is active', async () => {
    const retry = vi.fn()
    const { rerender, container } = render(
      <CameraStatus status="active" gesture="idle" onStart={vi.fn()} onRetry={vi.fn()} trackerStatus="loading" onTrackerRetry={retry} />,
    )
    expect(within(container).getByRole('status')).toHaveTextContent('손 인식 모델을 불러오는 중')
    rerender(<CameraStatus status="active" gesture="idle" onStart={vi.fn()} onRetry={vi.fn()} trackerStatus="error" trackerError="model unavailable" onTrackerRetry={retry} />)
    expect(within(container).getByRole('alert')).toHaveTextContent('손 인식 모델을 시작하지 못했습니다')
    await userEvent.click(within(container).getByRole('button', { name: '손 인식 다시 시도' }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
