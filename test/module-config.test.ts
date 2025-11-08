import { describe, it, expect } from 'vitest'
import type { GqlConfig, GqlClient, GqlCodegen } from '../src/types'

describe('module configuration', () => {
  describe('GqlConfig types', () => {
    it('should accept valid client configuration with string', () => {
      const config: GqlConfig = {
        clients: {
          default: 'https://api.example.com/graphql'
        }
      }

      expect(config.clients?.default).toBe('https://api.example.com/graphql')
    })

    it('should accept valid client configuration with object', () => {
      const config: GqlConfig = {
        clients: {
          default: {
            host: 'https://api.example.com/graphql',
            token: {
              type: 'Bearer',
              name: 'Authorization',
              value: 'test-token'
            }
          }
        }
      }

      expect(config.clients?.default).toHaveProperty('host')
      expect(config.clients?.default).toHaveProperty('token')
    })

    it('should accept multiple clients', () => {
      const config: GqlConfig = {
        clients: {
          default: 'https://api1.example.com/graphql',
          spacex: {
            host: 'https://spacex-api.com/graphql'
          },
          github: {
            host: 'https://api.github.com/graphql',
            token: {
              type: 'Bearer',
              value: 'github-token'
            }
          }
        }
      }

      expect(Object.keys(config.clients || {})).toHaveLength(3)
    })

    it('should accept codegen configuration as boolean', () => {
      const config: GqlConfig = {
        clients: { default: 'https://api.example.com/graphql' },
        codegen: false
      }

      expect(config.codegen).toBe(false)
    })

    it('should accept codegen configuration as object', () => {
      const codegenConfig: GqlCodegen = {
        silent: true,
        skipTypename: true,
        useTypeImports: true,
        dedupeFragments: true,
        disableOnBuild: false,
        onlyOperationTypes: true,
        avoidOptionals: false,
        maybeValue: 'T | null',
        scalars: {
          DateTime: 'string'
        },
        enumsAsTypes: false,
        enumsAsConst: false
      }

      const config: GqlConfig = {
        clients: { default: 'https://api.example.com/graphql' },
        codegen: codegenConfig
      }

      expect(config.codegen).toEqual(codegenConfig)
    })

    it('should accept token storage configuration', () => {
      const config: GqlConfig = {
        clients: { default: 'https://api.example.com/graphql' },
        tokenStorage: {
          mode: 'cookie',
          name: 'gql:auth',
          cookieOptions: {
            maxAge: 3600,
            secure: true
          }
        }
      }

      expect(config.tokenStorage).toHaveProperty('mode', 'cookie')
    })

    it('should accept custom function prefix', () => {
      const config: GqlConfig = {
        clients: { default: 'https://api.example.com/graphql' },
        functionPrefix: 'Custom'
      }

      expect(config.functionPrefix).toBe('Custom')
    })

    it('should accept document paths', () => {
      const config: GqlConfig = {
        clients: { default: 'https://api.example.com/graphql' },
        documentPaths: ['./queries', '../shared/queries']
      }

      expect(config.documentPaths).toHaveLength(2)
    })

    it('should accept watch configuration', () => {
      const config: GqlConfig = {
        clients: { default: 'https://api.example.com/graphql' },
        watch: false
      }

      expect(config.watch).toBe(false)
    })

    it('should accept autoImport configuration', () => {
      const config: GqlConfig = {
        clients: { default: 'https://api.example.com/graphql' },
        autoImport: false
      }

      expect(config.autoImport).toBe(false)
    })

    it('should accept preferGETQueries configuration', () => {
      const config: GqlConfig = {
        clients: { default: 'https://api.example.com/graphql' },
        preferGETQueries: true
      }

      expect(config.preferGETQueries).toBe(true)
    })
  })

  describe('GqlClient types', () => {
    it('should accept minimal client configuration', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql'
      }

      expect(client.host).toBe('https://api.example.com/graphql')
    })

    it('should accept client with custom headers', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql',
        headers: {
          'X-Custom-Header': 'value',
          'X-Another-Header': 'another-value'
        }
      }

      expect(client.headers).toHaveProperty('X-Custom-Header')
    })

    it('should accept client with server-only headers', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql',
        headers: {
          serverOnly: {
            'X-Secret-Key': 'secret'
          }
        }
      }

      expect(client.headers).toHaveProperty('serverOnly')
    })

    it('should accept client with token as string', () => {
      const client: GqlClient<string> = {
        host: 'https://api.example.com/graphql',
        token: 'my-token'
      }

      expect(client.token).toBe('my-token')
    })

    it('should accept client with token as object', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql',
        token: {
          type: 'Bearer',
          name: 'Authorization',
          value: 'test-token'
        }
      }

      expect(client.token).toHaveProperty('type', 'Bearer')
    })

    it('should accept client with null token type', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql',
        token: {
          type: null,
          name: 'X-API-Key',
          value: 'raw-token'
        }
      }

      expect(client.token).toHaveProperty('type', null)
    })

    it('should accept client with clientHost', () => {
      const client: GqlClient = {
        host: 'https://api-server.example.com/graphql',
        clientHost: 'https://api-client.example.com/graphql'
      }

      expect(client.clientHost).toBe('https://api-client.example.com/graphql')
    })

    it('should accept client with introspectionHost', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql',
        introspectionHost: 'https://api-dev.example.com/graphql'
      }

      expect(client.introspectionHost).toBe('https://api-dev.example.com/graphql')
    })

    it('should accept client with schema file', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql',
        schema: './schema.graphql'
      }

      expect(client.schema).toBe('./schema.graphql')
    })

    it('should accept client with token storage configuration', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql',
        tokenStorage: {
          mode: 'localStorage',
          name: 'my-token'
        }
      }

      expect(client.tokenStorage).toHaveProperty('mode', 'localStorage')
    })

    it('should accept client with proxyCookies', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql',
        proxyCookies: false
      }

      expect(client.proxyCookies).toBe(false)
    })

    it('should accept client with proxyHeaders', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql',
        proxyHeaders: ['cookie', 'authorization']
      }

      expect(client.proxyHeaders).toContain('cookie')
    })

    it('should accept client with CORS options', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql',
        corsOptions: {
          mode: 'cors',
          credentials: 'include'
        }
      }

      expect(client.corsOptions).toHaveProperty('mode', 'cors')
    })

    it('should accept client with preferGETQueries', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql',
        preferGETQueries: true
      }

      expect(client.preferGETQueries).toBe(true)
    })

    it('should accept client with retainToken', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql',
        retainToken: true
      }

      expect(client.retainToken).toBe(true)
    })

    it('should accept client with codegenHeaders', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql',
        codegenHeaders: {
          'X-Codegen-Only': 'true'
        }
      }

      expect(client.codegenHeaders).toHaveProperty('X-Codegen-Only')
    })

    it('should accept client with fetchOptions', () => {
      const client: GqlClient = {
        host: 'https://api.example.com/graphql',
        fetchOptions: {
          cache: 'no-cache',
          redirect: 'follow'
        }
      }

      expect(client.fetchOptions).toHaveProperty('cache', 'no-cache')
    })
  })

  describe('GqlCodegen types', () => {
    it('should accept all codegen options', () => {
      const codegen: GqlCodegen = {
        disableOnBuild: true,
        silent: false,
        skipTypename: false,
        useTypeImports: false,
        dedupeFragments: false,
        onlyOperationTypes: false,
        avoidOptionals: true,
        maybeValue: 'T | undefined',
        scalars: {
          DateTime: 'Date',
          JSON: 'any'
        },
        enumsAsTypes: true,
        enumsAsConst: true
      }

      expect(codegen.disableOnBuild).toBe(true)
      expect(codegen.silent).toBe(false)
      expect(codegen.scalars).toHaveProperty('DateTime', 'Date')
    })

    it('should accept avoidOptionals as object', () => {
      const codegen: GqlCodegen = {
        avoidOptionals: {
          field: true,
          inputValue: false,
          object: true,
          defaultValue: false
        }
      }

      expect(codegen.avoidOptionals).toHaveProperty('field', true)
    })

    it('should accept scalars as object with input/output', () => {
      const codegen: GqlCodegen = {
        scalars: {
          DateTime: {
            input: 'string',
            output: 'Date'
          }
        }
      }

      expect(codegen.scalars).toHaveProperty('DateTime')
    })
  })
})
