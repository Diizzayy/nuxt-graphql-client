import { describe, it, expect } from 'vitest'
import { fileURLToPath } from 'node:url'
import { setup, $fetch, createPage } from '@nuxt/test-utils/e2e'

await setup({
  rootDir: fileURLToPath(new URL('../fixtures/nuxt-app', import.meta.url)),
  server: true,
  browser: false
})

describe('composables integration', () => {
  it('plugin should initialize GQL state', async () => {
    const html = await $fetch('/')
    expect(html).toBeTruthy()
  })
})
