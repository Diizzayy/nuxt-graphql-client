import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    teardownTimeout: 15000
  }
})
