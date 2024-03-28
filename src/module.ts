import { existsSync, statSync } from 'fs'
import { defu } from 'defu'
import { upperFirst } from 'scule'
import { useLogger, addPlugin, addImportsDir, addTemplate, resolveFiles, createResolver, defineNuxtModule } from '@nuxt/kit'
import { name, version } from '../package.json'
import generate from './generate'
import { mapDocsToClients, extractGqlOperations } from './utils'
import type { GqlConfig, GqlClient, GqlCodegen, TokenStorageOpts } from './types'
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
      onlyOperationTypes: true,
      avoidOptionals: false,
      maybeValue: 'T | null'
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
      clients: Object.keys(config.clients!),
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

    const clientDefaults = {
      token: { type: 'Bearer', name: 'Authorization' },
      proxyCookies: true,
      tokenStorage: config.tokenStorage,
      preferGETQueries: config?.preferGETQueries ?? false
    } as GqlClient<object>

    const defaultClient = (config?.clients?.default && 'default') || Object.keys(config.clients!)[0]

    for (const [k, v] of Object.entries(config.clients!)) {
      const conf = defu<GqlClient<object>, [GqlClient<object>]>(typeof v !== 'object'
        ? { host: v }
        : { ...v, token: typeof v.token === 'string' ? { value: v.token } : v.token }, {
        ...clientDefaults,
        ...(typeof v === 'object' && typeof v.token !== 'string' && v?.token?.type === null && { token: { ...clientDefaults.token, type: null } })
      })

      const runtimeHost = k === defaultClient ? process.env.GQL_HOST : process.env?.[`GQL_${k.toUpperCase()}_HOST`]
      if (runtimeHost) { conf.host = runtimeHost }

      const runtimeClientHost = k === defaultClient ? process.env.GQL_CLIENT_HOST : process.env?.[`GQL_${k.toUpperCase()}_CLIENT_HOST`]
      if (runtimeClientHost) { conf.clientHost = runtimeClientHost }

      if (!conf?.host) {
        logger.warn(`GraphQL client (${k}) is missing it's host.`)
        return
      }

      const runtimeToken = k === defaultClient ? process.env.GQL_TOKEN : process.env?.[`GQL_${k.toUpperCase()}_TOKEN`]
      if (runtimeToken) { conf.token = { ...conf.token, value: runtimeToken } }

      const runtimeTokenName = k === defaultClient ? process.env.GQL_TOKEN_NAME : process.env?.[`GQL_${k.toUpperCase()}_TOKEN_NAME`]
      if (runtimeTokenName) { conf.token = { ...conf.token, name: runtimeTokenName } }

      if (conf.tokenStorage) { conf.tokenStorage.name = conf.tokenStorage?.name || `gql:${k}` }

      const schema = conf?.schema && srcResolver.resolve(conf.schema)

      if (schema && !existsSync(schema)) {
        delete conf.schema
        logger.warn(`[nuxt-graphql-client] The Schema provided for the (${k}) GraphQL Client does not exist. \`host\` will be used as fallback.`)
      }

      ctx.clientOps![k] = []
      config.clients![k] = JSON.parse(JSON.stringify(conf))
      nuxt.options.runtimeConfig.public['graphql-client'].clients![k] = JSON.parse(JSON.stringify(conf))

      if (conf?.token?.value) {
        // @ts-ignore
        nuxt.options.runtimeConfig['graphql-client'].clients[k] = { token: conf.token }

        if (!conf?.retainToken) {
          (nuxt.options.runtimeConfig.public['graphql-client'] as GqlConfig).clients![k].token!.value = undefined
        }
      }
    }

    // Resolve all document path layers that extend the default layer
    const documentPaths = nuxt.options._layers.map(layer => layer.config.srcDir)

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
    async function generateGqlTypes (hmrDoc?: string) {
      const documents: string[] = []
      for await (const path of documentPaths) {
        const files = (await resolveFiles(path, [gqlMatch, '!**/schemas'], { followSymbolicLinks: false })).filter(allowDocument)

        documents.push(...files)
      }

      const plugins = ['typescript']

      if (documents?.length) {
        ctx.clientDocs = mapDocsToClients(documents, ctx.clients!)
        plugins.push('typescript-operations', 'ogql/plugin')
      }

      if (ctx.clientDocs) {
        const clientDocs = !hmrDoc
          ? ctx.clientDocs
          : Object.keys(ctx.clientDocs)
            .filter(k => ctx.clientDocs?.[k]?.some(e => e.endsWith(hmrDoc)))
            .reduce((acc, k) => ({ ...acc, [k]: ctx.clientDocs?.[k] }), {}) as Record<string, string[]>

        const codegenResult = ctx?.codegen
          ? await generate({
            clients: config.clients as GqlConfig['clients'],
            plugins,
            documents,
            resolver: srcResolver,
            clientDocs,
            ...(typeof config.codegen !== 'boolean' && config.codegen)
          }).then(output => output.reduce<Record<string, string>>((acc, c) => ({ ...acc, [c.filename.split('.ts')[0]]: c.content }), {}))
          : ctx.clients!.reduce<Record<string, string>>((acc, k) => {
            if (!clientDocs?.[k]?.length) { return acc }

            const entries = extractGqlOperations(ctx?.clientDocs?.[k] || [])

            return { ...acc, [k]: mockPlugin(entries) }
          }, {})

        ctx.template = defu(codegenResult, ctx.template)
      }

      await prepareContext(ctx, config.functionPrefix!)
    }

    addPlugin(resolver.resolve('runtime/plugin'))

    if (config.autoImport) {
      nuxt.options.alias['#gql'] = resolver.resolve(nuxt.options.buildDir, 'gql')
      nuxt.options.alias['#gql/*'] = resolver.resolve(nuxt.options.buildDir, 'gql', '*')

      addTemplate({
        filename: 'gql.mjs',
        getContents: () => ctx.generateImports?.() || ''
      })

      addTemplate({
        filename: 'gql/index.d.ts',
        getContents: () => ctx.generateDeclarations?.() || ''
      })

      for (const client of ctx.clients) {
        addTemplate({
          write: ctx.codegen,
          filename: `gql/${client}.${ctx.codegen ? 'ts' : 'mjs'}`,
          getContents: () => ctx.template?.[client] || ''
        })
      }

      nuxt.hook('imports:extend', (autoimports) => {
        autoimports.push(...(ctx.fnImports || []))
      })

      addImportsDir(resolver.resolve('runtime/composables'))
    }

    nuxt.hook('nitro:config', (nitro) => {
      if (nitro.imports === false) { return }

      nitro.externals = nitro.externals || {}
      nitro.externals.inline = nitro.externals.inline || []
      nitro.externals.inline.push(resolver.resolve('runtime'))

      const clientSdks = Object.entries(ctx.clientDocs || {}).reduce<string[]>((acc, [client, docs]) => {
        const entries = extractGqlOperations(docs)

        return [...acc, `${client}: ` + mockPlugin(entries).replace('export ', '')]
      }, [])

      nitro.virtual = nitro.virtual || {}
      nitro.virtual['#gql-nitro'] = [
        'const clientSdks = {' + clientSdks + '}',
        'const config = ' + JSON.stringify(config.clients),
        'const ops = ' + JSON.stringify(ctx.clientOps),
        'const clients = {}',
        'const useGql = (op, variables = undefined) => {',
        ' const client = Object.keys(ops).find(k => ops[k].includes(op))',
        ' return clientSdks[client](clients?.[client])[op](variables)',
        '}',
        ctx.fns?.map(fn => `export const ${config.functionPrefix + upperFirst(fn)} = (...params) => useGql('${fn}', ...params)`).join('\n'),
        'export default { clients, config }'
      ].join('\n')

      nitro.imports = defu(nitro.imports, {
        presets: [{
          from: '#gql-nitro',
          imports: ctx.fns?.map(fn => config.functionPrefix + upperFirst(fn))
        }]
      })

      nitro.plugins = nitro.plugins || []
      nitro.plugins.push(resolver.resolve('runtime/nitro'))
    })

    const allowDocument = (f: string) => {
      const isSchema = f.match(/([^/]+)\.(gql|graphql)$/)?.[0]?.toLowerCase().includes('schema')

      return !isSchema && !!statSync(srcResolver.resolve(f)).size
    }

    if (config.watch) {
      nuxt.hook('builder:watch', async (event, path) => {
        if (!path.match(/\.(gql|graphql)$/)) { return }

        if (event !== 'unlink' && !allowDocument(path)) { return }

        const start = Date.now()
        await generateGqlTypes(path)
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
