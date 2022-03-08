import type { AutoImport } from '@nuxt/schema'

export interface GqlContext {
  template?: string
  fns?: string[]
  fnImports?: AutoImport[]
  generateImports?: () => string
  generateDeclarations?: () => string
}

export function prepareContext(ctx: GqlContext, prefix: string) {
  ctx.fns = ctx.template?.match(/\w+\s*(?=\(variables)/g)?.sort() || []

  const fnName = (fn: string) =>
    prefix + fn.charAt(0).toUpperCase() + fn.slice(1)

  const fnExp = (fn: string, typed = false) => {
    const name = fnName(fn)

    if (!typed)
      return `export const ${name} = (...params) => useGql()['${fn}'](...params)`

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
