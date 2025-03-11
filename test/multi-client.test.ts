import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

await setup({
  server: true,
  rootDir: fileURLToPath(new URL('../examples/multi-client', import.meta.url))
})

describe('test multiple clients', () => {
  it('renders ten (10) launches with the spacex client', async () => {
    const result = await $fetch('/spacex')
    expect(result).toContain('<p>Launch Count: 10</p>')
  }, 15000)

  it('fetch a spacex crew', async () => {
    const result = await $fetch('/spacex/crew')
    expect(result).toContain('<p>Crew Name: Douglas Hurley</p>')
  }, 15000)

  it('renders the character morty', async () => {
    const result = await $fetch('/rmorty')
    expect(result).toContain('<p>Name: Morty Smith</p>')
  })

  it('fetches the name of the first rick and morty episode', async () => {
    const result = await $fetch('/rmorty/first-ep')
    expect(result).toContain('<p>First Episode: Pilot</p>')
  })

  it('fetches the name of the first rick and morty episode', async () => {
    const result = await $fetch('/rmorty/chain')
    expect(result).toContain('<p>First Episode: Pilot</p>')
    expect(result).toContain('<p>Name: Morty Smith</p>')
  })

  it('retrieve github user details', async () => {
    const token = process.env.GH_TOKEN
    const result = await $fetch('/github', {
      headers: { Cookie: token ? `gql:github=${token}` : '' }
    })

    expect(result).toContain('Logged in as github-actions[bot]')
  })
})
