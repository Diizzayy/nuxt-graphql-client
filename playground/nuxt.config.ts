import { defineNuxtConfig } from 'nuxt'
import MyModule from '..'

export default defineNuxtConfig({
  modules: [MyModule],

  'graphql-client': { },

  runtimeConfig: {
    public: {
      GQL_HOST: 'https://api.spacex.land/graphql'
    }
  }
})
