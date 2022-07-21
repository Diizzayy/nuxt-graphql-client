import type { Ref } from 'vue'
import type { GqlClients } from '#build/gql'
import { getSdk as gqlSdk } from '#build/gql-sdk'
import { useState, useNuxtApp, useRuntimeConfig } from '#imports'
import type { GqlState, GqlConfig, GqlError, OnGqlError } from '../../types'
import { deepmerge } from '../utils'

const useGqlState = (): Ref<GqlState> => {
  const nuxtApp = useNuxtApp() as Partial<{ _gqlState: Ref<GqlState> }>

  return nuxtApp?._gqlState
}

/**
 *
 * @param {object} options Changes to be made to gqlState
 *
 * */
// The decision was made to avert using `GraphQLClient's` `setHeader(s)` helper in favor of reactivity and more granular control.
const setGqlState = ({ client = 'default', patch }: {client: GqlClients, patch: RequestInit}) => {
  const state = useGqlState()

  const reset = !Object.keys(patch).length
  const partial = !reset && Object.keys(patch).some(key => typeof patch[key] !== 'object'
    ? !patch[key]
    : (!Object.keys(patch[key]).length || Object.keys(patch[key]).some(subKey => !patch[key][subKey])))

  if (reset) {
    state.value[client].options = {}
  } else if (partial) {
    for (const key in patch) {
      if (typeof patch[key] !== 'object') {
        if (patch[key]) {
          state.value[client].options[key] = patch[key]
        } else if (key in state.value[client].options) {
          delete state.value[client].options[key]
        }

        continue
      }

      if (!Object.keys(patch[key]).length && key in state.value[client].options) {
        delete state.value[client].options[key]
        continue
      }

      for (const subKey in patch[key]) {
        if (patch[key][subKey]) {
          state.value[client].options[key][subKey] = patch[key][subKey]
        } else if (typeof state.value[client].options?.[key] === 'object' && subKey in state.value[client].options?.[key]) {
          delete state.value[client].options[key][subKey]
        }
      }
    }
  } else {
    state.value[client].options = deepmerge(state.value[client].options, patch)
  }

  // @ts-ignore
  state.value[client].instance.options = state.value[client].options
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
    setGqlState({ client, patch: { headers: defaultHeaders } })
  }
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

const DEFAULT_AUTH: GqlTokenConfig = { type: 'Bearer', name: 'Authorization' }

type GqlTokenOptions = {
  /**
   * Configure the auth token
   *
   * @default
   * `{ type: 'Bearer', name: 'Authorization' }`
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
 * @param {string} token The token to be used for authentication
 * @param {object} opts Options for the auth token
 * */
export function useGqlToken (token: string, opts?: GqlTokenOptions): void
/**
 * `useGqlToken` adds an Authorization header to every request.
 *
 * @param {object} opts Options for the auth token
 * */
export function useGqlToken (opts: GqlTokenOptions & {token: string}): void
export function useGqlToken (...args: any[]) {
  args = args || []

  const token = typeof args[0] === 'string' ? args[0] : args?.[0]?.token
  const client = args[0]?.client || args?.[1]?.client
  let config = args[0]?.config || args?.[1]?.config

  const clientConfig = (useRuntimeConfig()?.public?.['graphql-client'] as GqlConfig)?.clients?.[client || 'default']

  config = {
    ...DEFAULT_AUTH,
    ...(clientConfig?.token?.name && { name: clientConfig.token.name }),
    ...(clientConfig?.token?.type !== undefined && { type: clientConfig.token.type }),
    ...config
  }

  setGqlState({
    client,
    patch: { headers: { [config.name]: !token ? undefined : `${config.type} ${token}`.trim() } }
  })
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
 * @param {object} cors Options for the CORS headers
 * */
export const useGqlCors = (cors: GqlCors) => {
  const { mode, credentials, client } = cors || {}

  setGqlState({ client, patch: { mode, credentials } })
}

export const useGql = () => {
  const state = useGqlState()
  const errState = useGqlErrorState()

  const handle = (client?: GqlClients) => {
    client = client || 'default'
    const { instance } = state.value?.[client]

    const $gql: ReturnType<typeof gqlSdk> = gqlSdk(instance, async (action, operationName, operationType): Promise<any> => {
      try {
        return await action()
      } catch (err) {
        errState.value = {
          client,
          operationType,
          operationName,
          statusCode: err?.response?.status,
          gqlErrors: err?.response?.errors
        }

        if (state.value.onError) {
          state.value.onError(errState.value)
        }

        throw errState.value
      }
    })

    return { ...$gql }
  }

  return { handle }
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
    : process.env.NODE_ENV !== 'production' && (e => console.error('[nuxt-graphql-client] [GraphQL error]', e))

  const errState = useGqlErrorState()

  if (!errState.value) { return }

  onError(errState.value)
}

const useGqlErrorState = () => useState<GqlError>('_gqlErrors', () => null)
