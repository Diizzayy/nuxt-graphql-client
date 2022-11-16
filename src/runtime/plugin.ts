import { defu } from 'defu'
import type { Ref } from 'vue'
import { GqlClient } from 'ohmygql'
import type { GqlState, GqlConfig, GqlStateOpts } from '../types'
import { ref, useCookie, useNuxtApp, defineNuxtPlugin, useRuntimeConfig, useRequestHeaders } from '#imports'
import type { GqlClients } from '#gql'

export default defineNuxtPlugin((nuxtApp) => {
  // const nuxtApp = useNuxtApp() as Partial<{ _gqlState: Ref<GqlState> }> & ReturnType<typeof useNuxtApp>

  if (!nuxtApp?._gqlState) {
    nuxtApp._gqlState = ref({})

    const config = useRuntimeConfig()

    const { clients }: GqlConfig = defu(config?.['graphql-client'], config?.public?.['graphql-client'])

    const cookie = (process.server && useRequestHeaders(['cookie'])?.cookie) || undefined

    for (const [name, v] of Object.entries(clients || {})) {
      const host = (process.client && v?.clientHost) || v.host

      const proxyCookie = v?.proxyCookies && !!cookie

      const serverHeaders = (process.server && (typeof v?.headers?.serverOnly === 'object' && v?.headers?.serverOnly)) || undefined
      if (v?.headers?.serverOnly) { delete v.headers.serverOnly }

      const opts = {
        ...((proxyCookie || v?.token?.value || v?.headers) && {
          headers: {
            ...(v?.headers && { ...(v.headers as Record<string, string>), ...serverHeaders }),
            ...(proxyCookie && { cookie })
          }
        })
      }

      const authInit = async (reqOpts: GqlStateOpts['options']) => {
        const token = ref<string>()
        await nuxtApp.callHook('gql:auth:init', { token, client: name as GqlClients })

        if (!token.value) { token.value = reqOpts?.token?.value }

        if (token.value === undefined && typeof v.tokenStorage === 'object') {
          if (v.tokenStorage?.mode === 'cookie') {
            if (process.client) {
              token.value = useCookie(v.tokenStorage.name!).value
            } else if (cookie) {
              const cookieName = `${v.tokenStorage.name}=`
              token.value = cookie.split(';').find(c => c.trim().startsWith(cookieName))?.split('=')?.[1]
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
