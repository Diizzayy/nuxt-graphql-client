<template>
  <div>
    <NuxtExampleLayout repo="diizzayy/nuxt-graphql-client" example="subscription" class="text-start">
      <template #name>
        <NuxtLink to="https://github.com/Diizzayy/nuxt-graphql-client/tree/refactor/ohmygql/examples/subscription">
          subscription
        </NuxtLink>
      </template>

      <div grid grid-cols-2>
        <div>
          <NButton @click="createTodo()">
            Create Todo
          </NButton>
        </div>

        <div>
          {{ data }}
        </div>
      </div>
    </NuxtExampleLayout>
  </div>
</template>

<script lang="ts" setup>
import type { TodoAddedSubscription } from '#gql'

const data = ref<TodoAddedSubscription['todoAdded'] | null>(null)

onMounted(() => {
  const { subscribe, onResult, onError, unsubscribe } = GqlTodoAdded()
  onResult((result) => {
    data.value = result.data?.todoAdded
  })
  subscribe()
})

const createTodo = () => GqlCreateTodo({
  todo: {
    text: Math.random().toString()
  }
})
</script>
