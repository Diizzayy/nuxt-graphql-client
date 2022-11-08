import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

await setup({
  server: true,
  rootDir: fileURLToPath(new URL('../examples/basic', import.meta.url))
})

describe('test suite', () => {
  it('renders ten (10) launches', async () => {
    const result = await $fetch('/')
    expect(result).toContain('<p>Launch Count: 10</p>')
  }, 15000)
})
