<template>
  <div class="flex flex-col gap-4">
    <UCard class="p-4">
      <div>
        Github Example
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <UInput
          v-model="githubToken"
          icon="carbon-logo-github"
          placeholder="Your Github Token"
        />

        <UButton
          :disabled="!githubToken"
          @click="setToken"
        >
          Set Token
        </UButton>

        <UButton @click="clearToken">
          Clear Token
        </UButton>
      </div>

      <div class="mt-4 flex flex-wrap gap-3 items-center">
        <UButton
          :disabled="!githubToken"
          @click="refresh"
        >
          Load @me
        </UButton>
      </div>
    </UCard>

    <UCard class="p-4">
      <p v-if="data">
        Logged in as {{ data?.viewer?.login }}
      </p>
      <p v-else>
        Not logged in
      </p>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
const githubToken = useState<string | null | undefined>()

const { data, refresh } = await useAsyncGql({
  operation: 'viewer',
  client: 'github'
})

const setToken = () => useGqlToken(githubToken.value, { client: 'github' })

const clearToken = () => useGqlToken(null, { client: 'github' })
</script>
