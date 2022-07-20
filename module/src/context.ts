import { promises as fsp } from 'fs'
import { parse } from 'graphql'
import { upperFirst } from 'scule'
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

  const fnName = (fn: string) => prefix + upperFirst(fn)

  const fnExp = (fn: string, typed = false) => {
    const name = fnName(fn)

    if (!typed) {
      const client = ctx?.clients.find(c => ctx?.clientOps?.[c]?.includes(fn))

      return `export const ${name} = (...params) => GqlInstance().handle(${client ? `'${client}'` : ''})['${fn}'](...params)`
    }

    return `  export const ${name}: (...params: Parameters<GqlFunc['${fn}']>) => ReturnType<GqlFunc['${fn}']>`
  }

  ctx.generateImports = () => [
    'import { useGql } from \'#imports\'',
    'const ctx = { instance: null }',
    'const GqlInstance = () => {',
    ' if (!ctx?.instance) {ctx.instance = useGql()}',
    ' return ctx.instance',
    '}',
    ...ctx.fns.map(f => fnExp(f))
  ].join('\n')

  ctx.generateDeclarations = () => [
    'declare module \'#build/gql\' {',
      `  type GqlClients = '${ctx.clients.join("' | '") || 'default'}'`,
      '  type GqlFunc = ReturnType<ReturnType<typeof import(\'#imports\')[\'useGql\']>[\'handle\']>',
      ...ctx.fns.map(f => fnExp(f, true)),
      '}'
  ].join('\n')

  ctx.fnImports = ctx.fns.map((fn): Import => ({
    name: fnName(fn),
    from: '#build/gql'
  }))
}

export async function prepareOperations (ctx: GqlContext, path: string[]) {
  const scanFile = async (file: string) => {
    let clientToUse: string | undefined

    const reExt = new RegExp(`\\.(${ctx.clients.join('|')})\\.(gql|graphql)$`)
    if (reExt.test(file)) { clientToUse = reExt.exec(file)?.[1] }

    const fileName = file.split('/').pop().replace(/\./g, '\\.')
    const reDir = new RegExp(`\\/(${ctx.clients.join('|')})\\/(?=${fileName})`)

    if (!clientToUse && reDir.test(file)) { clientToUse = reDir.exec(file)?.[1] }

    const { definitions } = parse(await fsp.readFile(file, 'utf8'))

    // @ts-ignore
    const operations: string[] = definitions.map(({ name }) => {
      if (!name?.value) { throw new Error(`Operation name missing in: ${file}`) }

      return name.value
    })

    for (const op of operations) {
      clientToUse = new RegExp(`^(${ctx.clients.join('|')}[^_]*)`).exec(op)?.[0] || clientToUse

      if (!clientToUse || !ctx.clientOps?.[clientToUse]) {
        clientToUse = clientToUse || ctx.clients.find(c => c === 'default') || ctx.clients[0]
      }

      const operationName = op.replace(`${clientToUse}_`, '').replace(op.split('_')[0] + '_', '')

      if (!ctx.clientOps?.[clientToUse]?.includes(operationName)) {
        ctx.clientOps[clientToUse].push(operationName)
      }
    }
  }

  for (const file of path) { await scanFile(file) }
}

export function prepareTemplate (ctx: GqlContext) {
  const toPSCase = (s: string) => s.split('_').map(upperFirst).join('_')

  const oust = (from: string, to: string) => ctx.template
    .replace(new RegExp(from, 'g'), to)
    .replace(new RegExp(toPSCase(from), 'g'), toPSCase(to))

  for (const [client, ops] of Object.entries(ctx.clientOps)) {
    if (!ops?.length) { continue }

    for (const op of ops) {
      const originalName = `${client}_${op}`

      const [basic, special] = [op, originalName].map(n =>
        new RegExp(`\\s${n}\\s*(?=\\(variables)`, 'g').test(ctx.template))

      if (basic) { continue }

      if (special) {
        ctx.template = oust(originalName, op)

        continue
      }

      if (!basic && !special) {
        const reInvalid = new RegExp(`\\w+_(${op})\\s*(?=\\(variables)`)

        if (!reInvalid.test(ctx.template)) { continue }

        const [invalidName, opName] = reInvalid.exec(ctx.template)

        ctx.template = oust(invalidName, opName)

        continue
      }
    }
  }
}
