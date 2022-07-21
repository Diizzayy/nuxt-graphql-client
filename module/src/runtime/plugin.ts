import { defu } from 'defu'
import type { Ref } from 'vue'
import { GraphQLClient } from 'graphql-request'
import { ref, useNuxtApp, defineNuxtPlugin, useRuntimeConfig, useRequestHeaders } from '#imports'
import type { GqlState, GqlConfig } from '../types'
import { deepmerge } from './utils'

export default defineNuxtPlugin(() => {
  const nuxtApp = useNuxtApp() as Partial<{ _gqlState: Ref<GqlState> }>

  if (!nuxtApp?._gqlState) {
    nuxtApp._gqlState = ref({})

    const config = useRuntimeConfig()
    const { clients }: GqlConfig = deepmerge({}, defu(config?.['graphql-client'], config?.public?.['graphql-client']))

    const cookie = (process.server && useRequestHeaders(['cookie'])?.cookie) || undefined

    for (const [name, v] of Object.entries(clients)) {
      const host = (process.client && v?.clientHost) || v.host

      const proxyCookie = v?.proxyCookies && !!cookie

      const opts = {
        ...((proxyCookie || v?.token?.value || v?.headers) && {
          headers: {
            ...(v?.headers && { ...v.headers }),
            ...(proxyCookie && { cookie }),
            ...(v?.token?.value && { [v.token.name]: `${v.token.type} ${v.token.value}` })
          }
        })
      }

      nuxtApp._gqlState.value[name] = {
        options: opts,
        instance: new GraphQLClient(host, opts)
      }
    }
  }
})
