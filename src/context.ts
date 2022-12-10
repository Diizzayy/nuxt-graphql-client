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
  clientOps?: Record<string, string[]>
  clientDocs?: Record<string, string[]>
  clientTypes?: Record<string, string[]>
}

export async function prepareContext (ctx: GqlContext, prefix: string) {
  if (ctx.clientDocs) { await prepareOperations(ctx) }

  if (ctx.template) { prepareTemplate(ctx) }

  ctx.fns = Object.values(ctx.template || {}).reduce((acc, template) => {
    const fns = template.match(!ctx?.codegen ? /\w+(?=:\s\(variables)/g : /\w+(?=:\s<T\sextends\s\w+(Query|Mutation|Subscription))/g)?.sort() || []

    return [...acc, ...fns]
  }, [] as string[])

  const fnName = (fn: string) => prefix + upperFirst(fn)

  const fnExp = (fn: string, typed = false) => {
    const name = fnName(fn)

    if (!typed) { return `export const ${name} = (...params) => useGql()('${fn}', ...params)` }

    return `  export const ${name}: (...params: Parameters<GqlSdkFuncs['${fn}']>) => ReturnType<GqlSdkFuncs['${fn}']>`
  }

  ctx.clients = ctx.clients?.filter(c => ctx.clientDocs?.[c]?.length)

  ctx.generateImports = () => [
    'import { useGql } from \'#imports\'',
    ...ctx.clients.map(client => `import { gqlSdk as ${client}GqlSdk } from '#gql/${client}'`),
    'export const GqlSdks = {',
    ...ctx.clients!.map(client => `  ${client}: ${client}GqlSdk,`),
    '}',
    `export const GqClientOps = ${JSON.stringify(ctx.clientOps)}`,
    ...ctx.fns!.map(f => fnExp(f))
  ].join('\n')

  ctx.generateDeclarations = () => [
    ...(!ctx.codegen
      ? []
      : ctx.clients.map(client => `import { gqlSdk as ${client}GqlSdk } from '#gql/${client}'`)),
    ...Object.entries(ctx.clientTypes || {}).map(([k, v]) => genExport(`#gql/${k}`, v)),
    'declare module \'#gql\' {',
      `  type GqlClients = '${ctx.clients?.join("' | '") || 'default'}'`,
      `  type GqlOps = '${Object.values(ctx.clientOps!).flat().join("' | '")}'`,
      `  const GqClientOps = ${JSON.stringify(ctx.clientOps)}`,
      ...(!ctx.codegen
        ? []
        : [
            '  const GqlSdks = {',
            ...ctx.clients!.map(client => `    ${client}: ${client}GqlSdk,`),
            '  }',
            ...ctx.fns!.map(f => fnExp(f, true)),
            `  type GqlSdkFuncs = ${ctx.clients?.map(c => `ReturnType<typeof ${c}GqlSdk>`).join(' & ') || 'any'}`
          ]),
      '}'
  ].join('\n')

  ctx.fnImports = ctx.fns.map((fn): Import => ({ from: '#gql', name: fnName(fn) }))
}

async function prepareOperations (ctx: GqlContext) {
  const scanDoc = async (doc: string, client: string) => {
    const { definitions } = parse(await fsp.readFile(doc, 'utf8'))

    // @ts-ignore
    const operations: string[] = definitions.map(({ name }) => {
      if (!name?.value) { throw new Error(`Operation name missing in: ${doc}`) }

      return name.value
    })

    for (const op of operations) {
      if (ctx.clientOps?.[client]?.includes(op)) { continue }

      ctx.clientOps?.[client].push(op)
    }
  }

  for await (const [client, docs] of Object.entries(ctx?.clientDocs || {})) {
    for await (const doc of docs) {
      await scanDoc(doc, client)
    }
  }
}

function prepareTemplate (ctx: GqlContext) {
  if (!ctx.codegen) { return }

  ctx.clientTypes ||= {}

  ctx.clientTypes = Object.entries(ctx.template || {}).reduce((acc, [key, template]) => {
    const results = template.match(/^export\stype\s\w+(?=\s=\s)/gm)
      ?.filter(e => !['Scalars', 'SdkFunctionWrapper', 'Sdk'].some(f => e.includes(f)))
      .map(e => e.replace('export type ', ''))

    if (!results) { return acc }

    return { ...acc, [key]: results }
  }, {} as Record<string, string[]>)
}
