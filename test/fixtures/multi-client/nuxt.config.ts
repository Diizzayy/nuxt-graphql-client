import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['nuxt-graphql-client'],

  runtimeConfig: {
    public: {
      'graphql-client': {
        clients: {
          spacex: 'https://api.spacex.land/graphql',
          rmorty: 'https://rickandmortyapi.com/graphql'
        }
      }
    }
  }
})
