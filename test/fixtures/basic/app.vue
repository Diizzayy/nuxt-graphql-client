<template>
  <p>Launch Count: {{ data?.launches.length || 0 }}</p>
</template>

<script lang="ts" setup>
const { data, error } = await useAsyncGql('launches')

if (error.value) {
  // eslint-disable-next-line no-console
  console.error(error.value)
}
</script>
