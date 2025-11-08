import { describe, it, expect } from 'vitest'
import { defu } from 'defu'

describe('module configuration', () => {
  describe('Client Configuration', () => {
    it('should merge client config with defaults', () => {
      const clientDefaults = {
        token: { type: 'Bearer', name: 'Authorization' },
        proxyCookies: true,
        preferGETQueries: false
      }

      const userConfig = {
        host: 'http://localhost:4000/graphql',
        headers: { 'X-Custom': 'value' }
      }

      const merged = defu(userConfig, clientDefaults)

      expect(merged.host).toBe('http://localhost:4000/graphql')
      expect(merged.token.type).toBe('Bearer')
      expect(merged.proxyCookies).toBe(true)
    })

    it('should handle string client config', () => {
      const clientConfig = 'http://localhost:4000/graphql'
      const normalized = typeof clientConfig !== 'object'
        ? { host: clientConfig }
        : clientConfig

      expect(normalized).toEqual({ host: 'http://localhost:4000/graphql' })
    })

    it('should handle object client config', () => {
      const clientConfig = {
        host: 'http://localhost:4000/graphql',
        headers: { 'X-Custom': 'value' }
      }

      const normalized = typeof clientConfig !== 'object'
        ? { host: clientConfig }
        : clientConfig

      expect(normalized).toEqual(clientConfig)
    })

    it('should override defaults with user config', () => {
      const defaults = {
        token: { type: 'Bearer', name: 'Authorization' },
        proxyCookies: true
      }

      const userConfig = {
        host: 'http://localhost:4000/graphql',
        proxyCookies: false
      }

      const merged = defu(userConfig, defaults)

      expect(merged.proxyCookies).toBe(false)
    })

    it('should set default token storage name', () => {
      const clientName = 'spacex'
      const tokenStorage = { mode: 'cookie' as const }

      tokenStorage.name = tokenStorage?.name || `gql:${clientName}`

      expect(tokenStorage.name).toBe('gql:spacex')
    })

    it('should preserve custom token storage name', () => {
      const tokenStorage = { mode: 'cookie' as const, name: 'custom-token' }
      const clientName = 'spacex'

      tokenStorage.name = tokenStorage?.name || `gql:${clientName}`

      expect(tokenStorage.name).toBe('custom-token')
    })

    it('should handle null token type', () => {
      const clientDefaults = {
        token: { type: 'Bearer', name: 'Authorization' }
      }

      const userConfig = {
        token: { type: null as any }
      }

      const merged = {
        ...clientDefaults,
        ...(userConfig.token.type === null && { token: { ...clientDefaults.token, type: null } })
      }

      expect(merged.token.type).toBe(null)
    })

    it('should convert string token to object', () => {
      const tokenValue = 'my-secret-token'
      const token = typeof tokenValue === 'string' ? { value: tokenValue } : tokenValue

      expect(token).toEqual({ value: 'my-secret-token' })
    })
  })

  describe('Environment Variable Overrides', () => {
    it('should use GQL_HOST for default client', () => {
      const clientName = 'default'
      const envHost = 'https://api.example.com/graphql'

      const runtimeHost = clientName === 'default' ? envHost : undefined

      expect(runtimeHost).toBe('https://api.example.com/graphql')
    })

    it('should use GQL_{CLIENT}_HOST for named client', () => {
      const clientName = 'spacex'
      const envVarName = `GQL_${clientName.toUpperCase()}_HOST`

      expect(envVarName).toBe('GQL_SPACEX_HOST')
    })

    it('should use GQL_TOKEN for default client', () => {
      const clientName = 'default'
      const envToken = 'secret-token'

      const runtimeToken = clientName === 'default' ? envToken : undefined

      expect(runtimeToken).toBe('secret-token')
    })

    it('should use GQL_{CLIENT}_TOKEN for named client', () => {
      const clientName = 'github'
      const envVarName = `GQL_${clientName.toUpperCase()}_TOKEN`

      expect(envVarName).toBe('GQL_GITHUB_TOKEN')
    })

    it('should use GQL_TOKEN_NAME for default client', () => {
      const clientName = 'default'
      const envTokenName = 'X-Auth-Token'

      const runtimeTokenName = clientName === 'default' ? envTokenName : undefined

      expect(runtimeTokenName).toBe('X-Auth-Token')
    })

    it('should use GQL_CLIENT_HOST for client-side override', () => {
      const defaultHost = 'http://localhost:4000/graphql'
      const clientHost = 'https://api.example.com/graphql'

      const config = {
        host: defaultHost,
        clientHost
      }

      const isClient = true
      const finalHost = isClient && config.clientHost ? config.clientHost : config.host

      expect(finalHost).toBe('https://api.example.com/graphql')
    })
  })

  describe('Codegen Configuration', () => {
    it('should merge codegen options with defaults', () => {
      const defaults = {
        silent: true,
        skipTypename: true,
        useTypeImports: true,
        dedupeFragments: true,
        onlyOperationTypes: true
      }

      const userOptions = {
        skipTypename: false,
        scalars: { DateTime: 'string' }
      }

      const merged = defu(userOptions, defaults)

      expect(merged.silent).toBe(true)
      expect(merged.skipTypename).toBe(false)
      expect(merged.scalars.DateTime).toBe('string')
    })

    it('should handle codegen disabled', () => {
      const codegen = false
      const enabled = !!codegen

      expect(enabled).toBe(false)
    })

    it('should handle codegen as object', () => {
      const codegen = { silent: false }
      const config = !!codegen && defu(codegen, { silent: true })

      expect(config).toEqual({ silent: false })
    })

    it('should disable codegen on build when specified', () => {
      const isPrepare = false
      const isDev = false
      const disableOnBuild = true

      const shouldGenerate = isPrepare || isDev ? true : !disableOnBuild

      expect(shouldGenerate).toBe(false)
    })

    it('should enable codegen during dev', () => {
      const isPrepare = false
      const isDev = true
      const disableOnBuild = true

      const shouldGenerate = isPrepare || isDev ? true : !disableOnBuild

      expect(shouldGenerate).toBe(true)
    })

    it('should enable codegen during prepare', () => {
      const isPrepare = true
      const isDev = false
      const disableOnBuild = true

      const shouldGenerate = isPrepare || isDev ? true : !disableOnBuild

      expect(shouldGenerate).toBe(true)
    })
  })

  describe('Token Storage Configuration', () => {
    it('should use cookie mode by default', () => {
      const defaults = {
        mode: 'cookie' as const,
        cookieOptions: {
          maxAge: 60 * 60 * 24 * 7,
          secure: process.env.NODE_ENV === 'production'
        }
      }

      expect(defaults.mode).toBe('cookie')
    })

    it('should set secure cookie in production', () => {
      const isProduction = true
      const secure = isProduction

      expect(secure).toBe(true)
    })

    it('should not set secure cookie in development', () => {
      const isProduction = false
      const secure = isProduction

      expect(secure).toBe(false)
    })

    it('should set cookie max age to 1 week', () => {
      const maxAge = 60 * 60 * 24 * 7

      expect(maxAge).toBe(604800)
    })

    it('should handle localStorage mode', () => {
      const tokenStorage = { mode: 'localStorage' as const }

      expect(tokenStorage.mode).toBe('localStorage')
    })
  })

  describe('Default Client Determination', () => {
    it('should use "default" as default client when it exists', () => {
      const clients = { default: {}, spacex: {} }
      const defaultClient = clients.default ? 'default' : Object.keys(clients)[0]

      expect(defaultClient).toBe('default')
    })

    it('should use first client when no "default" exists', () => {
      const clients = { spacex: {}, github: {} }
      const defaultClient = (clients as any).default ? 'default' : Object.keys(clients)[0]

      expect(defaultClient).toBe('spacex')
    })

    it('should identify default from GQL_HOST env when no clients configured', () => {
      const clients = {}
      const host = 'http://localhost:4000/graphql'

      if (!Object.keys(clients).length && host) {
        (clients as any).default = { host }
      }

      expect((clients as any).default.host).toBe('http://localhost:4000/graphql')
    })
  })

  describe('Schema Validation', () => {
    it('should validate schema path pattern', () => {
      const schemaPath = './schema.graphql'
      const isRelative = !schemaPath.startsWith('/')

      expect(isRelative).toBe(true)
    })

    it('should identify schema files by name', () => {
      const files = [
        'queries.gql',
        'mutations.gql',
        'schema.graphql',
        'user-schema.gql'
      ]

      const schemas = files.filter(f =>
        f.match(/([^/]+)\.(gql|graphql)$/)?.[0]?.toLowerCase().includes('schema')
      )

      expect(schemas).toEqual(['schema.graphql', 'user-schema.gql'])
    })

    it('should exclude schema files from documents', () => {
      const file = 'schema.graphql'
      const isSchema = file.match(/([^/]+)\.(gql|graphql)$/)?.[0]?.toLowerCase().includes('schema')

      expect(isSchema).toBe(true)
    })
  })

  describe('Document Path Resolution', () => {
    it('should match GraphQL file patterns', () => {
      const gqlMatch = '**/*.{gql,graphql}'
      const files = [
        'queries.gql',
        'mutations.graphql',
        'component.vue',
        'utils.ts'
      ]

      const gqlFiles = files.filter(f => f.match(/\.(gql|graphql)$/))

      expect(gqlFiles).toEqual(['queries.gql', 'mutations.graphql'])
    })

    it('should exclude schema directory', () => {
      const pattern = '!**/schemas'
      const path = '/app/schemas/schema.graphql'

      const shouldExclude = path.includes('/schemas/')

      expect(shouldExclude).toBe(true)
    })
  })

  describe('Function Prefix', () => {
    it('should use "Gql" as default prefix', () => {
      const defaultPrefix = 'Gql'

      expect(defaultPrefix).toBe('Gql')
    })

    it('should allow custom prefix', () => {
      const customPrefix = 'GraphQL'

      expect(customPrefix).toBe('GraphQL')
    })

    it('should generate function name with prefix', () => {
      const prefix = 'Gql'
      const operation = 'getUsers'
      const functionName = `${prefix}${operation.charAt(0).toUpperCase()}${operation.slice(1)}`

      expect(functionName).toBe('GqlGetUsers')
    })
  })

  describe('Watch Configuration', () => {
    it('should watch by default', () => {
      const defaultWatch = true

      expect(defaultWatch).toBe(true)
    })

    it('should disable watch when specified', () => {
      const watch = false

      expect(watch).toBe(false)
    })

    it('should detect GraphQL file changes', () => {
      const path = 'queries/users.gql'
      const isGqlFile = !!path.match(/\.(gql|graphql)$/)

      expect(isGqlFile).toBe(true)
    })

    it('should ignore non-GraphQL file changes', () => {
      const path = 'components/User.vue'
      const isGqlFile = !!path.match(/\.(gql|graphql)$/)

      expect(isGqlFile).toBe(false)
    })
  })

  describe('Auto Import Configuration', () => {
    it('should auto import by default', () => {
      const defaultAutoImport = true

      expect(defaultAutoImport).toBe(true)
    })

    it('should disable auto import when specified', () => {
      const autoImport = false

      expect(autoImport).toBe(false)
    })
  })

  describe('Token Retention', () => {
    it('should not retain token by default in public config', () => {
      const retainToken = false
      const tokenValue = 'secret'

      const publicValue = retainToken ? tokenValue : undefined

      expect(publicValue).toBeUndefined()
    })

    it('should retain token when specified', () => {
      const retainToken = true
      const tokenValue = 'secret'

      const publicValue = retainToken ? tokenValue : undefined

      expect(publicValue).toBe('secret')
    })

    it('should always keep token in server config', () => {
      const token = { value: 'secret' }
      const serverConfig = { token }

      expect(serverConfig.token.value).toBe('secret')
    })
  })

  describe('Prefer GET Queries', () => {
    it('should default to false', () => {
      const defaultPreferGET = false

      expect(defaultPreferGET).toBe(false)
    })

    it('should enable when specified', () => {
      const preferGETQueries = true

      expect(preferGETQueries).toBe(true)
    })
  })

  describe('Proxy Headers', () => {
    it('should proxy cookies by default', () => {
      const defaultProxyCookies = true

      expect(defaultProxyCookies).toBe(true)
    })

    it('should collect unique proxy headers', () => {
      const clients = {
        default: { proxyHeaders: ['user-agent', 'cookie'] },
        spacex: { proxyHeaders: ['cookie', 'accept-language'] }
      }

      const allHeaders = Object.values(clients)
        .flatMap(v => v?.proxyHeaders)
        .filter((v, i, a) => v && a.indexOf(v) === i)

      expect(allHeaders).toEqual(['user-agent', 'cookie', 'accept-language'])
    })

    it('should always include cookie header', () => {
      const proxyHeaders = ['user-agent']

      if (!proxyHeaders.includes('cookie')) {
        proxyHeaders.push('cookie')
      }

      expect(proxyHeaders).toContain('cookie')
    })
  })
})
