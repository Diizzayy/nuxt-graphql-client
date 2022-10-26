import { existsSync, statSync, readFileSync } from 'fs'
import { defu } from 'defu'
import { parse } from 'graphql'
import { mockPlugin } from 'ohmygql/plugin'
import { useLogger, addPlugin, addImportsDir, addTemplate, resolveFiles, createResolver, defineNuxtModule, extendViteConfig } from '@nuxt/kit'
import type { NameNode, DefinitionNode } from 'graphql'
import { name, version } from '../package.json'
import generate from './generate'
import { deepmerge } from './runtime/utils'
import { mapDocsToClients } from './utils'
import type { GqlConfig, GqlClient, TokenOpts, GqlCodegen, TokenStorageOpts } from './types'
import { prepareContext } from './context'
import type { GqlContext } from './context'

const logger = useLogger('nuxt-graphql-client')

export type ModuleOptions = Partial<GqlConfig>

export default defineNuxtModule<GqlConfig>({
  meta: {
    name,
    version,
    configKey: 'graphql-client',
    compatibility: {
      nuxt: '^3.0.0-rc.9'
    }
  },
  defaults: {
    clients: {},
    watch: true,
    codegen: true,
    autoImport: true,
    tokenStorage: true,
    functionPrefix: 'Gql'
  },
  async setup (opts, nuxt) {
    const resolver = createResolver(import.meta.url)
    const srcResolver = createResolver(nuxt.options.srcDir)

    nuxt.options.build.transpile.push(resolver.resolve('runtime'))

    const config: GqlConfig<string | GqlClient> = defu(
      {},
      nuxt.options.runtimeConfig.public['graphql-client'],
      nuxt.options.runtimeConfig.public.gql,
      opts)

    const codegenDefaults: GqlCodegen = {
      silent: true,
      skipTypename: true,
      useTypeImports: true,
      dedupeFragments: true,
      disableOnBuild: false,
      onlyOperationTypes: true
    }

    config.codegen = !!config.codegen && defu<GqlCodegen, [GqlCodegen]>(config.codegen, codegenDefaults)

    config.tokenStorage = !!config.tokenStorage && defu<TokenStorageOpts, [TokenStorageOpts]>(config.tokenStorage, {
      mode: 'cookie',
      cookieOptions: {
        maxAge: 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === 'production'
      }
    })

    const ctx: GqlContext = {
      clientOps: {},
      fnImports: [],
      clients: Object.keys(config.clients),
      codegen: !config?.codegen ? false : !(!nuxt.options._prepare && !nuxt.options.dev) ? (nuxt.options._prepare || nuxt.options.dev) : !config?.codegen?.disableOnBuild
    }

    if (!ctx?.clients?.length) {
      const host =
        process.env.GQL_HOST || nuxt.options.runtimeConfig.public.GQL_HOST

      const clientHost =
        process.env.GQL_CLIENT_HOST || nuxt.options.runtimeConfig.public.GQL_CLIENT_HOST

      if (!host) {
        logger.warn('No GraphQL clients configured. Skipping module setup.')
        return
      }

      ctx.clients = ['default']
      config.clients = !clientHost ? { default: host } : { default: { host, clientHost } }
    }

    // @ts-ignore
    nuxt.options.runtimeConfig['graphql-client'] = { clients: {} }
    nuxt.options.runtimeConfig.public['graphql-client'] = defu(nuxt.options.runtimeConfig.public['graphql-client'], { clients: {} })

    const clientDefaults: Partial<GqlClient<TokenOpts> > = {
      token: { type: 'Bearer', name: 'Authorization' },
      proxyCookies: true,
      tokenStorage: config.tokenStorage,
      preferGETQueries: config?.preferGETQueries ?? false
    }

    const defaultClient = (config?.clients?.default && 'default') || Object.keys(config.clients)[0]

    for (const [k, v] of Object.entries(config.clients)) {
      const conf = defu<GqlClient<TokenOpts>, [Partial<GqlClient<object>>]>(typeof v !== 'object'
        ? { host: v }
        : { ...v, token: typeof v.token === 'string' ? { value: v.token } : v.token }, {
        ...clientDefaults,
        ...(typeof v === 'object' && typeof v.token !== 'string' && v?.token?.type === null && { token: { type: null } })
      })

      const runtimeHost = k === defaultClient ? process.env.GQL_HOST : process.env?.[`GQL_${k.toUpperCase()}_HOST`]
      if (runtimeHost) { conf.host = runtimeHost }

      const runtimeClientHost = k === defaultClient ? process.env.GQL_CLIENT_HOST : process.env?.[`GQL_${k.toUpperCase()}_CLIENT_HOST`]
      if (runtimeClientHost) { conf.clientHost = runtimeClientHost }

      if (!conf?.host) { throw new Error(`GraphQL client (${k}) is missing it's host.`) }

      const runtimeToken = k === defaultClient ? process.env.GQL_TOKEN : process.env?.[`GQL_${k.toUpperCase()}_TOKEN`]
      if (runtimeToken) { conf.token.value = runtimeToken }

      const runtimeTokenName = k === defaultClient ? process.env.GQL_TOKEN_NAME : process.env?.[`GQL_${k.toUpperCase()}_TOKEN_NAME`]
      if (runtimeTokenName) { conf.token.name = runtimeTokenName }

      if (conf.tokenStorage) { conf.tokenStorage.name = conf.tokenStorage?.name || `gql:${k}` }

      const schema = conf?.schema && srcResolver.resolve(conf.schema)

      if (schema && !existsSync(schema)) {
        delete conf.schema
        logger.warn(`[nuxt-graphql-client] The Schema provided for the (${k}) GraphQL Client does not exist. \`host\` will be used as fallback.`)
      }

      ctx.clientOps[k] = []
      config.clients[k] = deepmerge({}, conf)
      nuxt.options.runtimeConfig.public['graphql-client'].clients[k] = deepmerge({}, conf)

      if (conf?.token?.value) {
        nuxt.options.runtimeConfig['graphql-client'].clients[k] = { token: conf.token }

        if (!conf?.retainToken) {
          (nuxt.options.runtimeConfig.public['graphql-client'] as GqlConfig).clients[k].token.value = undefined
        }
      }
    }

    const documentPaths = [srcResolver.resolve()]

    if (config.documentPaths) {
      for (const path of config.documentPaths) {
        const dir = srcResolver.resolve(path)

        if (existsSync(dir)) {
          documentPaths.push(dir)
        } else {
          logger.warn(`[nuxt-graphql-client] Invalid document path: ${dir}`)
        }
      }
    }

    const gqlMatch = '**/*.{gql,graphql}'
    async function generateGqlTypes () {
      const documents: string[] = []
      for await (const path of documentPaths) {
        const files = (await resolveFiles(path, [gqlMatch, '!**/schemas'], { followSymbolicLinks: false })).filter(allowDocument)

        documents.push(...files)
      }

      const plugins = ['typescript']

      if (documents?.length) {
        ctx.clientDocs = mapDocsToClients(documents, ctx.clients)
        plugins.push('typescript-operations', 'ohmygql/plugin')
      }

      if (ctx.clientDocs) {
        ctx.template = ctx?.codegen
          ? await generate({
            clients: config.clients as GqlConfig['clients'],
            plugins,
            documents,
            resolver: srcResolver,
            clientDocs: ctx.clientDocs,
            ...(typeof config.codegen !== 'boolean' && config.codegen)
          }).then(output => output.reduce((acc, c) => ({ ...acc, [c.filename.split('.ts')[0]]: c.content }), {}))
          : ctx.template = ctx.clients.reduce<Record<string, string>>((acc, k) => {
            const entries: Record<string, string> = {}

            for (const doc of ctx?.clientDocs?.[k] || []) {
              const definitions = parse(readFileSync(doc, 'utf-8'))?.definitions as (DefinitionNode & { name: NameNode })[]

              for (const op of definitions) {
                const name: string = op?.name?.value
                const operation = op.loc?.source.body.slice(op.loc.start, op.loc.end) || undefined

                if (name && operation) { entries[name] = operation }
              }
            }

            return { ...acc, [k]: mockPlugin(entries) }
          }, {})
      }

      await prepareContext(ctx, config.functionPrefix)
    }

    addPlugin(resolver.resolve('runtime/plugin'))

    if (config.autoImport) {
      nuxt.options.alias['#gql'] = resolver.resolve(nuxt.options.buildDir, 'gql')

      addTemplate({
        filename: 'gql.mjs',
        getContents: () => ctx.generateImports()
      })

      addTemplate({
        filename: 'gql/index.d.ts',
        getContents: () => ctx.generateDeclarations()
      })

      for (const client of ctx.clients) {
        addTemplate({
          write: ctx.codegen,
          filename: `gql/${client}.${ctx.codegen ? 'ts' : 'mjs'}`,
          getContents: () => ctx.template?.[client] || ''
        })
      }

      nuxt.hook('imports:extend', (autoimports) => {
        autoimports.push(...ctx.fnImports)
      })

      addImportsDir(resolver.resolve('runtime/composables'))
    }

    const allowDocument = (f: string) => {
      const isSchema = f.match(/([^/]+)\.(gql|graphql)$/)?.[0]?.toLowerCase().includes('schema')

      return !isSchema && !!statSync(srcResolver.resolve(f)).size
    }

    if (config.watch) {
      nuxt.hook('builder:watch', async (event, path) => {
        if (!path.match(/\.(gql|graphql)$/)) { return }

        if (event !== 'unlink' && !allowDocument(path)) { return }

        const start = Date.now()
        await generateGqlTypes()
        await nuxt.callHook('builder:generateApp')

        const time = Date.now() - start
        logger.success(`[GraphQL Client]: Generation completed in ${time}ms`)
      })
    }

    await generateGqlTypes()
  }
})

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    /**
     * URL pointing to a GraphQL endpoint
     *
     * @type string
     */
    // @ts-ignore
    GQL_HOST?: string

    /**
     * Specify a host to be used for client side requests.
     *
     * @type string
     */
    GQL_CLIENT_HOST?: string

    // @ts-ignore
    gql?: GqlConfig<any>

    // @ts-ignore
    'graphql-client'?: GqlConfig<any>
  }
}
