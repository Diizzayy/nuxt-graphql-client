export default defineNuxtConfig({
  modules: ['../../../src/module'],
  'graphql-client': {
    clients: {
      default: {
        host: 'https://spacex-production.up.railway.app/',
        schema: './test/fixtures/nuxt-app/schema.graphql'
      },
      test: {
        host: 'http://localhost:4000/graphql',
        tokenStorage: {
          mode: 'cookie',
          name: 'gql:test-token'
        }
      }
    }
  }
})
