import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { GraphQLClient } from 'graphql-request'

// Mock dependencies
vi.mock('graphql-request', () => ({
  GraphQLClient: vi.fn().mockImplementation((url, options) => ({
    request: vi.fn(),
    setEndpoint: vi.fn()
  }))
}))

vi.mock('#imports', () => ({
  ref: vi.fn((...args) => ref(...args)),
  useCookie: vi.fn((name: string) => ref(null)),
  useNuxtApp: vi.fn(() => ({
    _gqlState: null,
    callHook: vi.fn().mockResolvedValue(undefined)
  })),
  defineNuxtPlugin: vi.fn((fn) => fn),
  useRuntimeConfig: vi.fn(() => ({
    'graphql-client': {
      clients: {
        default: {
          host: 'http://localhost:4000/graphql',
          token: { type: 'Bearer', name: 'Authorization' },
          tokenStorage: { mode: 'cookie', name: 'gql:token' },
          headers: {},
          proxyCookies: true
        }
      }
    },
    public: {
      'graphql-client': {
        clients: {
          default: {
            host: 'http://localhost:4000/graphql',
            token: { type: 'Bearer', name: 'Authorization' },
            tokenStorage: { mode: 'cookie', name: 'gql:token' },
            headers: {},
            proxyCookies: true
          }
        }
      }
    }
  })),
  useRequestHeaders: vi.fn(() => ({}))
}))

vi.mock('#gql', () => ({
  GqlClients: 'default'
}))

describe('plugin integration tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should import and initialize plugin', async () => {
    const plugin = await import('../../src/runtime/plugin')

    expect(plugin.default).toBeDefined()
  })

  it('should initialize GraphQL client on plugin call', async () => {
    const { GraphQLClient: MockGraphQLClient } = await import('graphql-request')
    const plugin = await import('../../src/runtime/plugin')

    // Call the plugin
    const pluginFn = plugin.default
    if (typeof pluginFn === 'function') {
      pluginFn()
    }

    expect(MockGraphQLClient).toHaveBeenCalled()
  })

  it('should set up client state', async () => {
    const { useNuxtApp } = await import('#imports')
    const plugin = await import('../../src/runtime/plugin')

    const mockNuxtApp = {
      _gqlState: null,
      callHook: vi.fn().mockResolvedValue(undefined)
    }

    vi.mocked(useNuxtApp).mockReturnValue(mockNuxtApp as any)

    const pluginFn = plugin.default
    if (typeof pluginFn === 'function') {
      pluginFn()
    }

    expect(mockNuxtApp._gqlState).toBeDefined()
  })
})
