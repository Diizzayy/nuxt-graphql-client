export default defineNuxtPlugin(() => {
  if (process.env.NODE_ENV === 'production') { return }

  useGqlError(({ gqlErrors, client, operationName }) => {
    useNuxtApp()
    for (const gqlError of gqlErrors) {
      console.error('[nuxt-graphql-client] [GraphQL error]', {
        client,
        operationName,
        ...gqlError
      })
    }
  })
})
