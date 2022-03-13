import { generate } from '@graphql-codegen/cli'
import type { Types } from '@graphql-codegen/plugin-helpers'
import type { GqlConfigReady } from './module'

interface GenerateOptions {
  clients?: GqlConfigReady['clients']
  file: string
  silent?: boolean
  plugins?: string[]
  documents?: string[]
  onlyOperationTypes?: boolean
}

export default async function (options: GenerateOptions): Promise<string> {
  let schema: Types.Config['schema'] = Object.values(options.clients).map((v) =>
    !v?.token
      ? v.host
      : { [v.host]: { headers: { Authorization: 'Bearer ' + v.token } } }
  )

  const [{ content }]: [{ content: string }] = await generate(
    {
      schema,
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
