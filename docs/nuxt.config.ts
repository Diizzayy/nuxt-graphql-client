export default defineNuxtConfig({
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
