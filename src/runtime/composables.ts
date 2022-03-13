import { GraphQLClient } from 'graphql-request'
import { useNuxtApp, useRuntimeConfig } from '#app'
import { gqlSdk } from '#imports'
import type { Ref } from 'vue'
import type { GqlClients } from '#build/gql'
import type { GqlConfig } from '../module'

interface GqlState {
  clients?: Record<string, GraphQLClient>

  options?: Record<string, RequestInit>

  /**
   * Send cookies from the browser to the GraphQL server in SSR mode.
   *
   * @default true
   * */
  proxyCookies?: boolean
}

const deepMerge = (a: GqlState, b: GqlState) => {
  const result = { ...a }
  for (const key in b) {
    if (b.hasOwnProperty(key)) {
      if (typeof b[key] === 'object' && b[key] !== null) {
        result[key] = deepMerge(result[key] || {}, b[key])
      } else {
        result[key] = b[key]
      }
    }
  }
  return result
}

const DEFAULT_STATE: GqlState = { proxyCookies: true }

/**
 *
 * @param {object} state
 * @param {boolean} reset
 *
 * */
// The decision was made to avert using `GraphQLClient's` `setHeader(s)` helper in favor of reactivity and more granular control.
const useGqlState = (state?: GqlState, reset?: boolean): Ref<GqlState> => {
  const nuxtApp = useNuxtApp()

  if (!nuxtApp._gqlState) {
    nuxtApp._gqlState = ref<GqlState>(Object.assign({}, DEFAULT_STATE))
  }

  if (state) {
    if (state.options) {
      const optionKeys = Object.keys(state.options || {})

      for (const k of optionKeys) {
        if (!nuxtApp._gqlState.value.clients?.[k]) delete state.options[k]
      }
    }

    if (reset === undefined) reset = !Object.keys(state).length

    if (reset) {
      nuxtApp._gqlState.value = Object.assign(DEFAULT_STATE, {
        clients: nuxtApp._gqlState.value.clients,
      })
    } else nuxtApp._gqlState.value = deepMerge(nuxtApp._gqlState.value, state)

    const clients = nuxtApp._gqlState.value.clients

    if (clients) {
      for (let [k, v] of Object.entries(clients)) {
        if (reset) {
          v['options'] = {}

          continue
        }

        if (!state?.options?.[k]) continue

        v['options'] = nuxtApp._gqlState.value.options[k]
      }
    }
  }

  return nuxtApp._gqlState as Ref<GqlState>
}

const initClients = () => {
  const state = useGqlState()

  const { clients } = useRuntimeConfig()?.['graphql-client'] as GqlConfig

  state.value.clients = state.value?.clients || {}
  state.value.options = state.value?.options || {}

  for (const [name, v] of Object.entries(clients)) {
    if (state.value?.clients[name]) continue

    if (!state.value?.options[name]) state.value.options[name] = {}

    const host = typeof v === 'string' ? v : v.host

    const c = new GraphQLClient(host, state.value.options[name])
    state.value.clients[name] = c
  }
}

const getClient = (client?: GqlClients): GqlClients => {
  const state = useGqlState()

  if (client && state.value?.clients?.[client]) return client

  const { clients } = useRuntimeConfig()?.['graphql-client'] as GqlConfig

  if (!state.value.clients || !state.value.options) initClients()

  if (!client && Object.keys(clients)?.length) {
    const defaultClient = Object.entries(clients).find(
      ([k, v]) => k === 'default' || (typeof v !== 'string' && v.default)
    )

    if (defaultClient) client = defaultClient[0] as GqlClients
    else client = Object.keys(clients)[0] as GqlClients
  }

  return client
}

const useGqlClient = (client?: GqlClients): GraphQLClient => {
  const state = useGqlState()

  client = getClient(client)

  return state.value.clients[client]
}

/**
 * `useGqlHeaders` allows you to set headers for all subsequent requests.
 *
 * @param {object} headers
 * @param {string} client
 *
 * @example
 * - Set headers for default client
 * ```ts
 * useGqlHeaders({ 'X-Custom-Header': 'Custom Value' })
 * ```
 *
 * - Set headers for a specific client (multi-client mode)
 * ```ts
 * useGqlHeaders({
 *   'X-Custom-Header': 'Custom Value'
 * }, 'my-client')
 * ```
 * */
export const useGqlHeaders = (headers: HeadersInit, client?: GqlClients) => {
  client = getClient(client)

  useGqlState({ options: { [client]: { headers } } })
}

interface GqlTokenConfig {
  /**
   * The name of the Authentication token header.
   *
   * @default 'Authorization'
   * */
  name: string

  /**
   * The HTTP Authentication scheme.
   *
   * @default "Bearer"
   * */
  type?: string
}

const DEFAULT_AUTH: GqlTokenConfig = { type: 'Bearer', name: 'authorization' }

type GqlTokenOptions = {
  /**
   * Configure the auth token
   *
   * @default
   * `{ type: 'Bearer', name: 'authorization' }`
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization
   * */
  config?: GqlTokenConfig

  /**
   * The name of your GraphQL clients.
   * @note defined in `nuxt.config`
   * */
  client?: GqlClients
}

/**
 * `useGqlToken` adds an Authorization header to every request.
 *
 * @param {string} token
 * @param {object} opts
 * */
export const useGqlToken = (token: string, opts?: GqlTokenOptions) => {
  if (!token) return

  let { client, config } = opts || {}

  client = getClient(client)

  config = { ...DEFAULT_AUTH, ...config }

  useGqlState({
    options: {
      [client]: {
        headers: { [config.name]: `${config.type} ${token}` },
      },
    },
  })
}

interface GqlCors {
  mode?: RequestMode
  credentials: RequestCredentials

  /**
   * The name of your GraphQL client.
   * @note defined in `nuxt.config`
   * */
  client?: GqlClients
}

/**
 * `useGqlCors` adds CORS headers to every request.
 *
 * @param {object} opts
 * */
export const useGqlCors = ({ mode, credentials, client }: GqlCors) => {
  client = getClient(client)

  const corsOptions = {
    ...(mode && { mode }),
    ...(credentials && { credentials }),
  }

  useGqlState({ options: { [client]: corsOptions } })
}

/**
 * @param {string} client
 *
 * @note `client` should match the name of the GraphQL client used for the operation being executed.
 * */
export const useGql = (client?: GqlClients): ReturnType<typeof gqlSdk> => {
  const state = useGqlState()

  const gqlClient = useGqlClient(client)

  if (process.server && state.value?.proxyCookies) {
    const { cookie } = useRequestHeaders(['cookie'])

    if (cookie) gqlClient.setHeader('cookie', cookie)
  }

  const $gql: ReturnType<typeof gqlSdk> = gqlSdk(gqlClient)

  return { ...$gql }
}
