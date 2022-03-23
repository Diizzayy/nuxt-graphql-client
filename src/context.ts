import { promises as fsp } from 'fs'
import { parse } from 'graphql'
import type { Import } from 'unimport'

export interface GqlContext {
  template?: string
  fns?: string[]
  clients?: string[]
  fnImports?: Import[]
  generateImports?: () => string
  generateDeclarations?: () => string
  clientOps?: Record<string, string[]> | null
}

export function prepareContext (ctx: GqlContext, prefix: string) {
  ctx.fns = ctx.template?.match(/\w+\s*(?=\(variables)/g)?.sort() || []

  const fnName = (fn: string) =>
    prefix + fn.charAt(0).toUpperCase() + fn.slice(1)

  const fnExp = (fn: string, typed = false) => {
    const name = fnName(fn)

    if (!typed) {
      const client = ctx?.clients.find(c => ctx?.clientOps?.[c]?.includes(fn))

      if (!client) { return `export const ${name} = (...params) => useGql()['${fn}'](...params)` } else { return `export const ${name} = (...params) => useGql('${client}')['${fn}'](...params)` }
    }

    return `  export const ${name}: (...params: Parameters<GqlFunc['${fn}']>) => ReturnType<GqlFunc['${fn}']>`
  }

  ctx.generateImports = () => {
    return [
      'import { useGql } from \'#imports\'',
      ...ctx.fns.map(f => fnExp(f))
    ].join('\n')
  }

  ctx.generateDeclarations = () => {
    return [
      'declare module \'#build/gql\' {',
      `  type GqlClients = '${ctx.clients.join("' | '")}'`,
      '  type GqlFunc = ReturnType<typeof import(\'#imports\')[\'useGql\']>',
      ...ctx.fns.map(f => fnExp(f, true)),
      '}'
    ].join('\n')
  }

  ctx.fnImports = ctx.fns.map((fn) => {
    const name = fnName(fn)

    return {
      name,
      as: name,
      from: '#build/gql'
    }
  })
}

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

  for (const file of path) { await scanFile(file) }
}

export function prepareTemplate (ctx: GqlContext) {
  for (const [client, ops] of Object.entries(ctx.clientOps)) {
    if (!ops?.length) { continue }

    for (const op of ops) {
      const originalName = `${client}_${op}`
      const originalNameRe = new RegExp(originalName, 'g')

      const toPSCase = (s: string) => s
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
