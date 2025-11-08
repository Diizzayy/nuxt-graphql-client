import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { prepareContext, mockTemplate, type GqlContext } from '../../src/context'

const testDir = join(process.cwd(), 'test/fixtures/context')

describe('context', () => {
  beforeAll(() => {
    mkdirSync(testDir, { recursive: true })

    // Create test GraphQL documents
    writeFileSync(
      join(testDir, 'users.gql'),
      'query GetUsers { users { id name } }'
    )

    writeFileSync(
      join(testDir, 'posts.gql'),
      'query GetPosts { posts { id title } }'
    )

    writeFileSync(
      join(testDir, 'createUser.gql'),
      'mutation CreateUser($name: String!) { createUser(name: $name) { id } }'
    )
  })

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  describe('prepareContext', () => {
    it('should prepare context with operations', async () => {
      const ctx: GqlContext = {
        clientDocs: {
          default: [join(testDir, 'users.gql'), join(testDir, 'posts.gql')]
        },
        clientOps: {
          default: []
        },
        template: {}
      }

      await prepareContext(ctx, 'Gql')

      expect(ctx.clientOps?.default).toContain('GetUsers')
      expect(ctx.clientOps?.default).toContain('GetPosts')
    })

    it('should generate function names with prefix', async () => {
      const ctx: GqlContext = {
        clientDocs: {
          default: [join(testDir, 'users.gql')]
        },
        clientOps: {
          default: []
        },
        template: {},
        codegen: false
      }

      await prepareContext(ctx, 'Gql')

      expect(ctx.fns).toBeDefined()
      expect(ctx.fnImports).toBeDefined()
      expect(ctx.fnImports?.some(imp => imp.name === 'GqlGetUsers')).toBe(true)
    })

    it('should filter clients with no documents', async () => {
      const ctx: GqlContext = {
        clients: ['default', 'spacex', 'github'],
        clientDocs: {
          default: [join(testDir, 'users.gql')],
          spacex: [],
          github: []
        },
        clientOps: {
          default: [],
          spacex: [],
          github: []
        },
        template: {}
      }

      await prepareContext(ctx, 'Gql')

      expect(ctx.clients).toEqual(['default'])
    })

    it('should generate imports when codegen is enabled', async () => {
      const ctx: GqlContext = {
        clients: ['default'],
        clientDocs: {
          default: [join(testDir, 'users.gql')]
        },
        clientOps: {
          default: []
        },
        template: {
          default: mockTemplate({ GetUsers: 'query GetUsers { users { id } }' })
        },
        codegen: true
      }

      await prepareContext(ctx, 'Gql')

      const imports = ctx.generateImports?.()
      expect(imports).toContain('import { useGql }')
      expect(imports).toContain('getSdk as defaultGqlSdk')
      expect(imports).toContain('export const GqlGetUsers')
    })

    it('should generate declarations when codegen is enabled', async () => {
      const ctx: GqlContext = {
        clients: ['default'],
        clientDocs: {
          default: [join(testDir, 'users.gql')]
        },
        clientOps: {
          default: []
        },
        template: {
          default: mockTemplate({ GetUsers: 'query GetUsers { users { id } }' })
        },
        codegen: true
      }

      await prepareContext(ctx, 'Gql')

      const declarations = ctx.generateDeclarations?.()
      expect(declarations).toContain("type GqlClients = 'default'")
      expect(declarations).toContain("type GqlOps = 'GetUsers'")
      expect(declarations).toContain('declare module \'#gql\'')
    })

    it('should handle multiple clients', async () => {
      const ctx: GqlContext = {
        clients: ['default', 'spacex'],
        clientDocs: {
          default: [join(testDir, 'users.gql')],
          spacex: [join(testDir, 'posts.gql')]
        },
        clientOps: {
          default: [],
          spacex: []
        },
        template: {}
      }

      await prepareContext(ctx, 'Gql')

      expect(ctx.clientOps?.default).toContain('GetUsers')
      expect(ctx.clientOps?.spacex).toContain('GetPosts')
    })

    it('should throw error for operations without names', async () => {
      const unnamedDoc = join(testDir, 'unnamed.gql')
      writeFileSync(unnamedDoc, '{ users { id } }')

      const ctx: GqlContext = {
        clientDocs: {
          default: [unnamedDoc]
        },
        clientOps: {
          default: []
        },
        template: {}
      }

      await expect(prepareContext(ctx, 'Gql')).rejects.toThrow('Operation name missing')
    })

    it('should not duplicate operations', async () => {
      const ctx: GqlContext = {
        clientDocs: {
          default: [join(testDir, 'users.gql'), join(testDir, 'users.gql')]
        },
        clientOps: {
          default: []
        },
        template: {}
      }

      await prepareContext(ctx, 'Gql')

      const getUsersCount = ctx.clientOps?.default.filter(op => op === 'GetUsers').length
      expect(getUsersCount).toBe(1)
    })

    it('should handle template preparation', async () => {
      const template = mockTemplate({ GetUsers: 'query GetUsers { users { id } }' })

      const ctx: GqlContext = {
        clients: ['default'],
        clientDocs: {
          default: [join(testDir, 'users.gql')]
        },
        clientOps: {
          default: []
        },
        template: {
          default: template
        },
        codegen: true
      }

      await prepareContext(ctx, 'Gql')

      expect(ctx.clientTypes).toBeDefined()
    })

    it('should extract functions from template', async () => {
      const template = 'export function getSdk() { return { GetUsers: (variables) => {}, GetPosts: (variables) => {} } }'

      const ctx: GqlContext = {
        clients: ['default'],
        clientDocs: {
          default: []
        },
        template: {
          default: template
        },
        codegen: true
      }

      await prepareContext(ctx, 'Gql')

      expect(ctx.fns).toContain('GetUsers')
      expect(ctx.fns).toContain('GetPosts')
    })
  })

  describe('mockTemplate', () => {
    it('should generate mock SDK template', () => {
      const operations = {
        GetUsers: 'query GetUsers { users { id name } }',
        GetPosts: 'query GetPosts { posts { id title } }'
      }

      const result = mockTemplate(operations)

      expect(result).toContain('export function getSdk')
      expect(result).toContain('GetUsers:')
      expect(result).toContain('GetPosts:')
      expect(result).toContain('client.request')
    })

    it('should include query strings in template', () => {
      const operations = {
        GetUsers: 'query GetUsers { users { id } }'
      }

      const result = mockTemplate(operations)

      expect(result).toContain('query GetUsers { users { id } }')
    })

    it('should handle empty operations', () => {
      const result = mockTemplate({})

      expect(result).toContain('export function getSdk')
      expect(result).toContain('return {')
    })

    it('should include wrapper function', () => {
      const operations = {
        GetUsers: 'query GetUsers { users { id } }'
      }

      const result = mockTemplate(operations)

      expect(result).toContain('withWrapper')
      expect(result).toContain('wrappedRequestHeaders')
    })

    it('should set operation type as query', () => {
      const operations = {
        GetUsers: 'query GetUsers { users { id } }'
      }

      const result = mockTemplate(operations)

      expect(result).toContain("'query'")
    })

    it('should handle multiple operations', () => {
      const operations = {
        GetUsers: 'query GetUsers { users { id } }',
        CreateUser: 'mutation CreateUser { createUser { id } }',
        GetPosts: 'query GetPosts { posts { id } }'
      }

      const result = mockTemplate(operations)

      expect(result).toContain('GetUsers:')
      expect(result).toContain('CreateUser:')
      expect(result).toContain('GetPosts:')
    })

    it('should pass variables and headers', () => {
      const operations = {
        GetUsers: 'query GetUsers { users { id } }'
      }

      const result = mockTemplate(operations)

      expect(result).toContain('variables = undefined')
      expect(result).toContain('requestHeaders = undefined')
      expect(result).toContain('...requestHeaders')
    })
  })
})
