export default defineNuxtConfig({
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
