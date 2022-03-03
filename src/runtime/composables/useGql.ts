import { GraphQLClient } from 'graphql-request'
import { useRuntimeConfig, useRequestHeaders } from '#app'
import { gqlSdk } from '#imports'

export const useGql = () => {
  const { GQL_HOST } = useRuntimeConfig()

  const headers: HeadersInit = {}

  if (process.server) {
    headers.cookie = useRequestHeaders(['cookie'])?.cookie || ''
  }

  const client = new GraphQLClient(GQL_HOST, { headers })

  const $gql: ReturnType<typeof gqlSdk> = gqlSdk(client)

  return { ...$gql }
}
