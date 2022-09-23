import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['nuxt-graphql-client'],

  'graphql-client': {
    // load queries from the playground
    documentPaths: ['../../../playground/queries']
  },

  runtimeConfig: {
    public: {
      GQL_HOST: 'https://api.spacex.land/graphql'
    }
  }
})
