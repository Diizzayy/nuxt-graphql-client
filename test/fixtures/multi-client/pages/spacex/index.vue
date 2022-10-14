<template>
  <p>Launch Count: {{ data?.launches?.length || 0 }}</p>
</template>

<script lang="ts" setup>
const { data } = await useAsyncGql('launches')
</script>
