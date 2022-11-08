<template>
  <p>First Episode: {{ data?.episode?.name || 'Unknown' }}</p>
</template>

<script lang="ts" setup>
const { data } = await useAsyncGql('first_episode')
</script>
