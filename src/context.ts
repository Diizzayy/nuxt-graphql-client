import { promises as fsp } from 'fs'
import { parse } from 'graphql'
import { upperFirst } from 'scule'
import type { Import } from 'unimport'
import { genExport } from 'knitwork'

export interface GqlContext {
  codegen?: boolean
  template?: Record<string, string>
  fns?: string[]
  clients?: string[]
  fnImports?: Import[]
  generateImports?: () => string
  generateDeclarations?: () => string
  clientOps?: Record<string, string[]> | null
  clientTypes?: Record<string, string[]>
}

export function prepareContext (ctx: GqlContext, prefix: string) {
  ctx.fns = Object.values(ctx.template).reduce((acc, template) => {
    const fns = template.match(ctx?.codegen ? /\w+\s*(?=\(variables)/g : /\w+(?=:\s\(variables)/g)?.sort() || []

    return [...acc, ...fns]
  }, [] as string[])

  const fnName = (fn: string) => prefix + upperFirst(fn)

  const fnExp = (fn: string, typed = false) => {
    const name = fnName(fn)

    if (!typed) { return `export const ${name} = (...params) => useGql()('${fn}', ...params)` }

    return `  export const ${name}: (...params: Parameters<GqlSdkFuncs['${fn}']>) => ReturnType<GqlSdkFuncs['${fn}']>`
  }

  ctx.generateImports = () => [
    'import { useGql } from \'#imports\'',
    ...ctx.clients.map(client => `import { getSdk as ${client}GqlSdk } from '#gql/${client}'`),
    'export const GqlSdks = {',
    ...ctx.clients.map(client => `  ${client}: ${client}GqlSdk,`),
    '}',
    `export const GqClientOps = ${JSON.stringify(ctx.clientOps)}`,
    ...ctx.fns.map(f => fnExp(f))
  ].join('\n')

  ctx.generateDeclarations = () => [
    ...(!ctx.codegen
      ? []
      : ctx.clients.map(client => `import { getSdk as ${client}GqlSdk } from '#gql/${client}'`)),
    ...Object.entries(ctx.clientTypes || {}).map(([k, v]) => genExport(`#gql/${k}`, v)),
    'declare module \'#gql\' {',
      `  type GqlClients = '${ctx.clients.join("' | '") || 'default'}'`,
      `  type GqlOps = '${Object.values(ctx.clientOps).flat().join("' | '")}'`,
      '  const GqClientOps = {}',
      ...(!ctx.codegen
        ? []
        : [
            '  const GqlSdks = {',
            ...ctx.clients.map(client => `    ${client}: ${client}GqlSdk,`),
            '  }',
            ...ctx.fns.map(f => fnExp(f, true)),
            `  type GqlSdkFuncs = ${ctx.clients.map(c => `ReturnType<typeof ${c}GqlSdk>`).join(' & ')}`
          ]),
      '}'
  ].join('\n')

  ctx.fnImports = ctx.fns.map((fn): Import => ({ from: '#gql', name: fnName(fn) }))
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
      clientToUse = new RegExp(`^(${ctx.clients.join('|')})(?=\\_)`).exec(op)?.[0] || clientToUse

      if (!clientToUse || !ctx.clientOps?.[clientToUse]) {
        clientToUse = clientToUse || ctx.clients.find(c => c === 'default') || ctx.clients[0]
      }

      if (!ctx.clientOps?.[clientToUse]?.includes(op)) {
        ctx.clientOps[clientToUse].push(op)
      }
    }
  }

  for (const file of path) { await scanFile(file) }
}

export function prepareTemplate (ctx: GqlContext) {
  if (!ctx.codegen) { return }

  ctx.clientTypes = ctx.clientTypes || {}

  ctx.clientTypes = Object.entries(ctx.template).reduce((acc, [key, template]) => {
    acc[key] = template.match(/^export\stype\s\w+(?=\s=\s)/gm)
      .filter(e => !['Scalars', 'SdkFunctionWrapper', 'Sdk'].some(f => e.includes(f)))
      .map(e => e.replace('export type ', ''))

    return acc
  }, {} as Record<string, string[]>)
}

export const mockTemplate = (operations: Record<string, string>) => {
  const GqlFunctions: string[] = []

  for (const [k, v] of Object.entries(operations)) {
    GqlFunctions.push(`    ${k}: (variables = undefined, requestHeaders = undefined) => withWrapper((wrappedRequestHeaders) => client.request(\`${v}\`, variables, {...requestHeaders, ...wrappedRequestHeaders}), '${k}', 'query')`)
  }

  return [
    'export function getSdk(client, withWrapper = (action, _operationName, _operationType) => action()) {',
    '  return {',
    GqlFunctions.join(',\n'),
    '  }',
    '}'
  ].join('\n')
}
