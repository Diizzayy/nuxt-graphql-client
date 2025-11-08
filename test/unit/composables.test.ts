import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, reactive } from 'vue'

// Mock the imports
vi.mock('#imports', () => ({
  useState: vi.fn((key: string, init: () => any) => {
    const state = ref(init())
    return state
  }),
  useCookie: vi.fn((name: string) => ref(null)),
  useNuxtApp: vi.fn(() => ({
    _gqlState: ref({
      default: {
        instance: {
          setEndpoint: vi.fn()
        },
        options: {}
      }
    }),
    payload: {
      data: {}
    },
    callHook: vi.fn()
  })),
  useAsyncData: vi.fn((key: string, fn: () => any, options: any) => {
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
    default: vi.fn(() => ({
      GetUsers: vi.fn()
    }))
  },
  GqClientOps: {
    default: ['GetUsers', 'GetPosts']
  }
}))

describe('composables', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useGqlHeaders', () => {
    it('should set headers for default client', async () => {
      const { useGqlHeaders } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      useGqlHeaders({ 'X-Custom-Header': 'Custom Value' })

      const nuxtApp = useNuxtApp()
      const state = nuxtApp._gqlState.value
      expect(state.default.options.headers).toEqual({ 'X-Custom-Header': 'Custom Value' })
    })

    it('should accept object syntax with client parameter', async () => {
      const { useGqlHeaders } = await import('../../src/runtime/composables/index')

      useGqlHeaders({
        headers: { 'X-Custom': 'Value' },
        client: 'default'
      })

      // Should not throw
      expect(true).toBe(true)
    })

    it('should reset headers when passed empty object', async () => {
      const { useGqlHeaders } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      useGqlHeaders({})

      const nuxtApp = useNuxtApp()
      const state = nuxtApp._gqlState.value
      expect(state.default.options.headers).toEqual({})
    })
  })

  describe('useGqlToken', () => {
    it('should set token in state', async () => {
      const { useGqlToken } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      useGqlToken('test-token')

      const nuxtApp = useNuxtApp()
      const state = nuxtApp._gqlState.value
      expect(state.default.options.token?.value).toBe('test-token')
    })

    it('should accept object syntax', async () => {
      const { useGqlToken } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      useGqlToken({ token: 'test-token' })

      const nuxtApp = useNuxtApp()
      const state = nuxtApp._gqlState.value
      expect(state.default.options.token?.value).toBe('test-token')
    })

    it('should trim token value', async () => {
      const { useGqlToken } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      useGqlToken('  test-token  ')

      const nuxtApp = useNuxtApp()
      const state = nuxtApp._gqlState.value
      expect(state.default.options.token?.value).toBe('test-token')
    })

    it('should reset token when null', async () => {
      const { useGqlToken } = await import('../../src/runtime/composables/index')
      const { useNuxtApp, useCookie } = await import('#imports')

      const mockCookie = ref('old-token')
      vi.mocked(useCookie).mockReturnValue(mockCookie)

      useGqlToken(null)

      expect(mockCookie.value).toBe(null)
    })

    it('should handle config options', async () => {
      const { useGqlToken } = await import('../../src/runtime/composables/index')

      useGqlToken('token', {
        config: { type: 'Bearer', name: 'Authorization' }
      })

      // Should not throw
      expect(true).toBe(true)
    })

    it('should refresh data by default', async () => {
      const { useGqlToken } = await import('../../src/runtime/composables/index')
      const { refreshNuxtData, useNuxtApp } = await import('#imports')

      const mockNuxtApp = {
        _gqlState: ref({ default: { options: {} } }),
        payload: {
          data: {
            'gql:data:123': {},
            'other:data': {}
          }
        }
      }
      vi.mocked(useNuxtApp).mockReturnValue(mockNuxtApp as any)

      useGqlToken('new-token')

      expect(refreshNuxtData).toHaveBeenCalledWith(['gql:data:123'])
    })

    it('should not refresh data when refreshData is false', async () => {
      const { useGqlToken } = await import('../../src/runtime/composables/index')
      const { refreshNuxtData } = await import('#imports')

      vi.clearAllMocks()

      useGqlToken('token', { refreshData: false })

      expect(refreshNuxtData).not.toHaveBeenCalled()
    })
  })

  describe('useGqlCors', () => {
    it('should set CORS mode', async () => {
      const { useGqlCors } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      useGqlCors({ mode: 'cors' })

      const nuxtApp = useNuxtApp()
      const state = nuxtApp._gqlState.value
      expect(state.default.options.mode).toBe('cors')
    })

    it('should set credentials', async () => {
      const { useGqlCors } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      useGqlCors({ credentials: 'include' })

      const nuxtApp = useNuxtApp()
      const state = nuxtApp._gqlState.value
      expect(state.default.options.credentials).toBe('include')
    })

    it('should set both mode and credentials', async () => {
      const { useGqlCors } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      useGqlCors({ mode: 'cors', credentials: 'include' })

      const nuxtApp = useNuxtApp()
      const state = nuxtApp._gqlState.value
      expect(state.default.options.mode).toBe('cors')
      expect(state.default.options.credentials).toBe('include')
    })
  })

  describe('useGqlHost', () => {
    it('should set endpoint with full URL', async () => {
      const { useGqlHost } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      const mockSetEndpoint = vi.fn()
      const mockNuxtApp = {
        _gqlState: ref({
          default: {
            instance: { setEndpoint: mockSetEndpoint }
          }
        })
      }
      vi.mocked(useNuxtApp).mockReturnValue(mockNuxtApp as any)

      useGqlHost('https://api.example.com/graphql')

      expect(mockSetEndpoint).toHaveBeenCalledWith('https://api.example.com/graphql')
    })

    it('should prepend initial host for relative URLs', async () => {
      const { useGqlHost } = await import('../../src/runtime/composables/index')
      const { useNuxtApp, useRuntimeConfig } = await import('#imports')

      const mockSetEndpoint = vi.fn()
      const mockNuxtApp = {
        _gqlState: ref({
          default: {
            instance: { setEndpoint: mockSetEndpoint }
          }
        })
      }
      vi.mocked(useNuxtApp).mockReturnValue(mockNuxtApp as any)
      vi.mocked(useRuntimeConfig).mockReturnValue({
        public: {
          'graphql-client': {
            clients: {
              default: {
                host: 'http://localhost:4000'
              }
            }
          }
        }
      } as any)

      useGqlHost('/graphql')

      expect(mockSetEndpoint).toHaveBeenCalledWith('http://localhost:4000/graphql')
    })

    it('should handle trailing slash in initial host', async () => {
      const { useGqlHost } = await import('../../src/runtime/composables/index')
      const { useNuxtApp, useRuntimeConfig } = await import('#imports')

      const mockSetEndpoint = vi.fn()
      const mockNuxtApp = {
        _gqlState: ref({
          default: {
            instance: { setEndpoint: mockSetEndpoint }
          }
        })
      }
      vi.mocked(useNuxtApp).mockReturnValue(mockNuxtApp as any)
      vi.mocked(useRuntimeConfig).mockReturnValue({
        public: {
          'graphql-client': {
            clients: {
              default: {
                host: 'http://localhost:4000/'
              }
            }
          }
        }
      } as any)

      useGqlHost('/graphql')

      expect(mockSetEndpoint).toHaveBeenCalledWith('http://localhost:4000/graphql')
    })
  })

  describe('useGqlError', () => {
    it('should set error handler', async () => {
      const { useGqlError } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      const mockErrorHandler = vi.fn()
      const mockNuxtApp = {
        _gqlState: ref({ onError: null })
      }
      vi.mocked(useNuxtApp).mockReturnValue(mockNuxtApp as any)

      useGqlError(mockErrorHandler)

      expect(mockNuxtApp._gqlState.value.onError).toBeDefined()
    })

    it('should call error handler when error exists', async () => {
      const { useGqlError } = await import('../../src/runtime/composables/index')
      const { useState } = await import('#imports')

      const mockError = {
        client: 'default',
        operationType: 'query',
        operationName: 'GetUsers',
        statusCode: 401,
        gqlErrors: []
      }

      vi.mocked(useState).mockReturnValue(ref(mockError))

      const mockErrorHandler = vi.fn()
      useGqlError(mockErrorHandler)

      expect(mockErrorHandler).toHaveBeenCalledWith(mockError)
    })
  })

  describe('useGql', () => {
    it('should throw error when GQL State is not available', async () => {
      const { useNuxtApp } = await import('#imports')

      vi.mocked(useNuxtApp).mockReturnValue({} as any)

      const { useGql } = await import('../../src/runtime/composables/index')

      expect(() => useGql()).toThrow('GQL State is not available')
    })

    it('should accept operation and variables as separate arguments', async () => {
      const { useGql } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')
      const { GqlSdks } = await import('#gql')

      const mockRequest = vi.fn().mockResolvedValue({ users: [] })
      const mockSdk = vi.fn(() => ({
        GetUsers: mockRequest
      }))

      vi.mocked(GqlSdks).default = mockSdk as any

      const mockNuxtApp = {
        _gqlState: ref({
          default: {
            instance: {},
            options: {}
          }
        })
      }
      vi.mocked(useNuxtApp).mockReturnValue(mockNuxtApp as any)

      const gql = useGql()
      await gql('GetUsers', { limit: 10 })

      expect(mockRequest).toHaveBeenCalled()
    })

    it('should accept object syntax', async () => {
      const { useGql } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')
      const { GqlSdks } = await import('#gql')

      const mockRequest = vi.fn().mockResolvedValue({ users: [] })
      const mockSdk = vi.fn(() => ({
        GetUsers: mockRequest
      }))

      vi.mocked(GqlSdks).default = mockSdk as any

      const mockNuxtApp = {
        _gqlState: ref({
          default: {
            instance: {},
            options: {}
          }
        })
      }
      vi.mocked(useNuxtApp).mockReturnValue(mockNuxtApp as any)

      const gql = useGql()
      await gql({ operation: 'GetUsers', variables: { limit: 10 } })

      expect(mockRequest).toHaveBeenCalled()
    })

    it('should throw error for invalid operation', async () => {
      const { useGql } = await import('../../src/runtime/composables/index')
      const { useNuxtApp } = await import('#imports')

      const mockNuxtApp = {
        _gqlState: ref({
          default: {
            instance: null,
            options: {}
          }
        })
      }
      vi.mocked(useNuxtApp).mockReturnValue(mockNuxtApp as any)

      const gql = useGql()

      await expect(gql('InvalidOp')).rejects.toThrow('Invalid GraphQL Operation')
    })
  })

  describe('useAsyncGql', () => {
    it('should accept object syntax', async () => {
      const { useAsyncGql } = await import('../../src/runtime/composables/index')
      const { useAsyncData } = await import('#imports')

      useAsyncGql({
        operation: 'GetUsers',
        variables: { limit: 10 }
      })

      expect(useAsyncData).toHaveBeenCalled()
    })

    it('should accept separate arguments', async () => {
      const { useAsyncGql } = await import('../../src/runtime/composables/index')
      const { useAsyncData } = await import('#imports')

      useAsyncGql('GetUsers', { limit: 10 })

      expect(useAsyncData).toHaveBeenCalled()
    })

    it('should watch reactive variables', async () => {
      const { useAsyncGql } = await import('../../src/runtime/composables/index')
      const { useAsyncData } = await import('#imports')

      const variables = reactive({ limit: 10 })

      useAsyncGql('GetUsers', variables)

      expect(useAsyncData).toHaveBeenCalled()
      const callArgs = vi.mocked(useAsyncData).mock.calls[0]
      expect(callArgs[2]?.watch).toBeDefined()
    })

    it('should generate unique key based on operation and variables', async () => {
      const { useAsyncGql } = await import('../../src/runtime/composables/index')
      const { useAsyncData } = await import('#imports')

      useAsyncGql('GetUsers', { limit: 10 })

      expect(useAsyncData).toHaveBeenCalled()
      const callArgs = vi.mocked(useAsyncData).mock.calls[0]
      expect(callArgs[0]).toContain('gql:data:')
    })

    it('should pass options to useAsyncData', async () => {
      const { useAsyncGql } = await import('../../src/runtime/composables/index')
      const { useAsyncData } = await import('#imports')

      const options = { lazy: true }

      useAsyncGql('GetUsers', { limit: 10 }, options)

      expect(useAsyncData).toHaveBeenCalled()
      const callArgs = vi.mocked(useAsyncData).mock.calls[0]
      expect(callArgs[2]).toEqual(expect.objectContaining(options))
    })
  })
})
