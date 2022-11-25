import { defu } from 'defu'
import { hash } from 'ohash'
import { reactive } from 'vue'
import type { Ref } from 'vue'
import type { AsyncData } from 'nuxt/dist/app/composables'
import type { ClientError } from 'graphql-request'
import type { GqlState, GqlConfig, GqlError, TokenOpts, OnGqlError, GqlStateOpts } from '../../types'
// @ts-ignore
import { GqlSdks, GqClientOps } from '#gql'
import type { GqlOps, GqlClients, GqlSdkFuncs } from '#gql'
import { useState, useCookie, useNuxtApp, useAsyncData, useRuntimeConfig } from '#imports'

const getGqlClient = (client?: GqlClients, state?: Ref<GqlState>): GqlClients => {
  if (!state) { state = useGqlState() }

  return client || (state.value?.default ? 'default' : Object.keys(state.value)[0]) as GqlClients
}

const useGqlState = (): Ref<GqlState> => {
  const nuxtApp = useNuxtApp() as Partial<{ _gqlState: Ref<GqlState> }>

  if (!nuxtApp._gqlState) { throw new Error('GQL State is not available.') }

  return nuxtApp?._gqlState
}

/**
 *
 * @param {object} options Changes to be made to gqlState
 *
 * */
// The decision was made to avert using `GraphQLClient's` `setHeader(s)` helper in favor of reactivity and more granular control.
const setGqlState = ({ client, patch }: {client?: GqlClients, patch: GqlStateOpts['options']}) => {
  const state = useGqlState()

  client = getGqlClient(client, state)

  const resetToken = patch?.token && !patch.token.value
  const resetHeaders = patch?.headers && !Object.keys(patch.headers).length

  state.value[client].options = defu(patch, {
    ...state.value[client]?.options,
    ...(resetToken && { token: undefined }),
    ...(resetHeaders && { headers: undefined })
  })
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
 * useGqlHeaders({'X-Custom-Header': 'Custom Value'}, 'my-client')
 * ```
 *
 * - Reset headers for a specific client
 * ```ts
 * useGqlHeaders(null, 'my-client')
 * ```
 * */
export function useGqlHeaders (headers: Record<string, string>, client?: GqlClients): void
export function useGqlHeaders (opts :{headers: Record<string, string>, client?: GqlClients, respectDefaults?: boolean}): void
export function useGqlHeaders (...args: any[]) {
  const client = args[1] || args?.[0]?.client
  let headers = (args[0] && typeof args[0] !== 'undefined' && 'headers' in args[0]) ? args[0].headers : args[0]
  const respectDefaults = args?.[0]?.respectDefaults

  headers = headers || {}

  setGqlState({ client, patch: { headers } })

  if (respectDefaults && !Object.keys(headers).length) {
    const defaultHeaders = (useRuntimeConfig()?.public?.['graphql-client'] as GqlConfig)?.clients?.[client || 'default']?.headers

    const serverHeaders = (process.server && (typeof defaultHeaders?.serverOnly === 'object' && defaultHeaders?.serverOnly)) || undefined
    if (defaultHeaders?.serverOnly) { delete defaultHeaders.serverOnly }

    headers = { ...(defaultHeaders as Record<string, string>), ...serverHeaders }

    setGqlState({ client, patch: { headers } })
  }
}

type GqlTokenOptions = {
  /**
   * Configure the auth token
   *
   * @default
   * `{ type: 'Bearer', name: 'Authorization' }`
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization
   * */
  config?: Omit<TokenOpts, 'value'>

  /**
   * The name of your GraphQL clients.
   * @note defined in `nuxt.config`
   * */
  client?: GqlClients
}

type GqlToken = string | null

/**
 * `useGqlToken` adds an Authorization header to every request.
 *
 * @param {GqlToken} token The token to be used for authentication
 * @param {object} opts Options for the auth token
 * */
export function useGqlToken (token: GqlToken, opts?: GqlTokenOptions): void
/**
 * `useGqlToken` adds an Authorization header to every request.
 *
 * @param {object} opts Options for the auth token
 * */
export function useGqlToken (opts: GqlTokenOptions & {token: GqlToken}): void
export function useGqlToken (...args: any[]) {
  args = args || []

  const config: TokenOpts = args[0]?.config || args?.[1]?.config
  let client: GqlClients = args[0]?.client || args?.[1]?.client
  let token: string = typeof args[0] === 'string' || args?.[0] === null ? args[0] : args?.[0]?.token
  if (token) { token = token.trim() }

  client = getGqlClient(client)

  const tokenStorage = (useRuntimeConfig()?.public?.['graphql-client'] as GqlConfig)?.clients?.[client]?.tokenStorage

  if (token !== undefined && typeof tokenStorage === 'object') {
    if (tokenStorage.mode === 'cookie') {
      const cookie = useCookie(tokenStorage.name!, tokenStorage.cookieOptions)

      cookie.value = token
    }

    if (process.client && tokenStorage.mode === 'localStorage') {
      if (token !== null) {
        localStorage.setItem(tokenStorage.name!, token)
      } else {
        localStorage.removeItem(tokenStorage.name!)
      }
    }
  }

  setGqlState({ client, patch: { token: { ...config, value: token } } })
}

interface GqlCors {
  mode?: RequestMode
  credentials?: RequestCredentials

  /**
   * The name of your GraphQL client.
   * @note defined in `nuxt.config`
   * */
  client?: GqlClients
}

/**
 * `useGqlCors` adds CORS headers to every request.
 *
 * @param {object} opts Options for the CORS headers
 * */
export const useGqlCors = (opts: GqlCors) => {
  const { mode, credentials, client } = opts || {}

  setGqlState({ client, patch: { mode, credentials } })
}

/**
 * `useGqlHost` allows you to change a client's host at runtime.
 *
 * @param {string} host The host to be used for subsequent requests
 * @param {string} client The name of your GraphQL client. Defaults to either the client named `default` or the first configured client.
 */
export const useGqlHost = (host: string, client?: GqlClients) => {
  const state = useGqlState()

  client = getGqlClient(client, state)

  if (!host.match(/^https?:\/\//)) {
    const initialHost = (useRuntimeConfig()?.public?.['graphql-client'] as GqlConfig)?.clients?.[client]?.host

    if (initialHost?.endsWith('/') && host.startsWith('/')) { host = host.slice(1) }

    host = `${initialHost}${host}`
  }

  return state.value?.[client].instance!.setEndpoint(host)
}

export const useGql = (): (<
  T extends GqlOps,
  R extends ReturnType<GqlSdkFuncs[T]>,
  P extends Parameters<GqlSdkFuncs[T]>['0'],
  > (args: { operation: T, variables?: P }) => R) &
  (<
    T extends GqlOps,
    R extends ReturnType<GqlSdkFuncs[T]>,
    P extends Parameters<GqlSdkFuncs[T]>['0'],
    > (operation: T, variables?: P) => R) => {
  const state = useGqlState()
  const errState = useGqlErrorState()

  return (...args: any[]) => {
    const operation = (typeof args?.[0] !== 'string' && 'operation' in args?.[0] ? args[0].operation : args[0]) ?? undefined
    const variables = (typeof args?.[0] !== 'string' && 'variables' in args?.[0] ? args[0].variables : args[1]) ?? undefined

    const client = Object.keys(GqClientOps).find(k => GqClientOps[k as keyof typeof GqClientOps].includes(operation)) ?? 'default'

    const { instance } = state!.value?.[client]

    if (!instance) { throw new Error('Invalid GraphQL Operation') }

    return GqlSdks[client as keyof typeof GqlSdks]!(instance, async (action, operationName, operationType): Promise<any> => {
      try {
        return await action()
      } catch (err: ClientError | any) {
        errState.value = {
          client,
          operationType,
          operationName,
          statusCode: err?.response?.status,
          gqlErrors: err?.response?.errors || (err?.response?.message && [{ message: err?.response?.message }]) || []
        }

        if (state.value.onError) {
          state.value.onError(errState.value)
        }

        throw errState.value
      }
    })[operation as GqlOps](variables) as any
  }
}

/**
 * `useGqlError` captures GraphQL Errors.
 *
 * @param {OnGqlError} onError Gql error handler
 *
 * @example <caption>Log error to console.</caption>
 * ```ts
 * useGqlError((err) => {
 *    console.error(err)
 * })
 * ```
 * */
export const useGqlError = (onError: OnGqlError) => {
  // proactive measure to prevent context reliant calls
  useGqlState().value.onError = process.client
    ? onError
    : (process.env.NODE_ENV !== 'production' && (e => console.error('[nuxt-graphql-client] [GraphQL error]', e))) || undefined

  const errState = useGqlErrorState()

  if (!errState.value) { return }

  onError(errState.value)
}

const useGqlErrorState = () => useState<GqlError | null>('_gqlErrors', () => null)

/**
 * Asynchronously query data that is required to load a page or component.
 *
 * @param {Object} options
 * @param {string} options.operation Name of the query to be executed.
 * @param {string} options.variables Variables to be passed to the query.
 * @param {Object} options.options AsyncData options.
 */
export function useAsyncGql<
T extends GqlOps,
p extends Parameters<GqlSdkFuncs[T]>['0'],
P extends { [K in keyof p]: Ref<p[K]> | p[K] },
R extends AsyncData<Awaited<ReturnType<GqlSdkFuncs[T]>>, GqlError>,
O extends Parameters<typeof useAsyncData>['2']> (options: { operation: T, variables?: P, options?: O }): Promise<R>

/**
 * Asynchronously query data that is required to load a page or component.
 *
 * @param {string} operation Name of the query to be executed.
 * @param {string} variables Variables to be passed to the query.
 * @param {Object} options AsyncData options.
 */
export function useAsyncGql<
T extends GqlOps,
p extends Parameters<GqlSdkFuncs[T]>['0'],
P extends { [K in keyof p]: Ref<p[K]> | p[K] },
R extends AsyncData<Awaited<ReturnType<GqlSdkFuncs[T]>>, GqlError>,
O extends Parameters<typeof useAsyncData>['2']> (operation: T, variables?: P, options?: O): Promise<R>

export function useAsyncGql (...args: any[]) {
  const operation = (typeof args?.[0] !== 'string' && 'operation' in args?.[0] ? args[0].operation : args[0]) ?? undefined
  const variables = (typeof args?.[0] !== 'string' && 'variables' in args?.[0] ? reactive(args[0].variables) : reactive(args[1])) ?? undefined
  const options = (typeof args?.[0] !== 'string' && 'options' in args?.[0] ? args[0].options : args[2]) ?? {}
  if (variables) {
    options.watch = options.watch || []
    options.watch.push(variables)
  }
  const key = hash({ operation, variables })
  // @ts-ignore
  return useAsyncData(key, () => useGql()(operation, variables), options)
}
