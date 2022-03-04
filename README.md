<h1 align="center">nuxt-gql</h1>

<p align="center">⚡️ Minimal GraphQL Client + Code Generation for Nuxt 3</p>

<p align="center">
  <a href="https://www.npmjs.com/package/nuxt-gql">
    <img src="https://img.shields.io/npm/v/nuxt-gql?color=398AB9&amp;label=" alt="NPM version"/>
  </a>
</p>

<p align="center">
  <a href="https://github.com/diizzayy/nuxt-gql/actions?query=branch%3Amain+event%3Apush">
    <img alt="CI" src="https://github.com/diizzayy/nuxt-gql/actions/workflows/ci.yml/badge.svg?branch=main"/>
  </a>
  
  <a href="https://npmjs.com/package/nuxt-gql">
      <img alt="Version" src="https://img.shields.io/npm/v/nuxt-gql?color=blue&style=flat-square"/>
  </a>
  
  <a href="https://npmjs.com/package/nuxt-gql">
      <img alt="Downloads" src="https://img.shields.io/npm/dt/nuxt-gql?color=blue&style=flat-square"/>
  </a>
  
  <a href="https://opensource.org/licenses/MIT">
      <img alt="MIT" src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square"/>
  </a>
</p>

> ⚡️ Minimal GraphQL Client + Code Generation for Nuxt 3

## Features

- Zero Configuration
- 🚀 [Nuxt 3](https://v3.nuxtjs.org) Support
- Full Typescript Support
- HMR (Hot Module Reload) for GraphQL documents
- Minimal [GraphQL Client](https://github.com/prisma-labs/graphql-request#graphql-request) + [Code Generation](https://www.graphql-code-generator.com/)

## Install

```sh
# using yarn
yarn add nuxt-gql

# using npm
npm install nuxt-gql --save
```

## Usage

### Nuxt

1. Add `nuxt-gql` to the `buildModules` section of `nuxt.config.ts` [Configuration Options](#configuration)

```ts
import { defineNuxtConfig } from 'nuxt3'

export default defineNuxtConfig({
  buildModules: ['nuxt-gql'],

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

Run `yarn dev` for the `nuxt-gql` module to generate the necessary types and functions.

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
