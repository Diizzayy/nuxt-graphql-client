import { promises as fsp, existsSync } from 'fs'
import { defu } from 'defu'
import { generate, loadCodegenConfig } from '@graphql-codegen/cli'
import type { Types } from '@graphql-codegen/plugin-helpers'
import type { Resolver } from '@nuxt/kit'
import type { GqlConfig } from './module'

interface GenerateOptions {
  clients?: GqlConfig['clients']
  file: string
  silent?: boolean
  plugins?: string[]
  documents?: string[]
  onlyOperationTypes?: boolean
  resolver? : Resolver
}

async function prepareConfig (options: GenerateOptions): Promise<Types.Config> {
  const schema: Types.Config['schema'] = Object.values(options.clients).map(v =>
    !v?.token?.value
      ? v.host
      : { [v.host]: { headers: { [v?.token?.name || 'Authorization']: `Bearer ${v.token.value}` } } }
  )

  const config: Types.Config = {
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
          namingConvention: {
            enumValues: 'change-case-all#upperCaseFirst'
          }
        }
      }
    }
  }

  if (process.platform !== 'win32') { return config }

  const codegenConfig = options.resolver.resolve('.graphqlrc')

  if (!existsSync(codegenConfig)) {
    await fsp.writeFile(codegenConfig, JSON.stringify(config, null, 2), { encoding: 'utf8' })
  } else {
    const codegenConfigContent = await fsp.readFile(codegenConfig, { encoding: 'utf8' }).then(JSON.parse)

    const appropriate = JSON.stringify(defu({ ...codegenConfigContent, ...config }), null, 2)

    await fsp.writeFile(codegenConfig, appropriate, { encoding: 'utf8' })
  }

  return (await loadCodegenConfig({ configFilePath: codegenConfig }))?.config
}

export default async function (options: GenerateOptions): Promise<string> {
  const config = await prepareConfig(options)

  return await generate(config, false).then(([{ content }]) => content)
}
