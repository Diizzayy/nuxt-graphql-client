<template>
  <p>Crew Name: {{ data?.crew?.name || 'Unknown' }}</p>
</template>

<script lang="ts" setup>
const GqlInstance = useGql()

const { data } = await useAsyncData(() => GqlInstance('crew'))
</script>
