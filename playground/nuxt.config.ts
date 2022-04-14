import { defineNuxtConfig } from 'nuxt3'
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
