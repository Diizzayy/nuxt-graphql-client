<template>
  <div>
    <UCard>
      <div>
        <UButton @click="refresh()">
          Refresh
        </UButton>
      </div>

      <p>Launch Count: {{ data?.launches.length || 0 }}</p>

      <div v-if="!pending" class="launches mt-4">
        <div v-for="(entry, i) in data?.launches" :key="entry.id">
          <div v-if="entry?.links?.patch?.small" class="thumbnail">
            <img
              class="lazyload"
              src="https://placehold.co/150"
              :data-src="entry?.links.patch?.small"
              :alt="entry.name || `Launch ${i}`"
            />
          </div>

          <div v-else>
            <div class="thumbnail">
              <img
                src="https://placehold.co/150"
                :alt="entry.name || `Launch ${i}`"
              />
            </div>
          </div>

          <h2>{{ `${entry.name} (${new Date(entry.date).getFullYear()})` }}</h2>
          <p>Launch Status: {{ entry.success ? '🚀' : '🪂' }}</p>

          <p v-if="entry.links?.article">
            More info:
            <a :href="entry.links?.article" target="_blank">Read Article</a>
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
useHead({ script: [{ async: true, src: 'https://cdn.jsdelivr.net/npm/lazysizes@5.3.2/lazysizes.min.js' }] })

const { data, error, pending, refresh } = await useAsyncGql('launches', { limit: 10 })

if (error.value) {
  // eslint-disable-next-line no-console
  console.error(error.value)
}
</script>

<style>
img {
  width: 100%;
  height: 100%;
  max-height: 100%;
  object-fit: cover;
  object-position: bottom;
}

.thumbnail {
  height: 200px;
}

.launches {
  display: grid;
  gap: 2rem;
  grid: auto-flow dense / repeat(auto-fill, minmax(160px, 1fr));
}
</style>
