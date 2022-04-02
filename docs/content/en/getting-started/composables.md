---
title: Composables
description: 'Use composables provided by nuxt-graphql-client'
category: Getting Started
position: 3
---

## `useGqlCors`

Add CORS headers to subsequent requests

Parameters:
- opts: `{ mode?: string, credentials?: string, client?: string }`

```ts
useGqlCors({ credentials: 'same-origin' })
```

## `useGqlToken`

Add Authorization header to subsequent requests.

Parameters:
- token: `string`
- opts?: `{ client?: string, config?: { name?: string, type?: string } }`

### Bearer token
```ts
useGqlToken('secret_token')
```

Add `Bearer` token to a specific client
```ts
useGqlToken('my_github_token', { client: 'github' })
```

### Custom token
```ts
useGqlToken('secret_token', {
  config: {
    type: 'Bearer',
    name: 'X-Custom-Auth'
  }
})
```

## `useGqlHeaders`

Add the specified headers to subsequent requests.

Parameters:
- headers: `object`
- client?: `string`

```ts
useGqlHeaders({ 'X-Custom-Header': 'value' })
```

Add headers to a specific client.
```ts
useGqlHeaders({ 'X-CSRF-TOKEN': 'value' }, 'client-name')
```