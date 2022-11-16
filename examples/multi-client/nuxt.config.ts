export default defineNuxtConfig({
  modules: ['nuxt-graphql-client'],

  runtimeConfig: {
    public: {
      'graphql-client': {
        codegen: false,
        clients: {
          spacex: 'https://spacex-api-2gl6xp7kua-ue.a.run.app/graphql',
          rmorty: 'https://rickandmortyapi.com/graphql',
          countries: 'https://countries.trevorblades.com/graphql',
          todos: 'https://nuxt-gql-server-2gl6xp7kua-ue.a.run.app/query'
        }
      }
    }
  }
})
