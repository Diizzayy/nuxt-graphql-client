---
title: Configuration
description: 'Configuration options for `nuxt-graphql-client`.'
category: Getting Started
position: 4
---

`nuxt-graphql-client` can be configured via [runtime configuration](https://v3.nuxtjs.org/docs/usage/runtime-config) by using either the `gql` or `graphql-client` key.

## Options

```ts
{
  watch: true,
  silent: true,
  autoImport: true,
  functionPrefix: 'Gql',
  onlyOperationTypes: true,
  documentPaths: [],
  clients: {
    default: '<GRAPHQL_HOST>',
    '<CLIENT_NAME>': {
      default: false,
      host: '<GRAPHQL_HOST>',
      token: '<TOKEN_VALUE>'
      // token: {
      //   name: '<TOKEN_NAME>',
      //   value: '<TOKEN_VALUE>'
      // },
    }
  }
}
```

## Reference

### `watch`

- Type: **boolean**
- Default: **true**

Enable hot reloading for GraphQL documents

### `silent`

- Type: **boolean**
- Default: **true**

Prevent GraphQL Code Generator from printing to console

### `autoImport`

- Type: **boolean**
- Default: **true**

Auto import functions based on the operation name of your queries & mutations

### `functionPrefix`

- Type: **string**
- Default: **`'Gql'`**

Prefix for auto imported functions

### `documentPaths`

- **Optional**
- Type: **string[]**
- Example: `['../shared/queries']`

Path to **external folder(s)** containing .gql or .graphql files.

Useful for mono repos.

### `onlyOperationTypes`

- Type: **boolean**
- Default: **true**

Only generate the types for the operations in your GraphQL documents.
When set to true, only the types needed for your operations will be generated.
When set to false, all types from the GraphQL API will be generated.

### `clients`

- Type: **string | object**

Configure your app to interact with multiple GraphQL APIs. The name of each client is the key of the object provided.

The available options are:
- `host`
    - **Required**
    - Type: **string**

- `default`
    - **Optional**
    - Type: **boolean**

    <alert>

    Only one client can be set as [default](/advanced/multiple-clients#default-client).

    </alert>

- `token`
    - **Optional**
    - Type: **`string | { name: string, value?: string }`**


<alert type="warning">

The [default client](/advanced/multiple-clients#default-client) overrides `GQL_HOST`.

</alert>


```ts[nuxt.config.ts]
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  modules: ['nuxt-graphql-client'],

  runtimeConfig: {
    public: {
      'graphql-client': {
        clients: {
          default: 'https://api.spacex.land/graphql', // process.env.GQL_HOST & process.env.GQL_TOKEN & process.env.GQL_TOKEN_NAME
          github: {
            host: 'https://api.github.com/graphql', // process.env.GQL_GITHUB_HOST
            token: 'your_access_token', // process.env.GQL_GITHUB_TOKEN & process.env.GQL_GITHUB_TOKEN_NAME
            // token: {
            //   name: 'X-Custom-Auth', // process.env.GQL_GITHUB_TOKEN_NAME
            //   value: 'your_access_token' // process.env.GQL_GITHUB_TOKEN
            // }
          }
        }
      }
    }
  }
})
```
