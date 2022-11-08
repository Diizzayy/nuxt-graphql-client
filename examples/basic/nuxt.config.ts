export default defineNuxtConfig({
  modules: ['@nuxt/ui', 'nuxt-graphql-client'],

  runtimeConfig: {
    public: {
      GQL_HOST: 'https://api.spacex.land/graphql'
    }
  }
})
