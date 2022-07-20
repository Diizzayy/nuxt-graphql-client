import type { GraphQLClient } from 'graphql-request'
import type { GraphQLError, PatchedRequestInit } from 'graphql-request/dist/types'

type TokenOpts = { name?: string, value?: string, type?: string}

export interface GqlClient<T = string> {
  host: string

  /**
   * Specify a host to be used for client side requests.
   *
   * @type string
   * */
  clientHost?: string

  /**
   * Specify the path to a GraphQL Schema file to be used for code generation. When omitted, the `host` will be used.
   *
   * @type string
   * */
  schema?: string

  token?: T extends object ? TokenOpts : string | TokenOpts

  /**
   * When enabled, this flag will force tokens set at config-level to be retained client-side.
   * By default, tokens set by `runtimeConfig` or `environment variables` only live server-side (for Code Generation & SSR requests).
   *
   * @type boolean
   * @default false
   * */
  retainToken?: boolean

  /**
   * Pass cookies from the browser to the GraphQL API in SSR mode.
   *
   * @type boolean
   * @default true
   * */
  proxyCookies?: boolean

  /**
   * Specify additional headers to be passed to the GraphQL client.
   * */
  headers?: Record<string, string>
}

export interface GqlConfig<T = GqlClient> {
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

  /**
   * Allows generating multiple clients with different GraphQL hosts.
   *
   * @note this option overrides the `GQL_HOST` in `runtimeConfig`.
   * */
  clients?: Record<string, T extends GqlClient ? Partial<GqlClient<T>> : string | GqlClient<T>>
}

export type GqlError = {
  client: string
  operationName: string
  operationType: string
  statusCode?: number
  gqlErrors?: GraphQLError[]
}

export type OnGqlError = <T>(error: GqlError) => Promise<T> | any

type GqlStateOpts = {instance?: GraphQLClient, options?: PatchedRequestInit}
export type GqlState = Record<string, GqlStateOpts> & { onError?: OnGqlError }
