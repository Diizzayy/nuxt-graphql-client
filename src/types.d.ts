import type { GqlClient as GQLClient, GraphQLError, GqlOperation } from 'ogql'
import type { CookieOptions } from 'nuxt/dist/app/composables'

type TokenOpts = {
  /**
   * The name of the Authentication token header.
   *
   * @default 'Authorization'
   * */
  name?: string;

  /**
   * The HTTP Authentication scheme.
   *
   * @default "Bearer"
   * */
  type?: string | null;

  value?: string;
}

type TokenStorageOpts = {
  /**
   * Specify the name under which the token will be stored.
   * as in either a cookie or localStorage.
   * @type {string}
   * @default "gql:<client-name>"
   */
  name?: string;

  /**
   * Specify if the auth token should be stored in `cookie` or `localStorage`.
   * `Cookie` storage is required for SSR.
   * @type {string}
   * @default "cookie"
   **/
  mode?: 'cookie' | 'localStorage';

  cookieOptions?: Omit< CookieOptions, 'encode' | 'decode' | 'expires' | 'default'>;
}

export interface GqlClient<T = string> {
  host: string

  /**
   * Specify a host to be used for client side requests.
   *
   * @type string
   * */
  clientHost?: string

  /**
   * Specify a host to be used for introspection.
   *
   * @type string
   */
  introspectionHost?: string

  /**
   * Specify the path to a GraphQL Schema file to be used for code generation. When omitted, the `host` will be used.
   *
   * @type string
   * */
  schema?: string

  token?: T extends object ? TokenOpts : string | TokenOpts

  /**
   * Configuration for the token storage
   * */
  tokenStorage?: T extends object ? TokenStorageOpts : boolean | TokenStorageOpts

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
   * Headers to be passed from the browser to the GraphQL API in SSR mode.
   *
   * @type {string[]}
   */
  proxyHeaders?: string[]

  /**
   * Specify CORS options to be used for client-side requests.
   * @type {object}
   * */
  corsOptions?: {
    mode?: RequestMode
    credentials?: RequestCredentials
  }

  /**
   * Specify additional headers to be passed to the GraphQL client.
   * */
  headers?: Record<string, string> | {
    /**
     * Declare headers that should only be applied on server side.
     * */
    serverOnly?: Record<string, string>
  }

  /**
   * When enabled, queries will be sent as GET requests instead of POST requests.
   *
   * @type boolean
   * @default false
   * */
  preferGETQueries?: boolean

  /**
   * Declare headers that should only be applied to the GraphQL Code Generator.
   * */
  codegenHeaders?: Record<string, string>
}

export interface GqlCodegen {
  /**
   * Disable Code Generation for production builds.
   *
   * @type boolean
   * @default false
   */
  disableOnBuild?: boolean

  /**
   * Prevent codegen from printing to console in dev mode
   *
   * @type boolean
   * @default true
   */
  silent?: boolean

  /**
   * Prevent adding `__typename` to generated types.
   *
   * @type boolean
   * @default true
   */
  skipTypename?: boolean

  /**
   * Use `import type {}` rather than `import {}` when importing only types.
   *
   * @type boolean
   * @default true
   * */
  useTypeImports?: boolean

  /**
   * Removes fragment duplicates. It is done by removing sub-fragments
   * imports from fragment definition Instead - all of them are imported to the Operation node.
   *
   * @type boolean
   * @default true
   */
  dedupeFragments?: boolean

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
   * Avoid using TypeScript optionals on generated types.
   */
  avoidOptionals?: boolean | {
    field?: boolean
    inputValue?: boolean
    object?: boolean
    defaultValue?: boolean
  }

  /**
   * Allow to override the type value of Maybe.
   (https://the-guild.dev/graphql/codegen/plugins/typescript/typescript-operations#maybevalue)
   */
  maybeValue?: string
}

export interface GqlConfig<T = GqlClient> {
  /**
   * Configuration for the GraphQL Code Generator, setting this option to `false` results in limited TypeScript support.
   */
  codegen?: boolean | GqlCodegen

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
   * Allows generating multiple clients with different GraphQL hosts.
   *
   * @note this option overrides the `GQL_HOST` in `runtimeConfig`.
   * */
  clients?: Record<string, T extends GqlClient ? GqlClient<T> : string | GqlClient<T>>

  /**
   * When enabled, queries will be sent as GET requests instead of POST requests.
   *
   * @type boolean
   * @default false
   * */
  preferGETQueries?: boolean

  /**
   * Configuration for the token storage
   * */
  tokenStorage?: boolean | TokenStorageOpts
}

export type GqlError = {
  client?: string
  statusCode?: number
  operation?: GqlOperation
  gqlErrors: GraphQLError[]
}

export type OnGqlError = <T>(error: GqlError) => Promise<T> | any

type GqlStateOpts = {instance?: GQLClient, options?: { token?: TokenOpts } & Pick<RequestInit, 'headers' | 'mode' | 'credentials'> }
export type GqlState = Record<string, GqlStateOpts> & { onError?: OnGqlError }
