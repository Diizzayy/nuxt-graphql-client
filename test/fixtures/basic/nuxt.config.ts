import { defineNuxtConfig } from 'nuxt'
import MyModule from '../../..'

export default defineNuxtConfig({
  modules: [MyModule],

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
