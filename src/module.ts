import { existsSync } from 'fs'
import {
  useLogger,
  addTemplate,
  resolveFiles,
  addAutoImport,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit'
import generate from './generate'
import { name, version } from '../package.json'
import { prepareContext, GqlContext } from './context'

const logger = useLogger('diizzayy:gql')

export interface ModuleOptions {
  /**
   * Prevent codegen from printing to console in dev mode
   *
   * @type boolean
   * @default true
   */
  silent?: boolean

  /**
   * Enable hot reloading for GraphQL documents
   *
   * @type boolean
   * @default true
   */
  watch?: boolean

  /**
   * Auto import functions based on the operation names of your queries & mutations. When set to true, you can write
   * ```ts
   * const { launches } = await GqlLaunches()
   * ```
   * instead of
   * ```ts
   * const { launches } = await useGql().launches()
   * ```
   *
   * @type boolean
   * @default true
   */
  autoImport?: boolean

  /**
   * Prefix for auto imported functions
   *
   * @type string
   * @default 'Gql'
   */
  functionPrefix?: string

  /**
   * Path to folder(s) containing .gql or .graphql files. Can be omitted, module will automatically search for GraphQL Documents in the project's root directory.
   *
   * @note Useful for mono repos.
   *
   * @type string[]
   * @example ['../shared/queries']
   * */
  documentPaths?: string[]

  /**
   * Only generate the types for the operations in your GraphQL documents.
   * When set to true, only the types needed for your operations will be generated.
   * When set to false, all types from the GraphQL schema will be generated.
   *
   * @type boolean
   * @default true
   * */
  onlyOperationTypes?: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name,
    version,
    configKey: 'gql',
    compatibility: {
      nuxt: '^3.0.0',
    },
  },
  defaults: {
    watch: true,
    silent: true,
    autoImport: true,
    functionPrefix: 'Gql',
    onlyOperationTypes: true,
  },
  async setup(options, nuxt) {
    const host = nuxt.options.publicRuntimeConfig.GQL_HOST

    if (!host) {
      return logger.error(
        'Gql Module: GQL_HOST is not set in publicRuntimeConfig'
      )
    }

    const resolver = createResolver(import.meta.url)
    const gqlResolver = createResolver(nuxt.options.srcDir)

    const documentPaths = [gqlResolver.resolve()]

    if (options.documentPaths) {
      for (const path of options.documentPaths) {
        const dir = createResolver(path).resolve()

        if (existsSync(dir)) documentPaths.push(dir)
        else logger.warn(`[Gql Module] Invalid document path: ${dir}`)
      }
    }

    const ctx: GqlContext = {}

    const gqlMatch = '**/*.{gql,graphql}'
    async function generateGqlTypes() {
      const gqlFiles: string[] = []
      for await (const path of documentPaths) {
        const files = await resolveFiles(path, gqlMatch)

        gqlFiles.push(...files)
      }

      const plugins = ['typescript']

      const documents = []

      if (gqlFiles?.length) {
        plugins.push('typescript-operations')

        for (const file of gqlFiles) {
          documents.push(file)
        }

        if (documents?.length) plugins.push('typescript-graphql-request')
      }

      ctx.template = await generate({
        host,
        file: 'gql-sdk.ts',
        silent: options.silent,
        plugins,
        documents,
        onlyOperationTypes: options.onlyOperationTypes,
      })

      prepareContext(ctx, options.functionPrefix)
    }

    addTemplate({
      write: true,
      filename: `gql-sdk.ts`,
      getContents: () => ctx.template,
    })

    addAutoImport({
      as: 'gqlSdk',
      name: 'getSdk',
      from: `#build/gql-sdk`,
    })

    addAutoImport({
      as: 'useGql',
      name: 'useGql',
      from: resolver.resolve('runtime/composables/useGql'),
    })

    if (options.autoImport) {
      addTemplate({
        filename: 'gql.mjs',
        getContents: () => ctx.generateImports(),
      })

      addTemplate({
        filename: 'gql.d.ts',
        getContents: () => ctx.generateDeclarations(),
      })

      // Known bug: isn't triggered on `generateApp`. Hence, your dev server
      // must be restarted when GraphQL documents are renamed or added.
      nuxt.hook('autoImports:extend', (autoimports) => {
        autoimports.push(...ctx.fnImports)
      })

      // TODO: See if needed
      // nuxt.hook('prepare:types', ({ references }) => {
      //   references.push({ path: 'gql.d.ts' })
      // })
    }

    if (options.watch) {
      nuxt.hook('builder:watch', async (_event, path) => {
        if (!path.match(/\.(gql|graphql)$/)) return
        
        const start = Date.now()
        await generateGqlTypes()
        await nuxt.callHook('builder:generateApp')

        const time = Date.now() - start
        logger.success(`[Gql Module]: Generation completed in ${time}ms`)
      })
    }

    await generateGqlTypes()
  },
})

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    /**
     * URL pointing to a GraphQL endpoint
     *
     * @type string
     */
    GQL_HOST: string
  }
  interface PrivateRuntimeConfig {
    /**
     * URL pointing to a GraphQL endpoint
     *
     * @type string
     */
    GQL_HOST: string
  }
}
