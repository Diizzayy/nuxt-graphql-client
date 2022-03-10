<h1 align="center">nuxt-graphql-client</h1>

<p align="center">⚡️ Minimal GraphQL Client + Code Generation for Nuxt</p>

<p align="center">
  <a href="https://github.com/diizzayy/nuxt-graphql-client/actions?query=branch%3Amain+event%3Apush">
    <img alt="CI" src="https://github.com/diizzayy/nuxt-graphql-client/actions/workflows/ci.yml/badge.svg?branch=main"/>
  </a>
  
  <a href="https://npmjs.com/package/nuxt-graphql-client">
      <img alt="Version" src="https://img.shields.io/npm/v/nuxt-graphql-client?color=blue&style=flat-square"/>
  </a>
  
  <a href="https://npmjs.com/package/nuxt-graphql-client">
      <img alt="Downloads" src="https://img.shields.io/npm/dt/nuxt-graphql-client?color=blue&style=flat-square"/>
  </a>
  
  <a href="https://opensource.org/licenses/MIT">
      <img alt="MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square"/>
  </a>
</p>

> ⚡️ Minimal GraphQL Client + Code Generation for Nuxt

## Features

- Zero Configuration
- 🚀 [Nuxt 3](https://v3.nuxtjs.org) Support
- Full Typescript Support
- HMR (Hot Module Reload) for GraphQL documents
- Minimal [GraphQL Client](https://github.com/prisma-labs/graphql-request#graphql-request) + [Code Generation](https://www.graphql-code-generator.com/)

[![StackBlitz](https://img.shields.io/badge/StackBlitz-Edit-blue?style=flat-square&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAABECAYAAAD+1gcLAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5AINBw4X0bTGRQAABSxJREFUaN7VmVtsFFUYx//fmQW79bbd2QKpaIIaDcGoifFBEgMGqTTRRA01SgxE5Rbi7QG6S3lgo9J2twpeotxEQlCigLdoQwJ4ARN9QB9MRCNRDBdRzE7LJbTSmTl/H4BYStmd2Z3tDOdt5lzml/9833fO9x0gYi2xgom6Tt5aapyKEnRDlrVGPzfGT+G3SwZ87HLGT8f5uYD7jmSl99IAX80RfTY3A5wMqDVepoQPnqVKHtMbAN4PyJeFtPwafXBSknG9UoDHAIDQq7xODRU8mdc5Aeaeffy7O2F8GnnwZM5dKsCic88CrMU8sSMNbubdZwTIDnjlOoZa52eNYQc3c84sEK+d/1a6ji2UA5EFN3POw4C8fcYy/m+a3p1y2MGTOXsqIJsAxAZ1Hei53tgeSfBkBycK1McALrswJGIVHhE3cuD1ed4uorsAXD5Ed7/hqvXlrFtV8LpO3qKpdwJIDLn/AB/+s0SORgp8VJ43KK23AzAvNsagWlXu+lKV6LGc14itvyEwrsiwX6wWNQEijITiY9pYD1vvKAENAG+VC40hQlNlNt3Bq22lt4EYX2Jor6PVe5V8KzDFG7KsFXE/A3GHB/vcdHyx9IQPnuXI/ji3CuRuT+N1+U4ZHPhmGqk43yXY5C0ccE9hsfwQLjgp5n69hmCz9ylYGcRPrgg8ldfLIXjSx5RjNX3GB6GCm3m3ncDz/v4QNnjJ4KsGbubdVhAZ35YFtTaoKOY7jps5dwGIZf73aH7dnZa9QYH72vLNDmcmRNaX86eEnGvT2BoIdA0o3pV2HgRkS9C7bXnRDGlPypmd9r2AvB8FaAFetDJGvqTiyU7eJWeOp1cgfOo3rRbj6ZJRJdHB20TrrkhAAxutXvVsSedMtfEmGno3gNHhM8snVp80IytO0The18HraOgdkYCm7KyLy6MDoYdUfNQyjnZjeheAm8NXmt/FlDH16CI5dUHaN/DhypeZUqK/AkomAsMQ8fCjq41GKy0nim75ydd51UjX3QZgQgQccV/MUfcVSzYM4Mw1hnPa7QJkYgSgD2qqe6xWOVL8kLWaI3ptbgFkUgSgjwpUY09GDpY8ZJnH9UsExhPYH8CuVgtgTJlzC5pqipXxdpUSaF3FzLkdANJleOIJETWlkJbvh78glOVIM64PARjlc2afiGoqtMiuUMoTqRp3ehnQtpDNfqEDBdeC+T6nuELOLGRiXVVPJC5u2xwP6L0+1qOQ8wqZWNmpXECK6wV+RBCipRLoQBRvyLL2dFwfBlDnTWos7W4xXgi3IATg31p3hldoEG8EAR0IuEC8OuUGK62eCyoYVARutvNOL9VZQD6yxqmnKqmHB6u46PkejHp7XVxmlHOzVhXnTKxgwujXhzH0bdo56m9jymgcKhEITXFl61lFoYV7BMa0akCjkjqJEHOKdP/U7xhNJ1vlZLXOv2Upnmq3JxfJlH4XRzWebBWrmgf38hRXav5F4vSfjqGmHl8if1W/NuSzjWljvW3oQxh0Ly9AQRtqUvdC+Xk4UiXfpmLH9JzB0CBOQKtpwwXtHzxLJcTsQW97FdQDQVxIVc3GUzVuEyEDb4z7NTndysju4c6qfSlOOc8pXQof78nEtoVRDvDsnMlXeK04+o+ztRgSnNOdjq1DSM2z4uLoeecKSCQWhgntXfEsY2ZcHwDQAMESq8VoC7ty5EnxZK37EIAGAV6NArT3c3def2Hm3HdASlSYSipe384bAR6x+tTsIBOBqoMTzlirVz2BrOgoWcF/mizikfkwKiQAAAAASUVORK5CYII=)](https://stackblitz.com/github/diizzayy/nuxt-graphql-client-demo)

## Install

```sh
# using yarn
yarn add nuxt-graphql-client

# using npm
npm install nuxt-graphql-client --save
```

## Usage

### Nuxt

1. Add `nuxt-graphql-client` to the `buildModules` section of `nuxt.config.ts` [Configuration Options](#configuration)

```ts
import { defineNuxtConfig } from 'nuxt3'

export default defineNuxtConfig({
  buildModules: ['nuxt-graphql-client'],

  gql: {
    // configuration
  },
})
```

2. Set runtime config `GQL_HOST` to the URL of your GraphQL API

```ts
publicRuntimeConfig: {
  GQL_HOST: 'https://api.spacex.land/graphql' // SpaceX GraphQL API for example
}
```

3. Write your GraphQL Queries / Mutations. (Must be written in .gql / .graphql files)

Example using the [SpaceX GraphQL API](https://api.spacex.land/graphql):

`./queries/starlink.gql` - This query will for the SpaceX API to retrieve the launches for Starlink missions.

```gql
query launches($sort: String = "launch_year", $order: String = "desc") {
  launches(sort: $sort, order: $order, find: { mission_name: "Starlink" }) {
    id
    details
    mission_name
    launch_year
    launch_success
    links {
      article_link
      flickr_images
    }
    rocket {
      rocket_name
      rocket_type
    }
  }
}
```

With [`autoImport`](#configuration) enabled, the query above can be accessed in the Vue portion of your app by prefixing the Operation name (`launches` in this example with the [Function Prefix](#configuration)).
The `launches` query can be executed as `GqlLaunches()`

4. ⚡️ You're ready to go!

Run `yarn dev` for the `nuxt-graphql-client` module to generate the necessary types and functions.

- HMR (Hot Module Reload) for your GraphQL documents.
- Access the types from the GraphQL document(s) that you've written.
- 🚀 Utilize the auto-imported `useGql` composable to execute all your queries / mutations.
- With [`autoImport`](#configuration) enabled, your queries / mutations are accessible within your app by calling the Operation name prefixed by [Function Prefix](#configuration)

```ts
<script lang="ts" setup>
const { data } = await useAsyncData('starlink', () => GqlLaunches({ order: 'desc' }))
</script>
```

Your data is now fully-typed based on it's pertinent GraphQL Document.

## Configuration

This module can be configured by adding a `gql` section inside your `nuxt.config.ts`

```ts
import { defineNuxtConfig } from 'nuxt3'

export default defineNuxtConfig({
  gql: {
    /**
     * Prevent codegen from printing to console in dev mode
     *
     * @type boolean
     * @default true
     */
    silent: boolean,

    /**
     * Enable hot reloading for GraphQL documents
     *
     * @type boolean
     * @default true
     */
    watch: boolean,

    /**
     * Auto import functions based on the operation names of your queries & mutations
     *
     * @type boolean
     * @default true
     */
    autoImport: boolean,

    /**
     * Prefix for auto imported functions
     *
     * @type string
     * @default 'Gql'
     */
    functionPrefix: string,

    /**
     * Path to folder(s) containing .gql or .graphql files. Can be omitted,
     * module will automatically search for GraphQL Documents in the project's root directory.
     *
     * @note Useful for mono repos.
     *
     * @type string[]
     * @example ['../shared/queries']
     * */
    documentPaths: string[],

    /**
     * Only generate the types for the operations in your GraphQL documents.
     * When set to true, only the types needed for your operations will be generated.
     * When set to false, all types from the GraphQL schema will be generated.
     *
     * @type boolean
     * @default true
     * */
    onlyOperationTypes: boolean
  },

  publicRuntimeConfig: {
    /**
     * URL pointing to a GraphQL endpoint
     *
     * @type string
     */
    GQL_HOST: string,
  },
})
```

## License

[MIT](./LICENSE) License © 2022 [Diizzayy](https://github.com/diizzayy)
