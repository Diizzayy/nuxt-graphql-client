import { fileURLToPath } from 'node:url'

export default {
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,js}'],
      exclude: [
        'src/**/*.d.ts',
        'src/types.d.ts',
        'test/**',
        'examples/**',
        'playground/**',
        'docs/**'
      ]
    },
    include: ['test/unit/**/*.test.ts', 'test/unit/**/*.integration.test.ts'],
    exclude: ['test/basic.test.ts', 'test/multi-client.test.ts']
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        target: 'ESNext',
        module: 'ESNext',
        moduleResolution: 'bundler'
      }
    }
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./', import.meta.url)),
      '#gql': fileURLToPath(new URL('./.nuxt/gql', import.meta.url))
    }
  }
}
