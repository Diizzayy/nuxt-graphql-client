<template>
  <div>
    <button @click="refresh()">
      Make Request
    </button>

    <p v-if="pending">
      pending
    </p>

    <!-- <template v-else> -->
    <p v-if="error">
      error - {{ JSON.stringify(error, null, 2) }}
    </p>

    <p v-if="data">
      data - {{ JSON.stringify(data, null, 2) }}
    </p>
    <!-- </template> -->
  </div>
</template>

<script lang="ts" setup>
useGqlError((error) => {
  try {
    console.log('🟩 useGqlError', !!error)

    const cookies = useRequestHeaders()
    console.log('🟩 useRequestHeaders', Object.keys(cookies)?.length)
  } catch (err) {
    console.error('🟥 useGqlError() Error', err)
  }
})

// TESTING:
// `limit` expects a number, passing a string will cause an error
const { data, refresh, pending, error } = await useAsyncData('starlink', () => GqlLaunches({ limit: '1' }))
</script>

<style>
* {
  box-sizing: border-box;
}

img {
  width: 100%;
  height: 100%;
  max-height: 100%;
  object-fit: cover;
  object-position: bottom;
}

.thumbnail {
  height: 300px;
}

.launches {
  display: grid;
  gap: 1rem;
  grid: auto-flow dense / repeat(auto-fill, minmax(260px, 1fr));
}
</style>
