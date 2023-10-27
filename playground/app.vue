<template>
  <div>
    <button @click="refresh()">
      Refresh
    </button>

    <pre v-if="!pending">
      {{ data || error }}
    </pre>
  </div>
</template>

<script lang="ts" setup>
const { data, error, pending, refresh } = await useAsyncGql({
  operation: 'ships',
  variables: { limit: 3 }
})

if (error.value) {
  // eslint-disable-next-line no-console
  console.error(error.value)
}
</script>
