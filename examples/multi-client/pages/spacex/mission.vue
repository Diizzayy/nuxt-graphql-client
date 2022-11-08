<template>
  <p>Mission Name: {{ data?.mission?.name || 'Unknown' }}</p>
</template>

<script lang="ts" setup>
const GqlInstance = useGql()

const { data } = await useAsyncData(() => GqlInstance('mission'))
</script>
