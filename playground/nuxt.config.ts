import { defineNuxtConfig } from 'nuxt'
import MyModule from '..'

export default defineNuxtConfig({
  buildModules: [MyModule],

  'graphql-client': { },

  runtimeConfig: {
    public: {
      GQL_HOST: 'https://api.spacex.land/graphql'
    }
  }
})
