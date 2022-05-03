---
title: Quick Start
description: 'Learn how to use nuxt-graphql-client module in your Nuxt 3 application.'
category: Getting Started
position: 2
---

## Setup

1. **Add `nuxt-graphql-client` dependency to your project**

    <code-group>
      <code-block label="Yarn" active>

      ```bash
      yarn add nuxt-graphql-client
      ```

      </code-block>
      <code-block label="NPM">

      ```bash
      npm install nuxt-graphql-client
      ```

      </code-block>
    </code-group>

2. **Enable the module in your nuxt configuration**

    ```ts[nuxt.config.ts]
    import { defineNuxtConfig } from 'nuxt'

    export default defineNuxtConfig({
      buildModules: ['nuxt-graphql-client'],
    })
    ```

3. **Provide the URL to your GraphQL API**

    This can be done in either the nuxt configuration or via a `.env` file. 

    However though, Adding the `GQL_HOST` variable to your `.env` would overwrite the `GQL_HOST` value defined in the nuxt configuration.

    The example below uses the public [SpaceX GraphQL API](https://api.spacex.land/graphql).

    <code-group>
      <code-block label="Nuxt Config" active>

      ```ts[nuxt.config.ts]
      import { defineNuxtConfig } from 'nuxt'

      export default defineNuxtConfig({
        buildModules: ['nuxt-graphql-client'],

        runtimeConfig: {
          public: {
            GQL_HOST: 'https://api.spacex.land/graphql' // overwritten by process.env.GQL_HOST
          }
        }
      })
      ```

      </code-block>
      <code-block label=".env">

      ```bash[.env]
      GQL_HOST="https://api.spacex.land/graphql"
      ```

      </code-block>
    </code-group>

4. **Write your GraphQL queries / mutations**

    <alert>

      Must be written within in `.gql / .graphql` files. Writing Operations with SFC components is **not supported**.
      <br/><br/>
      `nuxt-graphql-client` will automatically parse your GraphQL documents and generate the corresponding GraphQL queries / mutations.

    </alert>

    `./nuxt-app/queries/starlink.gql` - This will query the SpaceX API to retrieve the launches for Starlink missions.

    ```graphql[starlink.gql]
    query launches($limit: Int = 5) {
      launches(limit: $limit) {
        id
        launch_year
        mission_name
      }
    }
    ```

    Given the query above, the following function will be generated and accessible via `GqlLaunches()`. The Operation name (launches) in this example, is [prefixed with `Gql`](configuration#functionprefix) to avoid naming conflicts.

5. **Code Generation**

    Run `yarn dev` for the module to generate the necessary types and functions for all GraphQL queries / mutations.

    Your data will be fully-typed based on it's pertinent GraphQL Document.

6. **You're ready to go! ⚡️**

    Below is an example using the `launches` query written earlier.

    ```vue[app.vue]
    <template>
      <div>
        <h2>Starlink Launches</h2>

        <p v-for="(entry, i) of data?.launches" :key="entry.id">
          {{ i + 1 }}. Mission Name: {{ entry.mission_name }} ({{
            entry.launch_year
          }})
        </p>
      </div>
    </template>

    <script lang="ts" setup>
    const { data } = await useAsyncData('starlink', () => GqlLaunches({ limit: 10 }));
    </script>
    ```

    [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/diizzayy/nuxt-graphql-client-demo)
