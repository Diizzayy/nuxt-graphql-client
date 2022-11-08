export default defineNuxtConfig({
  extends: ['@nuxt-themes/docus'],

  colorMode: {
    preference: 'dark'
  },

  routeRules: {
    '/': { prerender: true }
  },

  content: {
    highlight: {
      preload: ['graphql']
    }
  }
})
