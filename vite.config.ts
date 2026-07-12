import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Playwright specs run under their own runner, not Vitest.
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
  },
})
