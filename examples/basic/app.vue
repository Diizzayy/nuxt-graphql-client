<template>
  <div>
    <NuxtExampleLayout repo="diizzayy/nuxt-graphql-client" example="basic" class="text-start">
      <div>
        <NButton @click="refresh()">
          Refresh
        </NButton>
      </div>

      <p>Launch Count: {{ data?.launches.length || 0 }}</p>

      <div v-if="!pending" class="launches mt-4">
        <div v-for="entry in data?.launches" :key="entry.id">
          <div v-if="entry?.links.flickr_images[0]" class="thumbnail">
            <img
              class="lazyload"
              src="https://placehold.co/150"
              :data-src="entry?.links.flickr_images[0]"
              :alt="entry.mission_name"
            />
          </div>

          <div v-else>
            <div class="thumbnail">
              <img
                src="https://placehold.co/150"
                :alt="entry.mission_name"
              />
            </div>
          </div>

          <h2>{{ `${entry.mission_name} (${entry.launch_year})` }}</h2>
          <p>Launch Status: {{ entry.launch_success ? '🚀' : '🪂' }}</p>

          <p>
            More info:
            <a :href="entry.links.article_link" target="_blank">Read Article</a>
          </p>
        </div>
      </div>
    </NuxtExampleLayout>
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
