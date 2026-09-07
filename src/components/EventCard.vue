<script setup>
defineProps({
  event: Object
})

defineEmits([
'register-event'
])
</script>

<template>
  <div class="card h-100 shadow-sm event-card">
    <div class="card-body">

      <h5 class="card-title">
        {{ event.title }}
      </h5>

      <p>
        {{ event.date }}
      </p>

      <p>
        {{ event.location }}
      </p>

      <button
v-if="!event.registered"
class="btn btn-success"
@click="
$emit(
'register-event',
event.id
)
"
>
Register
</button>

<span
v-else
class="badge bg-success"
>
✅ Registered
</span>

    </div>
  </div>
</template>

<style scoped>
.event-card {
  width: 100%;
}
</style>