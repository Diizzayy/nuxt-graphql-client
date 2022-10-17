import { generate } from '@graphql-codegen/cli'
import type { CodegenConfig } from '@graphql-codegen/cli'

import type { Resolver } from '@nuxt/kit'
import { mapDocsToClients } from './utils'
import type { GqlConfig, GqlCodegen } from './types'

interface GenerateOptions {
  clients?: GqlConfig['clients']
  silent?: boolean
  plugins?: string[]
  documents?: string[]
  onlyOperationTypes?: boolean
  resolver? : Resolver
}

function prepareConfig (options: GenerateOptions & GqlCodegen): CodegenConfig {
  const prepareSchema = (v: GqlConfig['clients'][number]) => {
    if (v.schema) {
      v.schema = options.resolver.resolve(v.schema)
      return [v.schema]
    }

    const host = v?.introspectionHost || v.host

    if (!v?.token?.value && !v?.headers && !v?.codegenHeaders) { return [host] }

    const token = v?.token?.value && !v?.token?.type ? v?.token?.value : `${v?.token?.type} ${v?.token?.value}`.trim()

    const serverHeaders = typeof v?.headers?.serverOnly === 'object' && v?.headers?.serverOnly
    if (v?.headers?.serverOnly) { delete v.headers.serverOnly }

    const headers = {
      ...(v?.headers && { ...(v.headers as Record<string, string>), ...serverHeaders }),
      ...(token && { [v.token.name]: token }),
      ...v?.codegenHeaders
    }

    return [{ [host]: { headers } }]
  }

  const codegenConfig = {
    skipTypename: options?.skipTypename,
    useTypeImports: options?.useTypeImports,
    dedupeFragments: options?.dedupeFragments,
    gqlImport: 'graphql-request#gql',
    onlyOperationTypes: options.onlyOperationTypes,
    namingConvention: {
      enumValues: 'change-case-all#upperCaseFirst'
    }
  }

  const clientDocuments = mapDocsToClients(options.documents, Object.keys(options.clients))

  const generates: CodegenConfig['generates'] = Object.entries(options.clients).reduce((acc, [k, v]) => ({
    ...acc,
    [`${k}.ts`]: {
      config: codegenConfig,
      schema: prepareSchema(v),
      plugins: options.plugins,
      documents: clientDocuments?.[k] || []
    }
  }), {})

  return { silent: options.silent, generates }
}

export default async function (options: GenerateOptions): Promise<{
  filename: string
  content: string
}[]> {
  const config = prepareConfig(options)

  return await generate(config, false)
}
