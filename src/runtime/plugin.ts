import { defu } from 'defu'
import type { Ref } from 'vue'
import { GqlClient } from 'ogql'
import type { GqlState, GqlConfig, GqlStateOpts } from '../types'
import { ref, useCookie, useNuxtApp, defineNuxtPlugin, useRuntimeConfig, useRequestHeaders } from '#imports'
import type { GqlClients } from '#gql'

export default defineNuxtPlugin((nuxtApp) => {
  // const nuxtApp = useNuxtApp() as Partial<{ _gqlState: Ref<GqlState> }> & ReturnType<typeof useNuxtApp>

  if (!nuxtApp?._gqlState) {
    nuxtApp._gqlState = ref({})

    const config = useRuntimeConfig()

    const { clients }: GqlConfig = defu(config?.['graphql-client'], config?.public?.['graphql-client'])

    const proxyHeaders = Object.values(clients || {}).flatMap(v => v?.proxyHeaders).filter((v, i, a) => Boolean(v) && a.indexOf(v) === i) as string[]
    if (!proxyHeaders.includes('cookie')) { proxyHeaders.push('cookie') }

    const requestHeaders = ((process.server && useRequestHeaders(proxyHeaders)) as Record<string, string>) || undefined

    for (const [name, v] of Object.entries(clients || {})) {
      const host = (process.client && v?.clientHost) || v.host

      const proxyCookie = v?.proxyCookies && !!requestHeaders?.cookie

      let headers = v?.headers as Record<string, string> | undefined
      const serverHeaders = (process.server && (typeof headers?.serverOnly === 'object' && headers?.serverOnly)) || {}

      if (headers?.serverOnly) {
        headers = { ...headers }
        delete headers.serverOnly
      }

      for (const header of (v?.proxyHeaders || [])) {
        if (!requestHeaders?.[header]) { continue }

        headers = { ...headers, [header]: requestHeaders?.[header as keyof typeof requestHeaders] }
      }

      const opts = {
        headers: {
          ...headers,
          ...serverHeaders,
          ...(proxyCookie && { cookie: requestHeaders?.cookie })
        },
        ...v?.corsOptions
      }

      nuxtApp._gqlState.value[name] = {
        options: opts,
        instance: new GraphQLClient(host!, {
          ...(v?.preferGETQueries && {
            method: 'GET',
            jsonSerializer: { parse: JSON.parse, stringify: JSON.stringify }
          }),
          requestMiddleware: async (req) => {
            const token = ref<string>()
            await nuxtApp.callHook('gql:auth:init', { token, client: name as GqlClients })

            const reqOpts = defu(nuxtApp._gqlState.value?.[name]?.options || {}, { headers: {} })

            if (!token.value) { token.value = reqOpts?.token?.value }

            if (token.value === undefined && typeof v.tokenStorage === 'object') {
              if (v.tokenStorage?.mode === 'cookie') {
                if (process.client) {
                  token.value = useCookie(v.tokenStorage.name!).value
                } else if (requestHeaders?.cookie) {
                  const cookieName = `${v.tokenStorage.name}=`
                  token.value = requestHeaders?.cookie.split(';').find(c => c.trim().startsWith(cookieName))?.split('=')?.[1]
                }
              } else if (process.client && v.tokenStorage?.mode === 'localStorage') {
                const storedToken = localStorage.getItem(v.tokenStorage.name!)

                if (storedToken) { token.value = storedToken }
              }
            }
          } else if (process.client && v.tokenStorage?.mode === 'localStorage') {
            const storedToken = localStorage.getItem(v.tokenStorage.name!)

            if (storedToken) { token.value = storedToken }
          }
        }

        if (token.value === undefined) { token.value = v?.token?.value }

        if (token.value) {
          token.value = token.value.trim()

          const tokenName = token.value === reqOpts?.token?.value ? reqOpts?.token?.name || v?.token?.name : v?.token?.name
          const tokenType = token.value === reqOpts?.token?.value ? reqOpts?.token?.type === null ? null : reqOpts?.token?.type || v?.token?.type : v?.token?.type

          const authScheme = !!token.value?.match(/^[a-zA-Z]+\s/)?.[0]

          reqOpts.headers[tokenName] = authScheme ? token.value : !tokenType ? token.value : `${tokenType} ${token.value}`

          return { name: tokenName, token: reqOpts.headers[tokenName] as string }
        }

        return undefined
      }

      nuxtApp._gqlState.value[name] = {
        options: opts,
        instance: GqlClient({
          host,
          useGETForQueries: v?.preferGETQueries,
          middleware: {
            onRequest: async (ctx) => {
              const reqOpts = defu(nuxtApp._gqlState.value?.[name]?.options || {}, { headers: {} })

              await authInit(reqOpts)

              if (reqOpts?.token) { delete reqOpts.token }
              ctx.options = defu(ctx.options, reqOpts)
            }
          },
          wsOptions: {
            connectionParams: async () => {
              const reqOpts = defu(nuxtApp._gqlState.value?.[name]?.options || {}, { headers: {} })

              const token = await authInit(reqOpts)

              if (!token) { return }

              return { [token.name]: token.token }
            }
          }
        })
      }
    }
  }
})

declare module '#app' {
  interface RuntimeNuxtHooks {
    /**
     * `gql:auth:init` hook specifies how the authentication token is retrieved.
     */
    'gql:auth:init': (params: { client: GqlClients, token: Ref<string | undefined> }) => void
  }
}
