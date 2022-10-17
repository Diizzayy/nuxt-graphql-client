export const mapDocsToClients = (documents: string[], clients: string[]) => {
  const mappedDocs = new Set()

  const docsWithClient = (client: string) => documents.filter(d => !mappedDocs.has(d)).filter((file: string) => {
    const clientInExt = new RegExp(`\\.${client}\\.(gql|graphql)$`)
    const clientInPath = new RegExp(`\\/${client}\\/(?=${file.split('/').pop()?.replace(/\./g, '\\.')})`)

    const clientSpecified = clientInExt.test(file) || clientInPath.test(file)

    if (clientSpecified) { mappedDocs.add(file) }

    return clientSpecified
  })

  const docsWithoutClient = documents.filter(d => !mappedDocs.has(d)).filter((file: string) => {
    const clientInExt = /\.\w+\.(gql|graphql)$/.test(file)
    const clientInPath = new RegExp(`\\/(${clients.join('|')})\\/(?=${file.split('/').pop()?.replace(/\./g, '\\.')})`).test(file)

    return !clientInExt && !clientInPath
  })

  return clients.reduce((acc, client) => {
    const isDefault = client === 'default' || client === clients[0]

    acc[client] = !isDefault ? docsWithClient(client) : [...docsWithClient(client), ...docsWithoutClient]

    return acc
  }, {} as Record<string, string[]>)
}
