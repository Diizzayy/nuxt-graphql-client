import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

await setup({
  server: true,
  rootDir: fileURLToPath(new URL('./fixtures/multi-client', import.meta.url))
})

describe('test multiple clients', () => {
  it('renders ten (10) launches with the spacex client', async () => {
    const result = await $fetch('/spacex')
    expect(result).toContain('<p>Launch Count: 10</p>')
  }, 15000)

  it('fetches the spacex Iridium NEXT mission', async () => {
    const result = await $fetch('/spacex/mission')
    expect(result).toContain('<p>Mission Name: Iridium NEXT</p>')
  }, 15000)

  it('renders the character morty', async () => {
    const result = await $fetch('/rmorty')
    expect(result).toContain('<p>Name: Morty Smith</p>')
  }, 15000)

  it('fetches the name of the first rick and morty episode', async () => {
    const result = await $fetch('/rmorty/first-ep')
    expect(result).toContain('<p>First Episode: Pilot</p>')
  }, 15000)
})
