<template>
  <p>Mission Name: {{ data?.mission?.name || 'Unknown' }}</p>
</template>

<script lang="ts" setup>
const { data } = await useAsyncGql('mission')
</script>
