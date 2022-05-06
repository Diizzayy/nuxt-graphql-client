---
title: Authentication
description: 'Configure the authentication header for GraphQL API(s).'
category: Advanced
position: 5
---

## Authenticated Requests

Make authenticated requests to the GraphQL APIs.

`nuxt-graphql-client` provides a [`useGqlToken`](/getting-started/composables#usegqltoken) composable to attach an authorization header to subsequent requests.

Any requests made after the token is set will be sent with the authenticaion header configured by `useGqlToken`.

```vue[login.vue]
<script lang="ts" setup>
// ... your auth code
// ... retrieve auth code

function afterLogin(idToken: string) {
    useGqlToken(idToken)
}
</script>
```

More information at [useGqlToken composable](/getting-started/composables#usegqltoken)

### Custom Token

The default Authorization header is `Authorization`. If your GraphQL API requires a different name, you can specify it either:
- In the Nuxt Configuration
- In an Environment Variable
- When using the [`useGqlToken`](/getting-started/composables#usegqltoken) composable.

Given the [client](multiple-clients) name `shopify`

- Add the token to the `.env` file as follows:
    ```sh[.env]
    GQL_SHOPIFY_TOKEN="your_access_token"
    GQL_SHOPIFY_TOKEN_NAME="X-Shopify-Access-Token"
    ```

- Or, in the Nuxt Configuration:
    ```ts[nuxt.config.ts]
    import { defineNuxtConfig } from 'nuxt'

    export default defineNuxtConfig({
        modules: ['nuxt-graphql-client'],

        runtimeConfig: {
            public: {
                'graphql-client': {
                    clients: {
                        default: 'https://api.spacex.land/graphql', // overwritten by process.env.GQL_HOST 
                        shopify: {
                            host: '', // overwritten by process.env.GQL_SHOPIFY_HOST 
                            token: {
                                name: 'X-Shopify-Access-Token', // overwritten by process.env.GQL_SHOPIFY_TOKEN_NAME
                                value: 'your_access_token' // overwritten by process.env.GQL_SHOPIFY_TOKEN
                            }
                        }
                    }
                }
            }
        }
    })

### Server Side Only

Authentication tokens added to either the Nuxt configuration or environment variables will only live server side, hence these tokens can only be used for *Build Time SSR* or [*Code Generation Introspection*](#code-generation-introspection)

<code-group>
<code-block label="Nuxt Config" active>

```ts[nuxt.config.ts]
import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
    modules: ['nuxt-graphql-client'],

    runtimeConfig: {
        public: {
            'graphql-client': {
                clients: {
                    default: 'https://api.spacex.land/graphql',
                    github: {
                        host: 'https://api.github.com/graphql',
                        token: '<your-github-token>' // overwritten by process.env.GQL_GITHUB_TOKEN
                    }
                }
            }
        }
    }
})
```

</code-block>
<code-block label=".env">

```bash[.env]
GQL_GITHUB_TOKEN="<your-github-token>"
```

</code-block>
</code-group>


### Retain Token on Client-Side

To circumvent the default behavior mentioned in the [Server Side Only](/advanced/authentication#server-side-only) section, you can use the `retainToken` flag to force a token set at config-level to be retained on the client side.

<alert type="danger">

This flag exposes the token to the client side, which can be a security risk. <br>
Please use this flag only if you understand the security implications.

</alert>

```ts[nuxt-config.ts]
runtimeConfig: {
    public: {
        'graphql-client': {
            clients: {
                default: 'https://api.spacex.land/graphql',
                github: {
                    host: 'https://api.github.com/graphql',
                    token: '<your-github-token>', // overwritten by process.env.GQL_GITHUB_TOKEN
                    retainToken: true
                }
            }
        }
    }
}
```

## Code Generation Introspection

[GraphQL Schema Introspection](https://graphql.org/learn/introspection) enables you to query a GraphQL server for information about it's underlying schema. This includes data such as types, fields, queries, mutations, and even the field-level descriptions

Authorization is often required to run the introspection query for many GraphQL APIs (e.g. [Github GraphQL API](https://api.github.com/graphql)).

This module attempts to generate types for your GraphQL APIs using the introspection query, Hence this process may fail if the API requires authentication.

In this instance, an authentication token must be provided to the pertinent client by either:
- Configuring the client in your nuxt configuration
- Adding the token to your `.env` **(Recommended)**

<alert>

**This token will only live server-side. It will not be passed to the browser.**

</alert>

### Provide Auth Token
```sh[.env]
GQL_TOKEN="your_access_token"
```

### Provide Token for specific client

Given the [client](multiple-clients) name `github`, add the token to the `.env` file as follows:
```sh[.env]
GQL_GITHUB_TOKEN="your_access_token"
```
