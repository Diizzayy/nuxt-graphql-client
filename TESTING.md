# Testing Guide

This project uses [Vitest](https://vitest.dev/) for testing with two types of tests:

## Test Types

### 1. Unit Tests (Fast, No Network Required)
Unit tests focus on testing individual functions and modules in isolation. They run quickly and don't require network access or external dependencies.

**Location:** `test/*.test.ts` (excluding `basic.test.ts` and `multi-client.test.ts`)

**Coverage:**
- `test/utils.test.ts` - Document mapping and GraphQL operation extraction
- `test/context.test.ts` - Context preparation and template generation
- `test/generate.test.ts` - Code generation and schema configuration
- `test/module-config.test.ts` - Type validation for module configuration

**Run unit tests:**
```bash
pnpm test:unit
# or
npx vitest run
```

**Watch mode:**
```bash
pnpm test:watch
# or
npx vitest
```

### 2. Integration Tests (Requires Network & Nuxt Setup)
Integration tests verify end-to-end functionality with real GraphQL APIs and Nuxt application setup.

**Location:**
- `test/basic.test.ts` - Basic single-client functionality
- `test/multi-client.test.ts` - Multi-client configuration

**Run integration tests (full suite):**
```bash
pnpm test
```

This command:
1. Prepares the development environment
2. Prepares example projects
3. Runs all tests including integration tests

**Note:** Integration tests require:
- Network connectivity
- Access to external GraphQL APIs (SpaceX, Rick & Morty, etc.)
- Nuxt build and setup process

## Test Coverage

Current test coverage:
- **Unit Tests:** 68 tests across 4 files
- **Integration Tests:** 7 tests across 2 files

### Unit Test Details

#### utils.test.ts (13 tests)
Tests for utility functions:
- Document to client mapping based on file naming conventions
- GraphQL operation extraction from .gql/.graphql files
- Support for multiple operations per file
- Fragment handling

#### context.test.ts (14 tests)
Tests for context preparation:
- SDK template generation
- Function name extraction
- Import and declaration generation
- Multi-client support
- Custom function prefixes

#### generate.test.ts (10 tests)
Tests for code generation:
- Schema preparation from host URLs
- Authentication header handling
- Server-only headers
- Token configuration (Bearer, API keys, etc.)
- Multiple client generation
- Codegen options (scalars, enums, etc.)

#### module-config.test.ts (31 tests)
Type validation tests:
- GqlConfig options
- GqlClient configuration
- GqlCodegen options
- Token storage modes
- CORS and fetch options

## Running Tests in CI

For CI environments, you may want to run only unit tests to avoid network dependencies:

```bash
# Fast CI tests (unit only)
pnpm test:unit

# Full CI tests (requires network)
pnpm test
```

## Writing Tests

### Unit Test Example
```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '../src/my-module'

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input')
    expect(result).toBe('expected')
  })
})
```

### Mocking File System
When testing functions that read files, use Vitest's mocking:

```typescript
import { vi } from 'vitest'

vi.mock('node:fs', async () => {
  const actual = await vi.importActual('node:fs')
  return {
    ...actual,
    promises: {
      readFile: vi.fn(async (path: string) => {
        return 'mocked content'
      })
    }
  }
})
```

## Test Configuration

- **vitest.config.ts** - Main test configuration
  - Unit tests: `test/*.test.ts` (excluding integration tests)
  - Integration tests: Enabled with `INTEGRATION_TESTS=1` env var

- **tsconfig.test.json** - TypeScript configuration for tests

## Debugging Tests

```bash
# Run specific test file
npx vitest run test/utils.test.ts

# Run with verbose output
npx vitest run --reporter=verbose

# Run with coverage
npx vitest run --coverage
```

## Best Practices

1. **Keep unit tests fast** - Mock external dependencies
2. **Test behavior, not implementation** - Focus on inputs/outputs
3. **Use descriptive test names** - Make failures easy to understand
4. **Organize with describe blocks** - Group related tests
5. **Test edge cases** - Empty arrays, null values, error conditions
