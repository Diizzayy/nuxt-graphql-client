<template>
  <div>
    <p>First Episode: {{ data.episode.name || 'Unknown' }}</p>
    <p>Name: {{ data?.character?.name || 'John Doe' }}</p>
  </div>
</template>

<script lang="ts" setup>
const GqlInstance = useGql()

const { data } = await useAsyncData(async () => {
  const { episode } = await GqlInstance('first_episode')
  const { character } = await GqlInstance('character')
  return { episode, character }
})
</script>
