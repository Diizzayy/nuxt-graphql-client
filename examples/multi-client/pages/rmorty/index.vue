<template>
  <p>Name: {{ data?.character?.name || 'John Doe' }}</p>
</template>

<script lang="ts" setup>
const { data } = await useAsyncGql('character')
</script>
