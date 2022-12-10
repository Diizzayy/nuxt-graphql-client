export default defineNuxtPlugin(() => {
  useGqlError((err) => {
    // Only log during development
    if (process.env.NODE_ENV !== 'production') {
      for (const gqlError of err.gqlErrors) {
        console.error('[nuxt-graphql-client] [GraphQL error]', {
          client: err.client,
          operation: err.operation,
          statusCode: err.statusCode,
          gqlError
        })
      }
    }
  })
})
