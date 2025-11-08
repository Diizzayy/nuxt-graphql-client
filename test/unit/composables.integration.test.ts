import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, reactive } from 'vue'
import { GraphQLClient } from 'graphql-request'

// Create shared state that persists across calls
const sharedGqlState = ref({
  default: {
    instance: new GraphQLClient('http://localhost:4000/graphql'),
    options: {}
  }
})

// Mock Nuxt imports before importing composables
vi.mock('#imports', () => ({
  useState: vi.fn((key: string, init?: () => any) => ref(init ? init() : null)),
  useCookie: vi.fn((name: string) => ref(null)),
  useNuxtApp: vi.fn(() => ({
    _gqlState: sharedGqlState,
    payload: {
      data: {}
    },
    callHook: vi.fn()
  })),
  useAsyncData: vi.fn((key: string, fn: () => any, options?: any) => {
    return {
      data: ref(null),
      pending: ref(false),
      error: ref(null),
      refresh: vi.fn()
    }
  }),
  refreshNuxtData: vi.fn(),
  useRuntimeConfig: vi.fn(() => ({
    public: {
      'graphql-client': {
        clients: {
          default: {
            host: 'http://localhost:4000/graphql',
            tokenStorage: {
              mode: 'cookie',
              name: 'gql:token'
            },
            headers: {}
          }
        }
      }
    }
  })),
  useRequestHeaders: vi.fn(() => ({}))
}))

vi.mock('#gql', () => ({
  GqlSdks: {
    default: vi.fn((client: any, wrapper: any) => ({
      TestQuery: vi.fn(async () => ({ test: 'value' }))
    }))
  },
  GqClientOps: {
    default: ['TestQuery']
  }
}))

describe('composables integration tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset shared state
    sharedGqlState.value = {
      default: {
        instance: new GraphQLClient('http://localhost:4000/graphql'),
        options: {}
      }
    }
  })

  describe('useGqlHeaders', () => {
    it('should import and set headers', async () => {
      const { useGqlHeaders } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      // Set headers
      useGqlHeaders({ 'X-Custom-Header': 'Custom Value' })

      // Verify state was updated
      const app = useNuxtApp()
      expect(app._gqlState.value.default.options.headers).toEqual({
        'X-Custom-Header': 'Custom Value'
      })
    })

    it('should handle object syntax with client parameter', async () => {
      const { useGqlHeaders } = await import('../../src/runtime/composables/index')

      expect(() => {
        useGqlHeaders({
          headers: { 'X-Custom': 'Value' },
          client: 'default'
        })
      }).not.toThrow()
    })

    it('should reset headers with empty object', async () => {
      const { useGqlHeaders } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      useGqlHeaders({})

      const app = useNuxtApp()
      expect(app._gqlState.value.default.options.headers).toEqual({})
    })
  })

  describe('useGqlToken', () => {
    it('should import and set token', async () => {
      const { useGqlToken } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      useGqlToken('test-token')

      const app = useNuxtApp()
      expect(app._gqlState.value.default.options.token?.value).toBe('test-token')
    })

    it('should handle object syntax', async () => {
      const { useGqlToken } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      useGqlToken({ token: 'test-token' })

      const app = useNuxtApp()
      expect(app._gqlState.value.default.options.token?.value).toBe('test-token')
    })

    it('should trim token value', async () => {
      const { useGqlToken } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      useGqlToken('  test-token  ')

      const app = useNuxtApp()
      expect(app._gqlState.value.default.options.token?.value).toBe('test-token')
    })
  })

  describe('useGqlCors', () => {
    it('should import and set CORS mode', async () => {
      const { useGqlCors } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      useGqlCors({ mode: 'cors' })

      const app = useNuxtApp()
      expect(app._gqlState.value.default.options.mode).toBe('cors')
    })

    it('should set credentials', async () => {
      const { useGqlCors } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      useGqlCors({ credentials: 'include' })

      const app = useNuxtApp()
      expect(app._gqlState.value.default.options.credentials).toBe('include')
    })
  })

  describe('useGqlHost', () => {
    it('should import and change host', async () => {
      const { useGqlHost } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      const mockSetEndpoint = vi.fn()
      const app = useNuxtApp()
      app._gqlState.value.default.instance!.setEndpoint = mockSetEndpoint

      useGqlHost('https://api.example.com/graphql')

      expect(mockSetEndpoint).toHaveBeenCalledWith('https://api.example.com/graphql')
    })
  })

  describe('useGqlError', () => {
    it('should import and set error handler', async () => {
      const { useGqlError } = await import('../../src/runtime/composables/index')

      const mockHandler = vi.fn()

      expect(() => {
        useGqlError(mockHandler)
      }).not.toThrow()
    })
  })

  describe('useGql', () => {
    it('should import and execute query', async () => {
      const { useGql } = await import('../../src/runtime/composables/index')

      const gql = useGql()
      const result = await gql('TestQuery')

      expect(result).toEqual({ test: 'value' })
    })

    it('should handle object syntax', async () => {
      const { useGql } = await import('../../src/runtime/composables/index')

      const gql = useGql()
      const result = await gql({ operation: 'TestQuery' })

      expect(result).toEqual({ test: 'value' })
    })
  })

  describe('useAsyncGql', () => {
    it('should import and execute async query', async () => {
      const { useAsyncGql } = await import('../../src/runtime/composables/index')
      const { useAsyncData } = await import('#imports')

      useAsyncGql('TestQuery')

      expect(useAsyncData).toHaveBeenCalled()
    })

    it('should handle object syntax', async () => {
      const { useAsyncGql } = await import('../../src/runtime/composables/index')
      const { useAsyncData } = await import('#imports')

      useAsyncGql({ operation: 'TestQuery' })

      expect(useAsyncData).toHaveBeenCalled()
    })

    it('should watch reactive variables', async () => {
      const { useAsyncGql } = await import('../../src/runtime/composables/index')
      const { useAsyncData } = await import('#imports')

      const variables = reactive({ limit: 10 })
      useAsyncGql('TestQuery', variables)

      expect(useAsyncData).toHaveBeenCalled()
      const callArgs = vi.mocked(useAsyncData).mock.calls[0]
      expect(callArgs[2]?.watch).toBeDefined()
    })
  })
})
