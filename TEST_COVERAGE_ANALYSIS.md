# Nuxt GraphQL Client - Test Coverage Analysis

## Overview
The nuxt-graphql-client is a Nuxt 3 module for integrating GraphQL with automatic code generation and composable API. The project is approximately 1,425 lines of TypeScript source code with only 63 lines of test code.

---

## 1. Source Code Structure

### Core Files (8 files, ~1,425 lines):

**Module & Setup (Main Entry Point)**
- `src/module.ts` (~322 lines): Main Nuxt module setup, configuration handling, GraphQL type generation orchestration, watch setup, and Nitro/Vite integration hooks

**Code Generation**
- `src/generate.ts` (~84 lines): Wraps @graphql-codegen/cli, configures schema preparation, handles headers/auth for introspection
- `src/context.ts` (~133 lines): Prepares runtime context, generates import/declaration code, processes operations from documents, creates mock templates

**Utilities & Types**
- `src/utils.ts` (~50 lines): Maps GraphQL documents to clients based on naming conventions, extracts operations from documents using GraphQL parser
- `src/types.d.ts` (~200+ lines): TypeScript type definitions for GqlClient, GqlConfig, GqlError, TokenOpts, TokenStorageOpts

**Runtime (2 files)**
- `src/runtime/plugin.ts` (~130 lines): Nuxt plugin initializing GraphQL clients, setting up request middleware for token/auth handling, cookie/localStorage token management
- `src/runtime/nitro.ts` (~27 lines): Nitro plugin initializing server-side GraphQL clients with auth headers
- `src/runtime/composables/index.ts` (~352 lines): Vue composables for GraphQL operations:
  - `useGql()` - Execute GraphQL operations
  - `useAsyncGql()` - SSR-friendly async data fetching
  - `useGqlToken()` - Token/auth management
  - `useGqlHeaders()` - Custom headers
  - `useGqlCors()` - CORS options
  - `useGqlHost()` - Runtime host changes
  - `useGqlError()` - Error handling

---

## 2. Current Test Coverage

### Test Files (2 files, 63 lines total):

**1. `test/basic.test.ts` (15 lines)**
```typescript
- Tests single GraphQL client integration
- Tests basic page rendering with SpaceX launches query
- Asserts content contains "Launch Count: 10"
- Uses @nuxt/test-utils with server=true
- 1 test case with 15000ms timeout
```

**2. `test/multi-client.test.ts` (48 lines)**
```typescript
- Tests multiple GraphQL client configuration
- Tests SpaceX client (launches query)
- Tests SpaceX crew endpoint
- Tests Rick and Morty client
- Tests operation chaining/composition
- Conditionally tests GitHub OAuth (requires GH_TOKEN)
- 5 base test cases + 1 conditional test
- Multiple 15000ms timeouts for API calls
```

### Test Configuration:
- **Framework**: Vitest 3.1.1
- **Test Utils**: @nuxt/test-utils 3.17.2
- **Coverage**: @vitest/coverage-v8 3.1.1
- **Test Command**: `pnpm test` runs:
  1. `pnpm dev:prepare` - Prepares module
  2. `nuxi prepare examples/basic` - Prepares basic example
  3. `nuxi prepare examples/multi-client` - Prepares multi-client example
  4. `vitest run` - Runs tests

---

## 3. Critical Test Coverage Gaps

### **Core Module Functionality NOT Tested**:

#### Module Setup & Configuration
- [ ] Module initialization with various config combinations
- [ ] Client configuration parsing and validation
- [ ] Environment variable overrides (GQL_HOST, GQL_TOKEN, etc.)
- [ ] Runtime config merging with defu
- [ ] Multiple client configuration
- [ ] Default client determination logic
- [ ] Configuration inheritance from layers

#### Code Generation
- [ ] Document discovery and filtering
- [ ] Client-to-document mapping logic (`mapDocsToClients`)
- [ ] GraphQL operation extraction (`extractGqlOperations`)
- [ ] Schema validation
- [ ] Codegen plugin configuration
- [ ] Mock template generation when codegen is disabled
- [ ] HMR regeneration on document changes

#### Authentication & Token Management
- [ ] Token storage modes (cookie vs localStorage)
- [ ] Token retrieval from cookies (server-side)
- [ ] Token retrieval from localStorage (client-side)
- [ ] Auth header construction (Bearer, custom types)
- [ ] Server-only header handling
- [ ] Token lifecycle (set, reset, refresh)
- [ ] Cookie proxy behavior

#### Composables (No Unit Tests)
- [ ] `useGql()` - Query execution, variable handling, client selection
- [ ] `useAsyncGql()` - Reactive variables, data watching, caching behavior
- [ ] `useGqlToken()` - Token overrides, refreshData option, both signatures
- [ ] `useGqlHeaders()` - Custom headers, reset functionality, respectDefaults
- [ ] `useGqlCors()` - CORS mode and credentials options
- [ ] `useGqlHost()` - Runtime host changes, URL normalization
- [ ] `useGqlError()` - Error state management, error callbacks
- [ ] Client state management (`useGqlState`)
- [ ] Error handling and error state

#### Plugin System
- [ ] Client initialization in plugin
- [ ] Request middleware setup
- [ ] Header proxying from server to client
- [ ] Cookie handling in SSR context
- [ ] Multi-client state initialization
- [ ] Nitro plugin integration
- [ ] Auth hook system (`gql:auth:init`)

#### Utils & Document Processing
- [ ] Document path resolution
- [ ] Empty document filtering
- [ ] Schema document exclusion
- [ ] Named operation validation
- [ ] Multi-client document organization

#### Build & Integration
- [ ] Nuxt hook integration (imports:extend, nitro:config)
- [ ] Vite config extension
- [ ] SSR vs client-side request handling
- [ ] Hot Module Replacement (HMR)
- [ ] Template generation and caching
- [ ] Auto-import functionality

#### Edge Cases & Error Handling
- [ ] Missing GraphQL host/schema fallback
- [ ] Invalid schema paths
- [ ] Missing operation names in documents
- [ ] Malformed GraphQL documents
- [ ] Network errors in code generation
- [ ] Token encoding/decoding edge cases
- [ ] Header merge conflicts

### **E2E Tests Limited to**:
- SpaceX API queries (launches, crew)
- Rick and Morty API queries
- GitHub OAuth (conditional)
- Basic page rendering assertions
- No assertions on generated code
- No assertions on type safety
- No error scenario testing

---

## 4. Testing Framework Details

### Framework Stack:
```json
{
  "vitest": "^3.1.1",
  "@nuxt/test-utils": "^3.17.2",
  "@vitest/coverage-v8": "^3.1.1",
  "nuxt": "^3.16.2"
}
```

### Test Script:
```bash
pnpm test
```
Executes:
1. Module preparation (builds module stub)
2. Example preparation (generates types for examples)
3. Vitest run mode (no watch)

### No Configuration Files Found:
- No `vitest.config.ts` or `vitest.config.js`
- No `jest.config.js`
- Uses default Vitest configuration

---

## 5. Coverage Metrics

| Category | Status | Details |
|----------|--------|---------|
| **Overall Test Lines** | 63 / 1,425 | **4.4% coverage** |
| **Integration Tests** | 2 files | E2E tests only, no unit tests |
| **Unit Tests** | 0 files | **NONE** |
| **Module Setup** | 0% | Not tested |
| **Composables** | 0% | 352 lines, no tests |
| **Utils** | 0% | Not tested |
| **Plugin System** | 0% | Not tested |
| **Error Handling** | ~5% | Only token/auth partially tested via E2E |
| **Type Generation** | 0% | Not tested |
| **Configuration** | ~10% | Only multi-client tested via E2E |

---

## 6. Key Missing Test Suites

### Priority 1 - Critical (Core Functionality):
1. **Module Setup Tests** - Configuration validation, initialization
2. **Composable Unit Tests** - All 7 composables with various scenarios
3. **Token/Auth Tests** - Cookie, localStorage, header injection
4. **Document Processing Tests** - Mapping, extraction, validation

### Priority 2 - Important (Code Quality):
1. **Error Handling Tests** - Invalid configs, missing schema, network errors
2. **Utils Tests** - Document mapping logic, operation extraction
3. **Plugin Tests** - SSR vs client behavior, middleware chain

### Priority 3 - Beneficial (Edge Cases):
1. **Type Generation Tests** - Codegen output validation
2. **Performance Tests** - Large document sets
3. **Integration Tests** - Multi-client scenarios beyond E2E
4. **Regression Tests** - Known issues and fixes

---

## 7. Summary

The nuxt-graphql-client project has **minimal test coverage** (4.4%) consisting of 2 integration tests that validate the module works with example applications but do not test:

- Core module functionality
- Individual composables
- Configuration handling
- Token/auth management (beyond E2E)
- Error scenarios
- Code generation specifics
- Type safety
- SSR behavior specifically

A comprehensive test suite would need **40-60+ test files** to adequately cover all functionality, with focus on unit tests for composables, utilities, and plugin systems.
