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
