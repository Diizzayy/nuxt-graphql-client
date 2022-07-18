<template>
  <div>
    <Script
      :async="true"
      src="https://cdn.jsdelivr.net/npm/lazysizes@5.3.2/lazysizes.min.js"
    ></Script>

    <div class="launches">
      <div v-for="entry in data?.launches" :key="entry.id">
        <div v-if="entry?.links.flickr_images[0]" class="thumbnail">
          <img
            class="lazyload"
            src="https://via.placeholder.com/150"
            :data-src="entry?.links.flickr_images[0]"
            :alt="entry.mission_name"
          />
        </div>

        <div v-else>
          <div class="thumbnail">
            <img
              src="https://via.placeholder.com/150"
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
  </div>
</template>

<script lang="ts" setup>
// const { data } = await useAsyncData('starlink', () => useGql().launches())
const { data, error } = await useAsyncData('starlink', () => GqlLaunches())

if (error.value) {
  // eslint-disable-next-line no-console
  console.error(error.value)
}
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
