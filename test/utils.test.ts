import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { mapDocsToClients, extractGqlOperations } from '../src/utils'

const testDir = join(process.cwd(), 'test', '__fixtures__')

describe('utils', () => {
  beforeEach(() => {
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  describe('mapDocsToClients', () => {
    it('should map documents without client specifier to default client', () => {
      const documents = [
        join(testDir, 'query.gql'),
        join(testDir, 'mutation.graphql')
      ]
      const clients = ['default']

      const result = mapDocsToClients(documents, clients)

      expect(result).toEqual({
        default: documents
      })
    })

    it('should map documents with client extension specifier', () => {
      const defaultDoc = join(testDir, 'query.gql')
      const spacexDoc = join(testDir, 'launches.spacex.gql')
      const githubDoc = join(testDir, 'user.github.graphql')

      const documents = [defaultDoc, spacexDoc, githubDoc]
      const clients = ['default', 'spacex', 'github']

      const result = mapDocsToClients(documents, clients)

      expect(result.default).toContain(defaultDoc)
      expect(result.spacex).toContain(spacexDoc)
      expect(result.github).toContain(githubDoc)
    })

    it('should map documents with client path specifier', () => {
      mkdirSync(join(testDir, 'spacex'), { recursive: true })
      mkdirSync(join(testDir, 'github'), { recursive: true })

      const defaultDoc = join(testDir, 'query.gql')
      const spacexDoc = join(testDir, 'spacex', 'launches.gql')
      const githubDoc = join(testDir, 'github', 'user.gql')

      const documents = [defaultDoc, spacexDoc, githubDoc]
      const clients = ['default', 'spacex', 'github']

      const result = mapDocsToClients(documents, clients)

      expect(result.default).toContain(defaultDoc)
      expect(result.spacex).toContain(spacexDoc)
      expect(result.github).toContain(githubDoc)
    })

    it('should map documents to first client when default is not present', () => {
      const documents = [
        join(testDir, 'query.gql')
      ]
      const clients = ['spacex', 'github']

      const result = mapDocsToClients(documents, clients)

      expect(result.spacex).toContain(documents[0])
      expect(result.github).toEqual([])
    })

    it('should handle nested client paths', () => {
      mkdirSync(join(testDir, 'queries', 'spacex'), { recursive: true })

      const spacexDoc = join(testDir, 'queries', 'spacex', 'launches.gql')
      const documents = [spacexDoc]
      const clients = ['default', 'spacex']

      const result = mapDocsToClients(documents, clients)

      expect(result.spacex).toContain(spacexDoc)
      expect(result.default).toEqual([])
    })

    it('should not map the same document to multiple clients', () => {
      const spacexDoc = join(testDir, 'launches.spacex.gql')
      const documents = [spacexDoc]
      const clients = ['default', 'spacex']

      const result = mapDocsToClients(documents, clients)

      expect(result.spacex).toContain(spacexDoc)
      expect(result.default).not.toContain(spacexDoc)
    })
  })

  describe('extractGqlOperations', () => {
    it('should extract GraphQL query operations', () => {
      const queryFile = join(testDir, 'launches.gql')
      const queryContent = `
        query GetLaunches {
          launches {
            id
            mission_name
          }
        }
      `
      writeFileSync(queryFile, queryContent)

      const result = extractGqlOperations([queryFile])

      expect(result).toHaveProperty('GetLaunches')
      expect(result.GetLaunches).toContain('query GetLaunches')
      expect(result.GetLaunches).toContain('launches')
      expect(result.GetLaunches).toContain('mission_name')
    })

    it('should extract GraphQL mutation operations', () => {
      const mutationFile = join(testDir, 'createUser.gql')
      const mutationContent = `
        mutation CreateUser($name: String!) {
          createUser(name: $name) {
            id
            name
          }
        }
      `
      writeFileSync(mutationFile, mutationContent)

      const result = extractGqlOperations([mutationFile])

      expect(result).toHaveProperty('CreateUser')
      expect(result.CreateUser).toContain('mutation CreateUser')
      expect(result.CreateUser).toContain('$name: String!')
    })

    it('should extract multiple operations from multiple files', () => {
      const queryFile = join(testDir, 'query.gql')
      const mutationFile = join(testDir, 'mutation.gql')

      writeFileSync(queryFile, `
        query GetUser {
          user {
            id
            name
          }
        }
      `)

      writeFileSync(mutationFile, `
        mutation UpdateUser($id: ID!) {
          updateUser(id: $id) {
            id
            name
          }
        }
      `)

      const result = extractGqlOperations([queryFile, mutationFile])

      expect(result).toHaveProperty('GetUser')
      expect(result).toHaveProperty('UpdateUser')
    })

    it('should extract multiple operations from a single file', () => {
      const operationsFile = join(testDir, 'operations.gql')
      writeFileSync(operationsFile, `
        query GetUser {
          user {
            id
          }
        }

        mutation CreateUser($name: String!) {
          createUser(name: $name) {
            id
          }
        }

        query GetPosts {
          posts {
            id
            title
          }
        }
      `)

      const result = extractGqlOperations([operationsFile])

      expect(result).toHaveProperty('GetUser')
      expect(result).toHaveProperty('CreateUser')
      expect(result).toHaveProperty('GetPosts')
      expect(Object.keys(result)).toHaveLength(3)
    })

    it('should handle fragments', () => {
      const fragmentFile = join(testDir, 'fragments.gql')
      writeFileSync(fragmentFile, `
        fragment UserFields on User {
          id
          name
          email
        }

        query GetUser {
          user {
            ...UserFields
          }
        }
      `)

      const result = extractGqlOperations([fragmentFile])

      expect(result).toHaveProperty('UserFields')
      expect(result).toHaveProperty('GetUser')
    })

    it('should preserve operation structure with variables and directives', () => {
      const queryFile = join(testDir, 'complex.gql')
      writeFileSync(queryFile, `
        query GetUser($id: ID!, $includeEmail: Boolean = false) {
          user(id: $id) {
            id
            name
            email @include(if: $includeEmail)
          }
        }
      `)

      const result = extractGqlOperations([queryFile])

      expect(result.GetUser).toContain('$id: ID!')
      expect(result.GetUser).toContain('$includeEmail: Boolean = false')
      expect(result.GetUser).toContain('@include(if: $includeEmail)')
    })

    it('should handle empty files array', () => {
      const result = extractGqlOperations([])

      expect(result).toEqual({})
    })
  })
})
