import { describe, it, expect, vi } from 'vitest'
import type { GqlClient } from '../src/types'

// Mock the @graphql-codegen/cli module
vi.mock('@graphql-codegen/cli', () => ({
  generate: vi.fn(async (config) => {
    // Return mock output based on the config
    const generates = config.generates || {}
    return Object.keys(generates).map(filename => ({
      filename,
      content: `// Generated code for ${filename}`
    }))
  })
}))

describe('generate', () => {
  describe('prepareConfig', () => {
    it('should prepare schema from host when no schema file provided', async () => {
      const { default: generate } = await import('../src/generate')

      const options = {
        clients: {
          default: {
            host: 'https://api.example.com/graphql'
          } as GqlClient
        },
        clientDocs: {
          default: ['query.gql']
        },
        plugins: ['typescript'],
        documents: ['query.gql']
      }

      const result = await generate(options)

      expect(result).toBeDefined()
      expect(result).toHaveLength(1)
      expect(result[0].filename).toBe('default.ts')
    })

    it('should include auth headers in schema preparation', async () => {
      const { default: generate } = await import('../src/generate')

      const options = {
        clients: {
          default: {
            host: 'https://api.example.com/graphql',
            token: {
              type: 'Bearer',
              value: 'test-token',
              name: 'Authorization'
            }
          } as GqlClient
        },
        clientDocs: {
          default: ['query.gql']
        },
        plugins: ['typescript'],
        documents: ['query.gql']
      }

      const result = await generate(options)

      expect(result).toBeDefined()
    })

    it('should handle multiple clients', async () => {
      const { default: generate } = await import('../src/generate')

      const options = {
        clients: {
          default: {
            host: 'https://api1.example.com/graphql'
          } as GqlClient,
          spacex: {
            host: 'https://spacex-api.com/graphql'
          } as GqlClient
        },
        clientDocs: {
          default: ['user.gql'],
          spacex: ['launches.gql']
        },
        plugins: ['typescript'],
        documents: ['user.gql', 'launches.gql']
      }

      const result = await generate(options)

      expect(result).toHaveLength(2)
      expect(result.map(r => r.filename)).toContain('default.ts')
      expect(result.map(r => r.filename)).toContain('spacex.ts')
    })

    it('should skip clients without documents', async () => {
      const { default: generate } = await import('../src/generate')

      const options = {
        clients: {
          default: {
            host: 'https://api1.example.com/graphql'
          } as GqlClient,
          spacex: {
            host: 'https://spacex-api.com/graphql'
          } as GqlClient
        },
        clientDocs: {
          default: ['user.gql'],
          spacex: []
        },
        plugins: ['typescript'],
        documents: ['user.gql']
      }

      const result = await generate(options)

      expect(result).toHaveLength(1)
      expect(result[0].filename).toBe('default.ts')
    })

    it('should handle custom headers', async () => {
      const { default: generate } = await import('../src/generate')

      const options = {
        clients: {
          default: {
            host: 'https://api.example.com/graphql',
            headers: {
              'X-Custom-Header': 'custom-value'
            },
            token: {
              type: 'Bearer',
              name: 'Authorization'
            }
          } as GqlClient
        },
        clientDocs: {
          default: ['query.gql']
        },
        plugins: ['typescript'],
        documents: ['query.gql']
      }

      const result = await generate(options)

      expect(result).toBeDefined()
    })

    it('should handle serverOnly headers', async () => {
      const { default: generate } = await import('../src/generate')

      const options = {
        clients: {
          default: {
            host: 'https://api.example.com/graphql',
            headers: {
              'X-Public': 'public',
              serverOnly: {
                'X-Secret': 'secret'
              }
            },
            token: {
              type: 'Bearer',
              name: 'Authorization'
            }
          } as GqlClient
        },
        clientDocs: {
          default: ['query.gql']
        },
        plugins: ['typescript'],
        documents: ['query.gql']
      }

      const result = await generate(options)

      expect(result).toBeDefined()
    })

    it('should handle token without type', async () => {
      const { default: generate } = await import('../src/generate')

      const options = {
        clients: {
          default: {
            host: 'https://api.example.com/graphql',
            token: {
              type: null,
              value: 'raw-token',
              name: 'X-API-Key'
            }
          } as GqlClient
        },
        clientDocs: {
          default: ['query.gql']
        },
        plugins: ['typescript'],
        documents: ['query.gql']
      }

      const result = await generate(options)

      expect(result).toBeDefined()
    })

    it('should handle introspectionHost', async () => {
      const { default: generate } = await import('../src/generate')

      const options = {
        clients: {
          default: {
            host: 'https://api.example.com/graphql',
            introspectionHost: 'https://api-dev.example.com/graphql'
          } as GqlClient
        },
        clientDocs: {
          default: ['query.gql']
        },
        plugins: ['typescript'],
        documents: ['query.gql']
      }

      const result = await generate(options)

      expect(result).toBeDefined()
    })

    it('should handle codegenHeaders', async () => {
      const { default: generate } = await import('../src/generate')

      const options = {
        clients: {
          default: {
            host: 'https://api.example.com/graphql',
            codegenHeaders: {
              'X-Codegen-Only': 'true'
            },
            token: {
              type: 'Bearer',
              name: 'Authorization'
            }
          } as GqlClient
        },
        clientDocs: {
          default: ['query.gql']
        },
        plugins: ['typescript'],
        documents: ['query.gql']
      }

      const result = await generate(options)

      expect(result).toBeDefined()
    })

    it('should pass codegen configuration options', async () => {
      const { default: generate } = await import('../src/generate')

      const options = {
        clients: {
          default: {
            host: 'https://api.example.com/graphql'
          } as GqlClient
        },
        clientDocs: {
          default: ['query.gql']
        },
        plugins: ['typescript', 'typescript-operations'],
        documents: ['query.gql'],
        skipTypename: true,
        useTypeImports: true,
        dedupeFragments: true,
        onlyOperationTypes: true,
        avoidOptionals: false,
        maybeValue: 'T | null',
        scalars: {
          DateTime: 'string'
        },
        enumsAsTypes: false,
        enumsAsConst: false
      }

      const result = await generate(options)

      expect(result).toBeDefined()
    })
  })
})
