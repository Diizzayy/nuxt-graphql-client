import { $fetch } from 'ofetch'

await Promise.all([
  // ensure rick and morty api is ready
  $fetch('https://rickandmortyapi.com'),

  // ensure todo api is ready
  $fetch('https://nuxt-gql-server-2gl6xp7kua-ue.a.run.app'),

  // ensure spacex api is ready
  $fetch('https://spacex-api-2gl6xp7kua-ue.a.run.app'),

  // ensure country api is ready
  $fetch('https://countries.trevorblades.com', {
    method: 'post',
    body: { query: '{ continents { name } }' }
  })
])
