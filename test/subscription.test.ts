import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { setup, createPage } from '@nuxt/test-utils'

await setup({
  server: true,
  browser: true,
  rootDir: fileURLToPath(new URL('../examples/subscription', import.meta.url))
})

describe('subscription tests', () => {
  it('subscribe to websocket', async () => {
    const page = await createPage('/')

    await page.waitForSelector('#connected')

    const randomId = Math.random().toString()

    await page.fill('#todoInput', randomId)

    await Promise.all([
      page.click('text=Create Todo'),
      page.waitForResponse('https://nuxt-gql-server-2gl6xp7kua-ue.a.run.app/query')
    ])

    const response = await page.innerText('#todoResponse')

    expect(JSON.parse(response)).toContain({ text: randomId })
  }, 15000)
})
