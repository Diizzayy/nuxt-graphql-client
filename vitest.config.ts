import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        lib: ['ES2020'],
        moduleResolution: 'bundler',
        types: ['vitest/globals', 'node'],
        resolveJsonModule: true,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true
      }
    }
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './src'),
      '@': resolve(__dirname, './src')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    // By default, run unit tests only. Integration tests are run via `pnpm test`
    include: process.env.INTEGRATION_TESTS
      ? ['test/**/*.test.ts']
      : ['test/utils.test.ts', 'test/context.test.ts', 'test/generate.test.ts', 'test/module-config.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'playground/**',
        'examples/**',
        'docs/**',
        '**/*.d.ts',
        'test/**',
        '*.config.*'
      ]
    }
  }
})
