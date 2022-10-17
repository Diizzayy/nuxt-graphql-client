import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    watch: false,
    teardownTimeout: 15000
  }
})
