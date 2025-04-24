import { readFileSync } from 'node:fs'
import { parse } from 'graphql'
import type { DefinitionNode, NameNode } from 'graphql'

export const mapDocsToClients = (documents: string[], clients: string[]) => {
  const mappedDocs = new Set()

  const docsWithClient = (client: string) => documents.filter(d => !mappedDocs.has(d)).filter((file: string) => {
    const clientInExt = new RegExp(`\\.${client}\\.(gql|graphql)$`)
    const clientInPath = new RegExp(`\\/${client}\\/(.+\\/)?(?=${file.split('/').pop()?.replace(/\./g, '\\.')})`)

    const clientSpecified = clientInExt.test(file) || clientInPath.test(file)

    if (clientSpecified) { mappedDocs.add(file) }

    return clientSpecified
  })

  const docsWithoutClient = documents.filter(d => !mappedDocs.has(d)).filter((file: string) => {
    const clientInExt = new RegExp(`\\.(${clients.join('|')})\\.(gql|graphql)$`).test(file)
    const clientInPath = new RegExp(`\\/(${clients.join('|')})\\/(?=${file.split('/').pop()?.replace(/\./g, '\\.')})`).test(file)

    return !clientInExt && !clientInPath
  })

  return clients.reduce((acc, client) => {
    const isDefault = client === 'default' || (!clients.includes('default') && client === clients[0])

    acc[client] = !isDefault ? docsWithClient(client) : [...docsWithClient(client), ...docsWithoutClient]

    return acc
  }, {} as Record<string, string[]>)
}

export const extractGqlOperations = (docs: string[]): Record<string, string> => {
  const entries: Record<string, string> = {}

  for (const doc of docs) {
    const definitions = parse(readFileSync(doc, 'utf-8'))?.definitions as (DefinitionNode & { name: NameNode })[]

    for (const op of definitions) {
      const name: string = op?.name?.value
      const operation = op.loc?.source.body.slice(op.loc.start, op.loc.end) || undefined

      if (name && operation) { entries[name] = operation }
    }
  }

  return entries
}
