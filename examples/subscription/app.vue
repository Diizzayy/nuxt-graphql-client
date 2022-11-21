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
          <div>
            <p>WS Status: {{ wsStatus }}</p>
          </div>

          <div v-if="wsStatus === 'connected'">
            <p id="connected">
              🟩
            </p>
          </div>

          <div>
            <input id="todoInput" v-model="todoInput" type="text">
          </div>

          <NButton @click="createTodo()">
            Create Todo
          </NButton>
        </div>

        <div id="todoResponse">
          {{ data }}
        </div>
      </div>
    </NuxtExampleLayout>
  </div>
</template>

<script lang="ts" setup>
import type { TodoAddedSubscription } from '#gql'

const wsStatus = ref<string>('')
const todoInput = ref(`Random Text ${Math.random().toString()}`)
const data = ref<TodoAddedSubscription['todoAdded'] | null>(null)

onMounted(() => {
  const { subscribe, onResult, onError, unsubscribe } = GqlTodoAdded(null, {
    on: {
      opened: () => (wsStatus.value = 'opened'),
      connected: () => (wsStatus.value = 'connected'),
      connecting: () => (wsStatus.value = 'connecting'),
      closed: () => (wsStatus.value = 'closed')
    }
  })

  onResult((result) => {
    data.value = result.data?.todoAdded
  })

  subscribe()
})

const createTodo = () => GqlCreateTodo({ todo: { text: todoInput.value } })
</script>
