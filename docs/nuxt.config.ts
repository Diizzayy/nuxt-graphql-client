import { defineNuxtConfig } from 'nuxt'

export default defineNuxtConfig({
  extends: ['./node_modules/@docus/docs-theme'],

  theme: {},

  github: {
    repo: 'nuxt-graphql-client',
    owner: 'diizzayy',
    branch: 'main',
    releases: false
  },

  content: {
    highlight: {
      preload: ['graphql']
    }
  },

  colorMode: {
    preference: 'dark'
  }
})
