import { promises as fsp } from 'fs'
import { parse } from 'graphql'
import type { GqlContext } from './context'

export async function prepareOperations (ctx: GqlContext, path: string[]) {
  const clients = Object.keys(ctx.clientOps)

  const scanFile = async (file: string) => {
    let clientToUse: string | undefined

    const reExt = new RegExp(`\\.(${clients.join('|')})\\.(gql|graphql)$`)
    if (reExt.test(file)) { clientToUse = reExt.exec(file)?.[1] }

    const fileName = file.split('/').pop().replace(/\./g, '\\.')
    const reDir = new RegExp(`\\/(${clients.join('|')})\\/(?=${fileName})`)

    if (!clientToUse && reDir.test(file)) { clientToUse = reDir.exec(file)?.[1] }

    const { definitions } = parse(await fsp.readFile(file, 'utf8'))

    // @ts-ignore
    const operations: string[] = definitions.map(({ name }) => name.value)

    for (const op of operations) {
      const clientName = op?.match(/^([^_]*)/)?.[0]

      if (!clientName || !ctx.clientOps?.[clientName]) {
        if (clientToUse) { ctx.clientOps[clientToUse].push(op) }

        continue
      }

      ctx.clientOps[clientName].push(op.replace(`${clientName}_`, ''))
    }
  }

  for (const file of path) {
    await scanFile(file)
  }
}

export function prepareTemplate (ctx: GqlContext) {
  for (const [client, ops] of Object.entries(ctx.clientOps)) {
    if (!ops?.length) { continue }

    for (const op of ops) {
      const originalName = `${client}_${op}`
      const originalNameRe = new RegExp(originalName, 'g')

      const toPSCase = (s: string) =>
        s
          .split('_')
          .map(s => s.charAt(0).toUpperCase() + s.slice(1))
          .join('_')

      const secondCase = toPSCase(originalName)
      const secondCaseRe = new RegExp(secondCase, 'g')
      const secondResult = toPSCase(op)

      ctx.template = ctx.template
        .replace(originalNameRe, op)
        .replace(secondCaseRe, secondResult)
    }
  }
}
