export default defineNuxtConfig({
  modules: ['@nuxt/ui', 'nuxt-graphql-client'],

  runtimeConfig: {
    public: {
      GQL_HOST: 'https://nuxt-gql-server-2gl6xp7kua-ue.a.run.app/query'
    }
  }
})
