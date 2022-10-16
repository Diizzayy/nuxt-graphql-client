import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['nuxt-graphql-client'],

  runtimeConfig: {
    public: {
      'graphql-client': {
        clients: {
          spacex: 'https://api.spacex.land/graphql',
          rmorty: 'https://rickandmortyapi.com/graphql',
          countries: 'https://countries.trevorblades.com/graphql',
          todos: 'https://nuxt-gql-server-2gl6xp7kua-ue.a.run.app/query'
        }
      }
    }
  }
})
