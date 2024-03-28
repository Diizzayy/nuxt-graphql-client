import { generate } from '@graphql-codegen/cli'

import type { Resolver } from '@nuxt/kit'
import type { CodegenConfig } from '@graphql-codegen/cli'

import type { GqlClient, GqlCodegen } from './types'

interface GenerateOptions {
  silent?: boolean
  plugins?: string[]
  resolver?: Resolver
  documents?: string[]
  onlyOperationTypes?: boolean
  clients?: Record<string, GqlClient<GqlClient>>
  clientDocs?: Record<string, string[]>
}

function prepareConfig (options: GenerateOptions & GqlCodegen): CodegenConfig {
  const prepareSchema = (v: GqlClient<object>) => {
    if (v.schema) {
      v.schema = options.resolver?.resolve(v.schema)
      return [v.schema]
    }

    const host = v?.introspectionHost || v.host

    if (!v?.token?.value && !v?.headers && !v?.codegenHeaders) { return [host] }

    const token = v?.token?.value && !v?.token?.type ? v?.token?.value : `${v?.token?.type} ${v?.token?.value}`.trim()

    const serverHeaders = typeof v?.headers?.serverOnly === 'object' && v?.headers?.serverOnly
    if (v?.headers?.serverOnly) { delete v.headers.serverOnly }

    const headers = {
      ...(v?.headers && { ...(v.headers as Record<string, string>), ...serverHeaders }),
      ...(token && { [v.token!.name!]: token }),
      ...v?.codegenHeaders
    }

    return [{ [host]: { headers } }]
  }

  const codegenConfig = {
    skipTypename: options?.skipTypename,
    useTypeImports: options?.useTypeImports,
    dedupeFragments: options?.dedupeFragments,
    onlyOperationTypes: options.onlyOperationTypes,
    namingConvention: {
      enumValues: 'change-case-all#upperCaseFirst'
    },
    avoidOptionals: options?.avoidOptionals,
    maybeValue: options?.maybeValue
  }

  const generates: CodegenConfig['generates'] = Object.entries(options.clients || {}).reduce((acc, [k, v]) => {
    if (!options?.clientDocs?.[k]?.length) { return acc }

    return {
      ...acc,
      [`${k}.ts`]: {
        config: codegenConfig,
        schema: prepareSchema(v),
        plugins: options.plugins,
        documents: options?.clientDocs?.[k] || []
      }
    }
  }, {})

  return { silent: options.silent, generates }
}

export default async function (options: GenerateOptions): Promise<{
  filename: string
  content: string
}[]> {
  const config = prepareConfig(options)

  return await generate(config, false)
}
