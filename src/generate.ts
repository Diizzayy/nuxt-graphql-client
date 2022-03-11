import { generate } from '@graphql-codegen/cli'

interface GenerateOptions {
  host: string[]
  file: string
  silent?: boolean
  plugins?: string[]
  documents?: string[]
  onlyOperationTypes?: boolean
}

export default async function (options: GenerateOptions): Promise<string> {
  const [{ content }]: [{ content: string }] = await generate(
    {
      schema: options.host,
      silent: options.silent,
      documents: options.documents,
      generates: {
        [options.file]: {
          plugins: options.plugins,
          config: {
            skipTypename: true,
            useTypeImports: true,
            gqlImport: 'graphql-request#gql',
            onlyOperationTypes: options.onlyOperationTypes,
          },
        },
      },
    },
    false
  )

  return content
}
