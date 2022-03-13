import type { AutoImport } from '@nuxt/schema'

export interface GqlContext {
  template?: string
  fns?: string[]
  clients?: string[]
  fnImports?: AutoImport[]
  generateImports?: () => string
  generateDeclarations?: () => string
  clientOps?: Record<string, string[]> | null
}

export function prepareContext(ctx: GqlContext, prefix: string) {
  ctx.fns = ctx.template?.match(/\w+\s*(?=\(variables)/g)?.sort() || []

  const fnName = (fn: string) =>
    prefix + fn.charAt(0).toUpperCase() + fn.slice(1)

  const fnExp = (fn: string, typed = false) => {
    const name = fnName(fn)

    if (!typed) {
      const client = ctx?.clients.find((c) => ctx?.clientOps?.[c]?.includes(fn))

      if (!client)
        return `export const ${name} = (...params) => useGql()['${fn}'](...params)`
      else
        return `export const ${name} = (...params) => useGql('${client}')['${fn}'](...params)`
    }

    return `  export const ${name}: (...params: Parameters<GqlFunc['${fn}']>) => ReturnType<GqlFunc['${fn}']>`
  }

  ctx.generateImports = () => {
    return [
      `import { useGql } from '#imports'`,
      ...ctx.fns.map((f) => fnExp(f)),
    ].join('\n')
  }

  ctx.generateDeclarations = () => {
    return [
      `declare module '#build/gql' {`,
      `  type GqlClients = '${ctx.clients.join("' | '")}'`,
      `  type GqlFunc = ReturnType<typeof import('#imports')['useGql']>`,
      ...ctx.fns.map((f) => fnExp(f, true)),
      `}`,
    ].join('\n')
  }

  ctx.fnImports = ctx.fns.map((fn) => {
    const name = fnName(fn)

    return {
      name,
      as: name,
      from: `#build/gql`,
    }
  })
}
