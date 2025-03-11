// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: {
      commaDangle: 'never',
      quoteProps: 'as-needed'
    },
    nuxt: {
      sortConfigKeys: false
    }
  },
  dirs: {
    src: [
      './playground'
    ]
  }
})
  .overrideRules({
    'vue/multi-word-component-names': 'off',

    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-explicit-any': 'off',

    '@stylistic/max-statements-per-line': 'off'
  })
