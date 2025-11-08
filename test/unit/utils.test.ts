import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { mapDocsToClients, extractGqlOperations } from '../../src/utils'

const testDir = join(process.cwd(), 'test/fixtures/gql')

describe('utils', () => {
  beforeAll(() => {
    mkdirSync(testDir, { recursive: true })
    mkdirSync(join(testDir, 'spacex'), { recursive: true })
    mkdirSync(join(testDir, 'github'), { recursive: true })

    // Create test GraphQL documents
    writeFileSync(
      join(testDir, 'query.gql'),
      'query GetUser { user { id name } }'
    )

    writeFileSync(
      join(testDir, 'mutation.gql'),
      'mutation CreateUser($name: String!) { createUser(name: $name) { id } }'
    )

    writeFileSync(
      join(testDir, 'query.spacex.gql'),
      'query GetLaunches { launches { id mission_name } }'
    )

    writeFileSync(
      join(testDir, 'spacex', 'crew.gql'),
      'query GetCrew { crew { id name } }'
    )

    writeFileSync(
      join(testDir, 'query.github.gql'),
      'query GetViewer { viewer { login name } }'
    )

    writeFileSync(
      join(testDir, 'github', 'repos.gql'),
      'query GetRepos { viewer { repositories { nodes { name } } } }'
    )

    writeFileSync(
      join(testDir, 'unnamed.gql'),
      '{ user { id } }'
    )

    writeFileSync(
      join(testDir, 'multi-op.gql'),
      `query FirstQuery { user { id } }
       query SecondQuery { user { name } }`
    )
  })

  afterAll(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  describe('mapDocsToClients', () => {
    it('should map documents to default client when no specific client is mentioned', () => {
      const documents = [
        join(testDir, 'query.gql'),
        join(testDir, 'mutation.gql')
      ]
      const clients = ['default']

      const result = mapDocsToClients(documents, clients)

      expect(result).toEqual({
        default: [join(testDir, 'query.gql'), join(testDir, 'mutation.gql')]
      })
    })

    it('should map documents with client in extension', () => {
      const documents = [
        join(testDir, 'query.gql'),
        join(testDir, 'query.spacex.gql'),
        join(testDir, 'query.github.gql')
      ]
      const clients = ['default', 'spacex', 'github']

      const result = mapDocsToClients(documents, clients)

      expect(result.spacex).toContain(join(testDir, 'query.spacex.gql'))
      expect(result.github).toContain(join(testDir, 'query.github.gql'))
      expect(result.default).toContain(join(testDir, 'query.gql'))
      expect(result.default).not.toContain(join(testDir, 'query.spacex.gql'))
      expect(result.default).not.toContain(join(testDir, 'query.github.gql'))
    })

    it('should map documents with client in path', () => {
      const documents = [
        join(testDir, 'query.gql'),
        join(testDir, 'spacex', 'crew.gql'),
        join(testDir, 'github', 'repos.gql')
      ]
      const clients = ['default', 'spacex', 'github']

      const result = mapDocsToClients(documents, clients)

      expect(result.spacex).toContain(join(testDir, 'spacex', 'crew.gql'))
      expect(result.github).toContain(join(testDir, 'github', 'repos.gql'))
      expect(result.default).toContain(join(testDir, 'query.gql'))
    })

    it('should assign unspecified documents to default client', () => {
      const documents = [
        join(testDir, 'query.gql'),
        join(testDir, 'mutation.gql')
      ]
      const clients = ['spacex', 'github']

      const result = mapDocsToClients(documents, clients)

      // When no 'default' client exists, first client gets unspecified docs
      expect(result.spacex).toContain(join(testDir, 'query.gql'))
      expect(result.spacex).toContain(join(testDir, 'mutation.gql'))
    })

    it('should handle mixed document naming conventions', () => {
      const documents = [
        join(testDir, 'query.gql'),
        join(testDir, 'query.spacex.gql'),
        join(testDir, 'spacex', 'crew.gql'),
        join(testDir, 'github', 'repos.gql')
      ]
      const clients = ['default', 'spacex', 'github']

      const result = mapDocsToClients(documents, clients)

      expect(result.default).toContain(join(testDir, 'query.gql'))
      expect(result.spacex).toContain(join(testDir, 'query.spacex.gql'))
      expect(result.spacex).toContain(join(testDir, 'spacex', 'crew.gql'))
      expect(result.github).toContain(join(testDir, 'github', 'repos.gql'))
    })

    it('should not duplicate documents across clients', () => {
      const documents = [join(testDir, 'query.spacex.gql')]
      const clients = ['default', 'spacex']

      const result = mapDocsToClients(documents, clients)

      expect(result.spacex).toContain(join(testDir, 'query.spacex.gql'))
      expect(result.default).not.toContain(join(testDir, 'query.spacex.gql'))
    })

    it('should handle empty documents array', () => {
      const documents: string[] = []
      const clients = ['default']

      const result = mapDocsToClients(documents, clients)

      expect(result).toEqual({ default: [] })
    })

    it('should handle single client', () => {
      const documents = [
        join(testDir, 'query.gql'),
        join(testDir, 'mutation.gql')
      ]
      const clients = ['default']

      const result = mapDocsToClients(documents, clients)

      expect(result.default).toHaveLength(2)
    })
  })

  describe('extractGqlOperations', () => {
    it('should extract named query operation', () => {
      const docs = [join(testDir, 'query.gql')]

      const result = extractGqlOperations(docs)

      expect(result).toHaveProperty('GetUser')
      expect(result.GetUser).toContain('query GetUser')
      expect(result.GetUser).toContain('user')
    })

    it('should extract named mutation operation', () => {
      const docs = [join(testDir, 'mutation.gql')]

      const result = extractGqlOperations(docs)

      expect(result).toHaveProperty('CreateUser')
      expect(result.CreateUser).toContain('mutation CreateUser')
    })

    it('should extract multiple operations from single file', () => {
      const docs = [join(testDir, 'multi-op.gql')]

      const result = extractGqlOperations(docs)

      expect(result).toHaveProperty('FirstQuery')
      expect(result).toHaveProperty('SecondQuery')
      expect(result.FirstQuery).toContain('query FirstQuery')
      expect(result.SecondQuery).toContain('query SecondQuery')
    })

    it('should extract operations from multiple files', () => {
      const docs = [
        join(testDir, 'query.gql'),
        join(testDir, 'mutation.gql')
      ]

      const result = extractGqlOperations(docs)

      expect(result).toHaveProperty('GetUser')
      expect(result).toHaveProperty('CreateUser')
    })

    it('should handle empty array', () => {
      const result = extractGqlOperations([])

      expect(result).toEqual({})
    })

    it('should extract operations with variables', () => {
      const docs = [join(testDir, 'mutation.gql')]

      const result = extractGqlOperations(docs)

      expect(result.CreateUser).toContain('$name: String!')
    })

    it('should extract spacex-specific operations', () => {
      const docs = [join(testDir, 'query.spacex.gql')]

      const result = extractGqlOperations(docs)

      expect(result).toHaveProperty('GetLaunches')
      expect(result.GetLaunches).toContain('launches')
    })

    it('should extract github-specific operations', () => {
      const docs = [join(testDir, 'query.github.gql')]

      const result = extractGqlOperations(docs)

      expect(result).toHaveProperty('GetViewer')
      expect(result.GetViewer).toContain('viewer')
    })

    it('should preserve operation structure', () => {
      const docs = [join(testDir, 'query.gql')]

      const result = extractGqlOperations(docs)

      expect(result.GetUser).toContain('id')
      expect(result.GetUser).toContain('name')
    })
  })
})
