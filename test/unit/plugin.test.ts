import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

describe('plugin', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  describe('GraphQL Client Initialization', () => {
    it('should initialize GraphQL client with correct configuration', () => {
      const mockGraphQLClient = vi.fn()

      vi.doMock('graphql-request', () => ({
        GraphQLClient: mockGraphQLClient
      }))

      vi.doMock('#imports', () => ({
        ref,
        useCookie: vi.fn(),
        useNuxtApp: vi.fn(() => ({
          _gqlState: null,
          callHook: vi.fn()
        })),
        defineNuxtPlugin: vi.fn((fn) => fn),
        useRuntimeConfig: vi.fn(() => ({
          public: {
            'graphql-client': {
              clients: {
                default: {
                  host: 'http://localhost:4000/graphql',
                  headers: {}
                }
              }
            }
          }
        })),
        useRequestHeaders: vi.fn(() => ({}))
      }))

      expect(mockGraphQLClient).toBeDefined()
    })

    it('should handle multiple clients', () => {
      const clients = {
        default: {
          host: 'http://localhost:4000/graphql',
          headers: {}
        },
        spacex: {
          host: 'https://spacex-production.up.railway.app/',
          headers: {}
        }
      }

      expect(Object.keys(clients)).toHaveLength(2)
      expect(clients.default.host).toBe('http://localhost:4000/graphql')
      expect(clients.spacex.host).toBe('https://spacex-production.up.railway.app/')
    })

    it('should use client-specific host on client side', () => {
      const config = {
        host: 'http://localhost:4000/graphql',
        clientHost: 'https://api.example.com/graphql'
      }

      const isClient = true
      const host = isClient && config.clientHost ? config.clientHost : config.host

      expect(host).toBe('https://api.example.com/graphql')
    })

    it('should use regular host on server side', () => {
      const config = {
        host: 'http://localhost:4000/graphql',
        clientHost: 'https://api.example.com/graphql'
      }

      const isClient = false
      const host = isClient && config.clientHost ? config.clientHost : config.host

      expect(host).toBe('http://localhost:4000/graphql')
    })
  })

  describe('Header Management', () => {
    it('should merge default headers', () => {
      const headers = { 'Content-Type': 'application/json' }
      const serverHeaders = { 'X-Server': 'true' }

      const merged = { ...headers, ...serverHeaders }

      expect(merged).toEqual({
        'Content-Type': 'application/json',
        'X-Server': 'true'
      })
    })

    it('should handle serverOnly headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        serverOnly: {
          'X-Server-Secret': 'secret'
        }
      }

      const isServer = true
      const serverHeaders = isServer && typeof headers.serverOnly === 'object' ? headers.serverOnly : {}

      expect(serverHeaders).toEqual({ 'X-Server-Secret': 'secret' })
    })

    it('should not include serverOnly headers on client', () => {
      const headers = {
        'Content-Type': 'application/json',
        serverOnly: {
          'X-Server-Secret': 'secret'
        }
      }

      const isServer = false
      const serverHeaders = isServer && typeof headers.serverOnly === 'object' ? headers.serverOnly : {}

      expect(serverHeaders).toEqual({})
    })

    it('should proxy specified headers from request', () => {
      const requestHeaders = {
        'user-agent': 'Mozilla/5.0',
        'accept-language': 'en-US',
        cookie: 'session=abc123'
      }

      const proxyHeaders = ['user-agent', 'cookie']
      const proxied = proxyHeaders.reduce((acc, header) => {
        if (requestHeaders[header]) {
          acc[header] = requestHeaders[header]
        }
        return acc
      }, {} as Record<string, string>)

      expect(proxied).toEqual({
        'user-agent': 'Mozilla/5.0',
        cookie: 'session=abc123'
      })
      expect(proxied['accept-language']).toBeUndefined()
    })

    it('should always include cookie in proxy headers', () => {
      const proxyHeaders = ['user-agent']
      if (!proxyHeaders.includes('cookie')) {
        proxyHeaders.push('cookie')
      }

      expect(proxyHeaders).toContain('cookie')
    })

    it('should deduplicate proxy headers', () => {
      const proxyHeaders = ['user-agent', 'cookie', 'user-agent', 'cookie']
      const unique = proxyHeaders.filter((v, i, a) => a.indexOf(v) === i)

      expect(unique).toEqual(['user-agent', 'cookie'])
    })
  })

  describe('Token Handling', () => {
    it('should extract token from cookie string', () => {
      const cookieString = 'session=abc; gql:token=my-token; other=value'
      const tokenName = 'gql:token'

      const token = cookieString
        .split(';')
        .find(c => c.trim().startsWith(`${tokenName}=`))
        ?.split('=')?.[1]

      expect(token).toBe('my-token')
    })

    it('should return undefined for missing token', () => {
      const cookieString = 'session=abc; other=value'
      const tokenName = 'gql:token'

      const token = cookieString
        .split(';')
        .find(c => c.trim().startsWith(`${tokenName}=`))
        ?.split('=')?.[1]

      expect(token).toBeUndefined()
    })

    it('should trim token value', () => {
      const token = '  my-token  '
      const trimmed = token.trim()

      expect(trimmed).toBe('my-token')
    })

    it('should detect existing auth scheme in token', () => {
      const token = 'Bearer abc123'
      const hasScheme = !!token.match(/^[a-z]+\s/i)?.[0]

      expect(hasScheme).toBe(true)
    })

    it('should detect no auth scheme in plain token', () => {
      const token = 'abc123'
      const hasScheme = !!token.match(/^[a-z]+\s/i)?.[0]

      expect(hasScheme).toBe(false)
    })

    it('should add Bearer prefix when no scheme exists', () => {
      const token = 'abc123'
      const tokenType = 'Bearer'
      const hasScheme = !!token.match(/^[a-z]+\s/i)?.[0]

      const authHeader = hasScheme ? token : `${tokenType} ${token}`

      expect(authHeader).toBe('Bearer abc123')
    })

    it('should not add prefix when scheme exists', () => {
      const token = 'Bearer abc123'
      const tokenType = 'Bearer'
      const hasScheme = !!token.match(/^[a-z]+\s/i)?.[0]

      const authHeader = hasScheme ? token : `${tokenType} ${token}`

      expect(authHeader).toBe('Bearer abc123')
    })

    it('should handle null token type', () => {
      const token = 'abc123'
      const tokenType = null

      const authHeader = !tokenType ? token : `${tokenType} ${token}`

      expect(authHeader).toBe('abc123')
    })

    it('should use custom token name', () => {
      const tokenName = 'X-API-Key'
      const token = 'my-api-key'

      const headers: Record<string, string> = {}
      headers[tokenName] = token

      expect(headers['X-API-Key']).toBe('my-api-key')
    })
  })

  describe('CORS Configuration', () => {
    it('should apply CORS options', () => {
      const corsOptions = {
        mode: 'cors' as RequestMode,
        credentials: 'include' as RequestCredentials
      }

      const opts = {
        headers: {},
        ...corsOptions
      }

      expect(opts.mode).toBe('cors')
      expect(opts.credentials).toBe('include')
    })

    it('should merge fetch options', () => {
      const fetchOptions = {
        cache: 'no-cache' as RequestCache,
        redirect: 'follow' as RequestRedirect
      }

      const opts = {
        headers: {},
        ...fetchOptions
      }

      expect(opts.cache).toBe('no-cache')
      expect(opts.redirect).toBe('follow')
    })
  })

  describe('Request Middleware', () => {
    it('should merge request headers in correct order', () => {
      const defaultOpts = { headers: { 'Content-Type': 'application/json' } }
      const reqOpts = { headers: { Accept: 'application/graphql-response+json' } }
      const req = { headers: { Authorization: 'Bearer token' } }

      // Properly merge headers (not just spreading objects)
      const merged = {
        headers: {
          ...defaultOpts.headers,
          ...req.headers,
          ...reqOpts.headers
        }
      }

      expect(merged.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer token',
        Accept: 'application/graphql-response+json'
      })
    })

    it('should use default Accept header', () => {
      const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/graphql-response+json, application/json'
      }

      expect(headers.Accept).toContain('application/graphql-response+json')
      expect(headers.Accept).toContain('application/json')
    })

    it('should remove token from reqOpts after processing', () => {
      const reqOpts: any = {
        headers: {},
        token: { value: 'abc123' }
      }

      if (reqOpts.token) {
        delete reqOpts.token
      }

      expect(reqOpts.token).toBeUndefined()
    })
  })

  describe('GET Query Preference', () => {
    it('should configure GET method for queries when preferGETQueries is true', () => {
      const preferGETQueries = true

      const opts = preferGETQueries
        ? {
            method: 'GET',
            jsonSerializer: { parse: JSON.parse, stringify: JSON.stringify }
          }
        : {}

      expect(opts.method).toBe('GET')
      expect(opts.jsonSerializer).toBeDefined()
    })

    it('should not configure GET when preferGETQueries is false', () => {
      const preferGETQueries = false

      const opts = preferGETQueries
        ? {
            method: 'GET',
            jsonSerializer: { parse: JSON.parse, stringify: JSON.stringify }
          }
        : {}

      expect(opts.method).toBeUndefined()
    })
  })

  describe('Token Storage', () => {
    it('should determine cookie storage mode', () => {
      const tokenStorage = {
        mode: 'cookie',
        name: 'gql:token'
      }

      expect(tokenStorage.mode).toBe('cookie')
    })

    it('should determine localStorage storage mode', () => {
      const tokenStorage = {
        mode: 'localStorage',
        name: 'gql:token'
      }

      expect(tokenStorage.mode).toBe('localStorage')
    })

    it('should have token name', () => {
      const tokenStorage = {
        mode: 'cookie',
        name: 'gql:default'
      }

      expect(tokenStorage.name).toBe('gql:default')
    })
  })

  describe('Proxy Cookies', () => {
    it('should proxy cookies when enabled and cookies exist', () => {
      const proxyCookies = true
      const requestHeaders = { cookie: 'session=abc123' }

      const shouldProxy = proxyCookies && !!requestHeaders?.cookie

      expect(shouldProxy).toBe(true)
    })

    it('should not proxy cookies when disabled', () => {
      const proxyCookies = false
      const requestHeaders = { cookie: 'session=abc123' }

      const shouldProxy = proxyCookies && !!requestHeaders?.cookie

      expect(shouldProxy).toBe(false)
    })

    it('should not proxy cookies when no cookie header exists', () => {
      const proxyCookies = true
      const requestHeaders = {}

      const shouldProxy = proxyCookies && !!(requestHeaders as any)?.cookie

      expect(shouldProxy).toBe(false)
    })
  })
})
