import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: ['nuxt-graphql-client'],

  'graphql-client': { },

  runtimeConfig: {
    public: {
      GQL_HOST: 'https://api.spacex.land/graphql'
    }
  }
})
