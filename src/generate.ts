import { generate } from '@graphql-codegen/cli'
import type { CodegenConfig } from '@graphql-codegen/cli'

import * as PluginTS from '@graphql-codegen/typescript'
import * as PluginTSOperations from '@graphql-codegen/typescript-operations'
import * as PluginTSGraphqlRequest from '@graphql-codegen/typescript-graphql-request'

import { defu } from 'defu'
import { $fetch } from 'ohmyfetch'
import { loadSchema } from '@graphql-tools/load'
import { stitchSchemas } from '@graphql-tools/stitch'
import { GraphQLSchema, print, printSchema } from 'graphql'
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { wrapSchema, introspectSchema, RenameTypes, RenameRootFields } from '@graphql-tools/wrap'

import type { Resolver } from '@nuxt/kit'
import type { GqlConfig, GqlCodegen, StitchOptions } from './types'

interface GenerateOptions {
  clients?: GqlConfig['clients']
  file: string
  silent?: boolean
  plugins?: string[]
  documents?: string[]
  onlyOperationTypes?: boolean
  resolver? : Resolver
}

function pluginLoader (name: string): Promise<any> {
  if (name === '@graphql-codegen/typescript') { return Promise.resolve(PluginTS) }
  if (name === '@graphql-codegen/typescript-operations') { return Promise.resolve(PluginTSOperations) }
  if (name === '@graphql-codegen/typescript-graphql-request') { return Promise.resolve(PluginTSGraphqlRequest) }
}

async function prepareSchemas (schemas: Record<string, string | { host: string, headers: Record<string, string> }>, options?: StitchOptions): Promise<string> {
  const generateSchema = async ({ host, headers, ...rest }) => {
    const executor = async ({ document, variables }) => await $fetch(host, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: print(document), variables })
    })

    return wrapSchema({ ...rest, executor, schema: await introspectSchema(executor) })
  }

  const subschemas: GraphQLSchema[] = []

  for (const [k, v] of Object.entries(schemas)) {
    const host = typeof v === 'string' ? v : v.host
    const headers = typeof v === 'string' ? {} : v.headers

    const transforms = [
      ...(options?.prefixTypes ? [new RenameTypes(name => `${k}_${name}`)] : []),
      ...(options?.prefixFields ? [new RenameRootFields((_, fieldName) => `${k}_${fieldName}`)] : [])
    ]

    let clientSchema: GraphQLSchema = null

    if ((/^(https?:)?\/\//.test(host))) {
      clientSchema = await generateSchema({ host, headers, transforms })
    } else {
      clientSchema = await loadSchema(v, { loaders: [new GraphQLFileLoader()] })
        .then(schema => wrapSchema({ schema, transforms })).catch(() => null)

      if (!clientSchema) { throw new Error('Unable to load local schema file: ' + v) }
    }

    subschemas.push(clientSchema)
  }

  return printSchema(stitchSchemas({ subschemas, mergeTypes: options?.mergeTypes }))
}

async function prepareConfig (options: GenerateOptions & GqlCodegen): Promise<CodegenConfig> {
  const schema = Object.entries(options.clients).reduce((acc, [k, v]) => {
    if (v.schema) {
      v.schema = options.resolver.resolve(v.schema)
      return !options.stitchSchemas && Array.isArray(acc) ? [...acc, v.schema] : { ...acc, [k]: v.schema }
    }

    if (!v?.token?.value && !v?.headers && !v?.codegenHeaders) {
      return !options.stitchSchemas && Array.isArray(acc) ? [...acc, v.host] : { ...acc, [k]: v.host }
    }

    const token = v?.token?.value && `${v?.token?.type} ${v?.token?.value}`.trim()

    const serverHeaders = typeof v?.headers?.serverOnly === 'object' && v?.headers?.serverOnly
    if (v?.headers?.serverOnly) { delete v.headers.serverOnly }

    const headers = {
      ...(v?.headers && { ...(v.headers as Record<string, string>), ...serverHeaders }),
      ...(token && { [v.token.name]: token }),
      ...v?.codegenHeaders
    }

    return !options.stitchSchemas && Array.isArray(acc)
      ? [...acc, { [v.host]: { headers } }]
      : { ...acc, [k]: { host: v.host, headers } }
  }, options.stitchSchemas ? {} : [])

  const stitchOptions = !options?.stitchSchemas ? undefined : defu<StitchOptions, any>({}, options.stitchSchemas, { mergeTypes: true })

  return {
    schema: !options.stitchSchemas ? schema : await prepareSchemas(schema, stitchOptions),
    pluginLoader,
    silent: options.silent,
    documents: options.documents,
    generates: {
      [options.file]: {
        plugins: options.plugins,
        config: {
          skipTypename: options?.skipTypename,
          useTypeImports: options?.useTypeImports,
          dedupeFragments: options?.dedupeFragments,
          gqlImport: 'graphql-request#gql',
          onlyOperationTypes: options.onlyOperationTypes,
          namingConvention: {
            enumValues: 'change-case-all#upperCaseFirst'
          }
        }
      }
    }
  }
}

export default async function (options: GenerateOptions): Promise<string> {
  const config = await prepareConfig(options)

  return await generate(config, false).then(([{ content }]) => content)
}
