export default defineNuxtConfig({
  compatibilityDate: '2024-11-05',

  devtools: { enabled: true },

  extends: ['@nuxt-themes/docus'],

  colorMode: {
    preference: 'dark'
  },

  content: {
    highlight: {
      preload: ['graphql']
    }
  }
})
