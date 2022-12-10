import { GqlClient } from 'ogql'
import type { GqlConfig } from '../types'
// @ts-ignore
import { defineNitroPlugin } from '#internal/nitro'
// @ts-ignore
import GqlNitro from '#gql-nitro'

export default defineNitroPlugin(() => {
  const GqlConfig: GqlConfig['clients'] = GqlNitro!.config

  for (const [client, conf] of Object.entries(GqlConfig!)) {
    const serverHeaders = (typeof conf?.headers?.serverOnly === 'object' && conf?.headers?.serverOnly) || undefined
    if (conf?.headers?.serverOnly) { delete conf.headers.serverOnly }

    const tokenName = conf!.token!.name!
    const tokenType = conf.token!.type!
    const authToken = !tokenType ? conf?.token?.value : `${tokenType} ${conf?.token?.value}`

    const headers = {
      ...conf?.headers,
      ...serverHeaders,
      ...(conf?.token?.value && { [tokenName]: authToken })
    }

    GqlNitro.clients[client] = GqlClient({ host: conf.host, headers })
  }
})
