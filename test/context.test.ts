import { describe, it, expect, vi } from 'vitest'
import { mockTemplate, prepareContext } from '../src/context'
import type { GqlContext } from '../src/context'

// Mock the file system operations
vi.mock('node:fs', async () => {
  const actual = await vi.importActual('node:fs')
  return {
    ...actual,
    promises: {
      ...actual.promises,
      readFile: vi.fn(async (path: string) => {
        // Return mock GraphQL documents based on the path
        if (path.includes('user.gql')) {
          return 'query GetUser { user { id name } }'
        }
        if (path.includes('launches.gql')) {
          return 'query GetLaunches { launches { id mission_name } }'
        }
        if (path.includes('query.gql')) {
          return 'query GetUser { user { id } }'
        }
        return 'query Example { example { id } }'
      })
    }
  }
})

describe('context', () => {
  describe('mockTemplate', () => {
    it('should generate SDK function from single operation', () => {
      const operations = {
        GetLaunches: 'query GetLaunches { launches { id } }'
      }

      const result = mockTemplate(operations)

      expect(result).toContain('export function getSdk')
      expect(result).toContain('GetLaunches:')
      expect(result).toContain('client.request')
      expect(result).toContain('query GetLaunches { launches { id } }')
      expect(result).toContain('variables')
      expect(result).toContain('requestHeaders')
    })

    it('should generate SDK with multiple operations', () => {
      const operations = {
        GetLaunches: 'query GetLaunches { launches { id } }',
        GetUser: 'query GetUser { user { id name } }',
        CreateUser: 'mutation CreateUser($name: String!) { createUser(name: $name) { id } }'
      }

      const result = mockTemplate(operations)

      expect(result).toContain('GetLaunches:')
      expect(result).toContain('GetUser:')
      expect(result).toContain('CreateUser:')
    })

    it('should include wrapper function', () => {
      const operations = {
        GetLaunches: 'query GetLaunches { launches { id } }'
      }

      const result = mockTemplate(operations)

      expect(result).toContain('withWrapper')
      expect(result).toContain('wrappedRequestHeaders')
      expect(result).toContain('...requestHeaders, ...wrappedRequestHeaders')
    })

    it('should handle empty operations', () => {
      const operations = {}

      const result = mockTemplate(operations)

      expect(result).toContain('export function getSdk')
      expect(result).toContain('return {')
    })

    it('should escape backticks in GraphQL queries', () => {
      const operations = {
        GetLaunches: 'query GetLaunches { launches { id } }'
      }

      const result = mockTemplate(operations)

      // Check that query is wrapped in backticks
      expect(result).toMatch(/client\.request\(`.*`/)
    })
  })

  describe('prepareContext', () => {
    it('should generate function names with default prefix', async () => {
      const ctx: GqlContext = {
        codegen: false,
        template: {
          default: mockTemplate({
            GetUser: 'query GetUser { user { id } }',
            GetPosts: 'query GetPosts { posts { id } }'
          })
        },
        clients: ['default'],
        clientOps: { default: [] },
        clientDocs: { default: [] }
      }

      await prepareContext(ctx, 'Gql')

      expect(ctx.fns).toContain('GetUser')
      expect(ctx.fns).toContain('GetPosts')
    })

    it('should extract function names from template', async () => {
      const ctx: GqlContext = {
        codegen: false,
        template: {
          default: 'GetUser: (variables = undefined, requestHeaders = undefined) => {}',
          spacex: 'GetLaunches: (variables = undefined, requestHeaders = undefined) => {}'
        },
        clients: ['default', 'spacex'],
        clientOps: { default: [], spacex: [] },
        clientDocs: { default: [], spacex: [] }
      }

      await prepareContext(ctx, 'Gql')

      expect(ctx.fns).toContain('GetUser')
      expect(ctx.fns).toContain('GetLaunches')
    })

    it('should generate imports code', async () => {
      const ctx: GqlContext = {
        codegen: false,
        template: {
          default: mockTemplate({ GetUser: 'query GetUser { user { id } }' })
        },
        clients: ['default'],
        clientOps: { default: ['GetUser'] }
      }

      await prepareContext(ctx, 'Gql')

      const imports = ctx.generateImports?.()
      expect(imports).toContain('import { useGql }')
      expect(imports).toContain('export const GqlGetUser')
      expect(imports).toContain('GqlSdks')
      expect(imports).toContain('GqClientOps')
    })

    it('should generate declarations', async () => {
      const ctx: GqlContext = {
        codegen: true,
        template: {
          default: `export type User = { id: string }\nexport type Query = {}\nGetUser: (variables) => {}`
        },
        clients: ['default'],
        clientOps: { default: ['GetUser'] }
      }

      await prepareContext(ctx, 'Gql')

      const declarations = ctx.generateDeclarations?.()
      expect(declarations).toContain('declare module \'#gql\'')
      expect(declarations).toContain('type GqlClients')
      expect(declarations).toContain('type GqlOps')
    })

    it('should filter out clients without documents', async () => {
      const ctx: GqlContext = {
        codegen: false,
        template: {
          default: mockTemplate({ GetUser: 'query GetUser { user { id } }' })
        },
        clients: ['default', 'spacex'],
        clientOps: { default: ['GetUser'], spacex: [] },
        clientDocs: { default: ['query.gql'], spacex: [] }
      }

      await prepareContext(ctx, 'Gql')

      expect(ctx.clients).toEqual(['default'])
      expect(ctx.clients).not.toContain('spacex')
    })

    it('should handle multiple clients', async () => {
      const ctx: GqlContext = {
        codegen: false,
        template: {
          default: mockTemplate({ GetUser: 'query GetUser { user { id } }' }),
          spacex: mockTemplate({ GetLaunches: 'query GetLaunches { launches { id } }' })
        },
        clients: ['default', 'spacex'],
        clientOps: { default: ['GetUser'], spacex: ['GetLaunches'] },
        clientDocs: { default: ['user.gql'], spacex: ['launches.gql'] }
      }

      await prepareContext(ctx, 'Gql')

      expect(ctx.clients).toContain('default')
      expect(ctx.clients).toContain('spacex')
      expect(ctx.fns).toContain('GetUser')
      expect(ctx.fns).toContain('GetLaunches')
    })

    it('should create function imports with correct names', async () => {
      const ctx: GqlContext = {
        codegen: false,
        template: {
          default: mockTemplate({ getUser: 'query getUser { user { id } }' })
        },
        clients: ['default'],
        clientOps: { default: ['getUser'] }
      }

      await prepareContext(ctx, 'Gql')

      expect(ctx.fnImports).toBeDefined()
      expect(ctx.fnImports).toHaveLength(1)
      expect(ctx.fnImports?.[0].name).toBe('GqlGetUser')
      expect(ctx.fnImports?.[0].from).toBe('#gql')
    })

    it('should handle custom function prefix', async () => {
      const ctx: GqlContext = {
        codegen: false,
        template: {
          default: mockTemplate({ GetUser: 'query GetUser { user { id } }' })
        },
        clients: ['default'],
        clientOps: { default: ['GetUser'] }
      }

      await prepareContext(ctx, 'Custom')

      const imports = ctx.generateImports?.()
      expect(imports).toContain('export const CustomGetUser')
    })

    it('should sort function names', async () => {
      const ctx: GqlContext = {
        codegen: false,
        template: {
          default: mockTemplate({
            ZQuery: 'query Z { z }',
            AQuery: 'query A { a }',
            MQuery: 'query M { m }'
          })
        },
        clients: ['default'],
        clientOps: { default: [] }
      }

      await prepareContext(ctx, 'Gql')

      expect(ctx.fns).toEqual(['AQuery', 'MQuery', 'ZQuery'])
    })
  })
})
